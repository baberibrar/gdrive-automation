from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, drive, extraction, feedback


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="GDrive Automation Platform",
    description="Backend API for Google Drive document automation with text extraction and analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(drive.router, prefix="/api")
app.include_router(extraction.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "GDrive Automation Platform API", "status": "running"}
