import logging

from fastapi import APIRouter, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import User
from app.services.drive_watch import get_changes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/drive")
async def drive_webhook(request: Request):
    """
    Receives push notifications from Google Drive Changes API.
    Google sends a POST with headers:
      - X-Goog-Channel-ID: the channel ID we created
      - X-Goog-Resource-ID: the resource being watched
      - X-Goog-Resource-State: 'sync' (initial) or 'change'
    """
    channel_id = request.headers.get("X-Goog-Channel-ID", "")
    resource_state = request.headers.get("X-Goog-Resource-State", "")

    logger.info(f"Drive webhook received: channel={channel_id}, state={resource_state}")

    # Google sends a 'sync' message when the watch is first created - just acknowledge it
    if resource_state == "sync":
        return Response(status_code=200)

    if resource_state != "change":
        return Response(status_code=200)

    # Find the user who owns this channel
    async with async_session() as db:
        result = await db.execute(
            select(User).where(User.drive_channel_id == channel_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"No user found for channel ID: {channel_id}")
            return Response(status_code=200)

        if not user.drive_page_token or not user.watched_folder_id:
            logger.warning(f"User {user.id} missing page token or watched folder")
            return Response(status_code=200)

        try:
            # Get the actual changes from Google Drive
            changes_result = get_changes(
                access_token=user.google_access_token,
                page_token=user.drive_page_token,
                watched_folder_id=user.watched_folder_id,
                refresh_token=user.google_refresh_token,
            )

            # Update the page token for next time
            user.drive_page_token = changes_result["new_page_token"]
            await db.commit()

            changes = changes_result["changes"]

            if changes:
                logger.info(
                    f"Detected {len(changes)} change(s) in watched folder "
                    f"'{user.watched_folder_name}' for user {user.email}"
                )
                for change in changes:
                    logger.info(
                        f"  - {change['change_type'].upper()}: "
                        f"{change['file_name']} ({change['file_id']})"
                    )

                # TODO: Forward to your external webhook URL or process changes here
                # Example: await forward_to_external_webhook(user, changes)

        except Exception as e:
            logger.error(f"Error processing drive webhook for user {user.id}: {e}")

    return Response(status_code=200)
