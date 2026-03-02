from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    picture: Optional[str] = None

    model_config = {"from_attributes": True}


class FeedbackCreate(BaseModel):
    party_a_name: str
    party_b_name: str
    role: str
    rating: int = Field(ge=1, le=5)
    feedback_text: str
    source_file_name: Optional[str] = None
    extracted_text: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    party_a_name: str
    party_b_name: str
    role: str
    rating: int
    feedback_text: str
    source_file_name: Optional[str] = None
    extracted_text: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DriveFile(BaseModel):
    id: str
    name: str
    mimeType: str
    modifiedTime: Optional[str] = None
    size: Optional[str] = None
    iconLink: Optional[str] = None


class ExtractionResult(BaseModel):
    text: str
    file_name: str


class AnalysisResult(BaseModel):
    party_a_name: str
    party_a_role: str
    party_b_name: str
    party_b_role: str
    summary: str


class FileIdRequest(BaseModel):
    file_id: str


class AnalyzeRequest(BaseModel):
    text: str
