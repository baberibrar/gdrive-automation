from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

from app.config import settings

GOOGLE_DOCS_MIME_TYPES = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}


def _build_drive_service(access_token: str, refresh_token: str = None):
    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )
    service = build("drive", "v3", credentials=credentials, cache_discovery=False)
    return service


def list_files(
    access_token: str, folder_id: str = None, query: str = None, refresh_token: str = None
) -> list[dict]:
    service = _build_drive_service(access_token, refresh_token)

    q_parts = []
    if folder_id:
        q_parts.append(f"'{folder_id}' in parents")
    if query:
        q_parts.append(f"name contains '{query}'")

    q_parts.append("trashed = false")
    q_string = " and ".join(q_parts)

    results = (
        service.files()
        .list(
            q=q_string,
            pageSize=50,
            fields="files(id, name, mimeType, modifiedTime, size, iconLink)",
            orderBy="modifiedTime desc",
        )
        .execute()
    )

    return results.get("files", [])


def download_file(access_token: str, file_id: str, mime_type: str, refresh_token: str = None) -> bytes:
    service = _build_drive_service(access_token, refresh_token)

    if mime_type in GOOGLE_DOCS_MIME_TYPES:
        export_mime = GOOGLE_DOCS_MIME_TYPES[mime_type]
        request = service.files().export_media(fileId=file_id, mimeType=export_mime)
    else:
        request = service.files().get_media(fileId=file_id)

    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    buffer.seek(0)
    return buffer.read()


def get_file_metadata(access_token: str, file_id: str, refresh_token: str = None) -> dict:
    service = _build_drive_service(access_token, refresh_token)
    file_metadata = (
        service.files()
        .get(fileId=file_id, fields="id, name, mimeType, modifiedTime, size, iconLink")
        .execute()
    )
    return file_metadata
