import io
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.openai_service import chat_completion
from prompts.essay_prompts import build_essay_prompt, build_essay_rewrite_prompt

router = APIRouter()


class EssayTextRequest(BaseModel):
    essay_text: str
    school_name: str
    student_profile: dict  # { gpa, major, activities, name }


# ── DEMO ENDPOINT 1: Submit essay as plain text ─────────────────────────────
@router.post("/review")
async def review_essay(req: EssayTextRequest):
    """
    Core demo endpoint. Takes essay text + school + profile.
    Returns full rubric-based analysis from GPT-4o.
    """
    if len(req.essay_text.strip()) < 100:
        raise HTTPException(400, "Essay too short (minimum 100 characters)")

    system_prompt = build_essay_prompt(
        req.essay_text,
        req.school_name,
        req.student_profile
    )

    result = await chat_completion(
        system_prompt=system_prompt,
        messages=[{"role": "user", "content": "Please analyze this essay now."}],
        json_mode=True,
    )
    return JSONResponse(content=result)


@router.post("/review-pdf")
async def review_essay_pdf(
    file: UploadFile = File(...),
    school_name: str = Form(...),
    student_profile: str = Form(...),  # JSON string
):
    """
    Upload PDF essay → extract text → analyze with GPT-4o.
    """
    # 1. Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    # 2. Extract text từ PDF
    import pdfplumber, io
    content = await file.read()
    essay_text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                essay_text += text + "\n"

    if len(essay_text.strip()) < 100:
        raise HTTPException(400, "Could not extract enough text from PDF (minimum 100 characters)")

    # 3. Parse student_profile từ JSON string
    import json
    try:
        profile = json.loads(student_profile)
    except Exception:
        raise HTTPException(400, "student_profile must be valid JSON")

    # 4. Gọi cùng logic với /review
    system_prompt = build_essay_prompt(essay_text, school_name, profile)
    result = await chat_completion(
        system_prompt=system_prompt,
        messages=[{"role": "user", "content": "Please analyze this essay now."}],
        json_mode=True,
    )
    return JSONResponse(content=result)

class RewriteRequest(BaseModel):
    original_paragraph: str
    issue: str
    suggestion: str
    school_name: str

@router.post("/rewrite-section")
async def rewrite_section(req: RewriteRequest):
    """
    Nhận 1 đoạn văn yếu + issue + suggestion → GPT-4o rewrite lại.
    """
    if len(req.original_paragraph.strip()) < 20:
        raise HTTPException(400, "Paragraph too short (minimum 20 characters)")

    system_prompt = build_essay_rewrite_prompt(
        original=req.original_paragraph,
        issue=req.issue,
        suggestion=req.suggestion,
        school_name=req.school_name,
    )

    result = await chat_completion(
        system_prompt=system_prompt,
        messages=[{"role": "user", "content": "Please rewrite this paragraph now."}],
        json_mode=True,
    )
    return JSONResponse(content=result)