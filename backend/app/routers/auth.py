from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import UserResponse
from app.services.google_auth import (
    exchange_code_for_tokens,
    get_google_auth_url,
    get_user_info,
)
from app.services.jwt_service import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login")
async def login():
    auth_url = get_google_auth_url()
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        token_data = await exchange_code_for_tokens(code)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code for tokens",
        )

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access token received from Google",
        )

    try:
        user_info = await get_user_info(access_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve user information from Google",
        )

    google_id = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name", email)
    picture = user_info.get("picture")

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user:
        user.email = email
        user.name = name
        user.picture = picture
        user.google_access_token = access_token
        if refresh_token:
            user.google_refresh_token = refresh_token
    else:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            picture=picture,
            google_access_token=access_token,
            google_refresh_token=refresh_token,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    jwt_token = create_access_token({"sub": str(user.id), "email": user.email})

    redirect_url = f"{settings.FRONTEND_URL}/oauth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
