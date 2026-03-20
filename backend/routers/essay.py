import io
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.openai_service import chat_completion
from prompts.essay_prompts import build_essay_prompt

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


# ── SECONDARY: Upload PDF essay ─────────────────────────────────────────────
@router.post("/review-pdf")
async def review_essay_pdf(
    file: UploadFile = File(...),
    school_name: str = Form(...),
    student_profile: str = Form(...),  # JSON string
):
    """
    PSEUDOCODE for PDF upload — implement after text version works.
    1. Read uploaded PDF bytes
    2. Extract text with pdfplumber
    3. Call same review logic as /review
    """
    # import pdfplumber
    # content = await file.read()
    # with pdfplumber.open(io.BytesIO(content)) as pdf:
    #     essay_text = "\n".join(p.extract_text() for p in pdf.pages if p.extract_text())
    # profile = json.loads(student_profile)
    # ... same as review_essay above
    return {"message": "PDF review — implement after demo"}


# ── SECONDARY: Rewrite a specific paragraph ─────────────────────────────────
@router.post("/rewrite-section")
async def rewrite_section(body: dict):
    """
    PSEUDOCODE:
    1. Receive { original_paragraph, issue, school_name }
    2. Prompt GPT-4o to rewrite with explanation of changes
    3. Return { rewritten, changes_made }
    """
    return {"message": "Section rewrite — implement after demo"}
