import io

import pdfplumber
from docx import Document
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.models import User
from app.schemas import (
    AnalysisResult,
    AnalyzeRequest,
    ExtractionResult,
    FileIdRequest,
    GenerateFeedbackRequest,
    GenerateFeedbackResult,
)
from app.services.google_drive import download_file, get_file_metadata
from app.services.openai_service import analyze_parties, generate_feedback
from app.services.textract import extract_text

GOOGLE_DOCS_MIME_TYPES = {
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
}

# Textract with Bytes only supports images (not PDF)
TEXTRACT_IMAGE_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/tiff",
}

router = APIRouter(prefix="/extract", tags=["extraction"])


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text_from_bytes(file_content: bytes, mime_type: str, file_name: str) -> str:
    print(f"[extract] mime_type={mime_type}, file_name={file_name}, size={len(file_content)}")

    # Google Docs / Sheets / Slides → already exported as plain text
    if mime_type in GOOGLE_DOCS_MIME_TYPES:
        return file_content.decode("utf-8", errors="replace")

    # PDF → pdfplumber
    if mime_type == "application/pdf" or file_name.endswith(".pdf"):
        return extract_text_from_pdf(file_content)

    # Word documents (.docx)
    if mime_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ) or file_name.endswith((".docx", ".doc")):
        return extract_text_from_docx(file_content)

    # Images → AWS Textract (OCR)
    if mime_type in TEXTRACT_IMAGE_MIME_TYPES or file_name.endswith((".png", ".jpg", ".jpeg", ".tiff")):
        return extract_text(file_content)

    # Plain text files
    if mime_type.startswith("text/") or file_name.endswith((".txt", ".csv", ".md", ".json", ".xml", ".html", ".rtf")):
        return file_content.decode("utf-8", errors="replace")

    # Fallback: try decoding as text
    try:
        text = file_content.decode("utf-8")
        if text.strip():
            return text
    except (UnicodeDecodeError, ValueError):
        pass

    raise ValueError(
        f"Unsupported file format: {mime_type} ({file_name}). "
        "Supported: Google Docs, .docx, .pdf, images (PNG/JPEG/TIFF), and text files."
    )


@router.post("/text", response_model=ExtractionResult)
async def extract_text_from_file(
    request: FileIdRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        metadata = get_file_metadata(
            access_token=current_user.google_access_token,
            file_id=request.file_id,
            refresh_token=current_user.google_refresh_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to get file metadata: {str(e)}",
        )

    mime_type = metadata.get("mimeType", "")
    file_name = metadata.get("name", "unknown")

    try:
        file_content = download_file(
            access_token=current_user.google_access_token,
            file_id=request.file_id,
            mime_type=mime_type,
            refresh_token=current_user.google_refresh_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to download file: {str(e)}",
        )

    try:
        extracted = extract_text_from_bytes(file_content, mime_type, file_name)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to extract text: {str(e)}",
        )

    return ExtractionResult(text=extracted, file_name=file_name)


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_text(
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty",
        )

    try:
        result = analyze_parties(request.text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to analyze text with OpenAI: {str(e)}",
        )

    return AnalysisResult(**result)


@router.post("/generate-feedback", response_model=GenerateFeedbackResult)
async def generate_feedback_from_doc(
    request: GenerateFeedbackRequest,
    current_user: User = Depends(get_current_user),
):
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty",
        )

    if request.user_role not in ("freelancer", "influencer", "client"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_role must be 'freelancer', 'influencer', or 'client'",
        )

    try:
        analysis_dict = request.analysis.model_dump()
        result = generate_feedback(request.text, analysis_dict, request.user_role)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate feedback: {str(e)}",
        )

    return GenerateFeedbackResult(**result)
