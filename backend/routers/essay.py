import io
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.openai_service import chat_completion
from services.rag_service import find_similar_essays
from prompts.essay_prompts import build_essay_prompt, build_essay_rewrite_prompt

router = APIRouter()


class EssayTextRequest(BaseModel):
    essay_text: str
    school_name: str
    student_profile: dict


@router.post("/review")
async def review_essay(req: EssayTextRequest):
    if len(req.essay_text.strip()) < 100:
        raise HTTPException(400, "Essay too short (minimum 100 characters)")

    # RAG — tìm essay tương tự đã đậu
    similar = await find_similar_essays(
        user_essay=req.essay_text,
        school=req.school_name,
        n=2
    )
    if similar:
        print(f"RAG: using {len(similar)} benchmark essays")

    system_prompt = build_essay_prompt(
        req.essay_text,
        req.school_name,
        req.student_profile,
        similar_essays=similar
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
    student_profile: str = Form(...),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    import pdfplumber
    content = await file.read()
    essay_text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                essay_text += text + "\n"

    if len(essay_text.strip()) < 100:
        raise HTTPException(400, "Could not extract enough text from PDF (minimum 100 characters)")

    try:
        profile = json.loads(student_profile)
    except Exception:
        raise HTTPException(400, "student_profile must be valid JSON")

    # RAG cho PDF
    similar = await find_similar_essays(
        user_essay=essay_text,
        school=school_name,
        n=2
    )
    if similar:
        print(f"RAG: using {len(similar)} benchmark essays")

    system_prompt = build_essay_prompt(essay_text, school_name, profile, similar_essays=similar)
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