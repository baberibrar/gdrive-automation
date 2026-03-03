from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.dependencies import get_current_user
from app.models import User
from app.schemas import DriveFile
from app.services.google_drive import download_file, get_file_metadata, list_files

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
