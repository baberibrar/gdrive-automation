import uuid
import logging
from datetime import datetime, timezone

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import settings

logger = logging.getLogger(__name__)


def _build_drive_service(access_token: str, refresh_token: str = None):
    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def get_start_page_token(access_token: str, refresh_token: str = None) -> str:
    """Get the starting page token for tracking changes."""
    service = _build_drive_service(access_token, refresh_token)
    response = service.changes().getStartPageToken().execute()
    return response.get("startPageToken")


def start_watching(access_token: str, refresh_token: str = None) -> dict:
    """
    Start watching for Drive changes via push notifications.
    Returns channel info (id, resourceId, expiration).
    """
    service = _build_drive_service(access_token, refresh_token)

    channel_id = str(uuid.uuid4())
    webhook_url = f"{settings.WEBHOOK_BASE_URL}/api/webhook/drive"

    body = {
        "id": channel_id,
        "type": "web_hook",
        "address": webhook_url,
    }

    response = service.changes().watch(
        pageToken=get_start_page_token(access_token, refresh_token),
        body=body,
    ).execute()

    logger.info(f"Started watching Drive changes. Channel ID: {channel_id}")

    return {
        "channel_id": response.get("id"),
        "resource_id": response.get("resourceId"),
        "expiration": response.get("expiration"),
    }


def stop_watching(access_token: str, channel_id: str, resource_id: str, refresh_token: str = None):
    """Stop watching for Drive changes."""
    service = _build_drive_service(access_token, refresh_token)

    body = {
        "id": channel_id,
        "resourceId": resource_id,
    }

    service.channels().stop(body=body).execute()
    logger.info(f"Stopped watching Drive changes. Channel ID: {channel_id}")


def get_changes(
    access_token: str, page_token: str, watched_folder_id: str, refresh_token: str = None
) -> dict:
    """
    Fetch changes since the given page token.
    Filters to only changes within the watched folder.
    Returns dict with 'changes' list and 'new_page_token'.
    """
    service = _build_drive_service(access_token, refresh_token)

    all_changes = []
    current_token = page_token

    while current_token:
        response = service.changes().list(
            pageToken=current_token,
            fields="nextPageToken, newStartPageToken, changes(fileId, file(id, name, mimeType, parents, trashed, modifiedTime))",
            includeRemoved=True,
            spaces="drive",
        ).execute()

        changes = response.get("changes", [])
        all_changes.extend(changes)

        current_token = response.get("nextPageToken")
        new_start_token = response.get("newStartPageToken", current_token)

    # Filter changes to only those in the watched folder
    folder_changes = []
    for change in all_changes:
        file_info = change.get("file")
        if file_info:
            parents = file_info.get("parents", [])
            if watched_folder_id in parents:
                folder_changes.append({
                    "file_id": file_info.get("id"),
                    "file_name": file_info.get("name"),
                    "mime_type": file_info.get("mimeType"),
                    "trashed": file_info.get("trashed", False),
                    "modified_time": file_info.get("modifiedTime"),
                    "change_type": "trashed" if file_info.get("trashed") else "modified",
                })

    return {
        "changes": folder_changes,
        "new_page_token": new_start_token,
    }
