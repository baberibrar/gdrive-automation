import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import DriveFile, SelectFolderRequest, WatchedFolderResponse
from app.services.google_drive import download_file, get_file_metadata, list_files
from app.services.drive_watch import get_start_page_token, start_watching, stop_watching

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/drive", tags=["drive"])


@router.get("/files", response_model=list[DriveFile])
async def get_files(
    folder_id: Optional[str] = None,
    q: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    try:
        files = list_files(
            access_token=current_user.google_access_token,
            folder_id=folder_id,
            query=q,
            refresh_token=current_user.google_refresh_token,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to list files from Google Drive: {str(e)}",
        )

    return [
        DriveFile(
            id=f.get("id", ""),
            name=f.get("name", ""),
            mimeType=f.get("mimeType", ""),
            modifiedTime=f.get("modifiedTime"),
            size=f.get("size"),
            iconLink=f.get("iconLink"),
        )
        for f in files
    ]


@router.get("/files/{file_id}/download")
async def download_file_endpoint(
    file_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        metadata = get_file_metadata(
            access_token=current_user.google_access_token,
            file_id=file_id,
            refresh_token=current_user.google_refresh_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to get file metadata from Google Drive: {str(e)}",
        )

    mime_type = metadata.get("mimeType", "application/octet-stream")
    file_name = metadata.get("name", "download")

    try:
        content = download_file(
            access_token=current_user.google_access_token,
            file_id=file_id,
            mime_type=mime_type,
            refresh_token=current_user.google_refresh_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to download file from Google Drive: {str(e)}",
        )

    if mime_type.startswith("application/vnd.google-apps."):
        response_mime = "text/plain"
    else:
        response_mime = mime_type

    return Response(
        content=content,
        media_type=response_mime,
        headers={"Content-Disposition": f'attachment; filename="{file_name}"'},
    )


# ── Folder Selection & Watching ──────────────────────────────────────────


@router.post("/select-folder", response_model=WatchedFolderResponse)
async def select_folder(
    body: SelectFolderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Select a specific folder to watch. Starts Google Drive push notifications."""

    # Stop existing watch if any
    if current_user.drive_channel_id and current_user.drive_resource_id:
        try:
            stop_watching(
                access_token=current_user.google_access_token,
                channel_id=current_user.drive_channel_id,
                resource_id=current_user.drive_resource_id,
                refresh_token=current_user.google_refresh_token,
            )
        except Exception as e:
            logger.warning(f"Failed to stop previous watch: {e}")

    # Save the selected folder
    current_user.watched_folder_id = body.folder_id
    current_user.watched_folder_name = body.folder_name

    # Get the page token for tracking changes from this point
    try:
        page_token = get_start_page_token(
            access_token=current_user.google_access_token,
            refresh_token=current_user.google_refresh_token,
        )
        current_user.drive_page_token = page_token
    except Exception as e:
        logger.error(f"Failed to get start page token: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to initialize change tracking: {str(e)}",
        )

    # Start watching for changes
    watching = False
    try:
        watch_result = start_watching(
            access_token=current_user.google_access_token,
            refresh_token=current_user.google_refresh_token,
        )
        current_user.drive_channel_id = watch_result["channel_id"]
        current_user.drive_resource_id = watch_result["resource_id"]
        current_user.channel_expiration = watch_result.get("expiration")
        watching = True
    except Exception as e:
        # Watch may fail in local dev (needs public HTTPS URL)
        logger.warning(
            f"Failed to start Drive watch (expected in local dev without public URL): {e}"
        )
        current_user.drive_channel_id = None
        current_user.drive_resource_id = None
        current_user.channel_expiration = None

    await db.commit()
    await db.refresh(current_user)

    return WatchedFolderResponse(
        folder_id=current_user.watched_folder_id,
        folder_name=current_user.watched_folder_name,
        channel_id=current_user.drive_channel_id,
        watching=watching,
    )


@router.get("/watched-folder", response_model=Optional[WatchedFolderResponse])
async def get_watched_folder(
    current_user: User = Depends(get_current_user),
):
    """Get the currently watched folder info."""
    if not current_user.watched_folder_id:
        return None

    return WatchedFolderResponse(
        folder_id=current_user.watched_folder_id,
        folder_name=current_user.watched_folder_name or "",
        channel_id=current_user.drive_channel_id,
        watching=current_user.drive_channel_id is not None,
    )


@router.delete("/watched-folder")
async def remove_watched_folder(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stop watching and remove the selected folder."""
    if current_user.drive_channel_id and current_user.drive_resource_id:
        try:
            stop_watching(
                access_token=current_user.google_access_token,
                channel_id=current_user.drive_channel_id,
                resource_id=current_user.drive_resource_id,
                refresh_token=current_user.google_refresh_token,
            )
        except Exception as e:
            logger.warning(f"Failed to stop watch: {e}")

    current_user.watched_folder_id = None
    current_user.watched_folder_name = None
    current_user.drive_channel_id = None
    current_user.drive_resource_id = None
    current_user.drive_page_token = None
    current_user.channel_expiration = None

    await db.commit()
    return {"message": "Watched folder removed"}
