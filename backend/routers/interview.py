from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import io

from services.openai_service import chat_completion, transcribe_audio
from services.elevenlabs_service import text_to_speech
from prompts.interview_prompts import (
    build_interviewer_system_prompt,
    build_final_interview_report_prompt,
)

router = APIRouter()


class InterviewTurnRequest(BaseModel):
    school_name: str
    student_profile: dict        # { name, gpa, major, activities }
    conversation_history: list   # [{ role: "assistant"|"user", content: "..." }]
    user_answer: str             # student's latest text answer
    voice_enabled: bool = False  # if True, also return audio


class InterviewEndRequest(BaseModel):
    school_name: str
    conversation_history: list


# ── DEMO ENDPOINT 2a: One interview turn (text) ──────────────────────────────
@router.post("/ask")
async def interview_ask(req: InterviewTurnRequest):
    """
    Core interview loop:
    - Takes full conversation history + student's latest answer
    - Returns: next question + feedback on previous answer + scores
    - Optionally generates voice audio for the question
    """
    system_prompt = build_interviewer_system_prompt(
        req.school_name,
        req.student_profile,
    )

    # Append the student's latest answer to history before sending
    messages = req.conversation_history.copy()
    if req.user_answer:
        messages.append({"role": "user", "content": req.user_answer})

    ai_response = await chat_completion(
        system_prompt=system_prompt,
        messages=messages,
        json_mode=True,
    )

    result = {
        "question": ai_response.get("question"),
        "feedback_on_previous": ai_response.get("feedback_on_previous"),
        "score_on_previous": ai_response.get("score_on_previous"),
        "interview_phase": ai_response.get("interview_phase", "middle"),
        "audio_url": None,
        "audio_base64": None, 
    }

    # If voice enabled, generate audio and return URL
    if req.voice_enabled and result["question"]:
        try:
            import base64
            audio_bytes = await text_to_speech(result["question"])
            result["audio_base64"] = base64.b64encode(audio_bytes).decode("utf-8")
        except Exception as e:
            print(f"[ElevenLabs error] {e}")

    return JSONResponse(content=result)


# ── DEMO ENDPOINT 2b: Get question as audio stream ──────────────────────────
@router.post("/speak")
async def speak_question(body: dict):
    """
    Separate endpoint: convert any question text → MP3 audio stream.
    Frontend calls this after /ask to play interviewer's voice.
    """
    text = body.get("text", "")
    if not text:
        return JSONResponse({"error": "No text provided"}, status_code=400)

    audio_bytes = await text_to_speech(text)

    return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=question.mp3"},
    )


# ── SECONDARY: Voice input (student speaks answer) ──────────────────────────
@router.post("/transcribe")
async def transcribe_student_answer(audio: UploadFile = File(...)):
    if not audio.filename:
        audio.filename = "answer.webm"

    audio_bytes = await audio.read()

    if len(audio_bytes) < 8000:
        return JSONResponse({"transcript": "", "warning": "Audio too short", "analysis": None})

    try:
        # Dùng GPT-4o Audio — vừa transcribe vừa phân tích
        from services.openai_service import analyze_speech
        analysis = await analyze_speech(audio_bytes, filename=audio.filename)
        return JSONResponse({
            "transcript": analysis.get("transcript", ""),
            "analysis": analysis,
        })
    except Exception as e:
        # Fallback về Whisper nếu GPT-4o Audio lỗi
        print(f"[GPT-4o Audio error, falling back to Whisper] {e}")
        from services.openai_service import transcribe_audio
        transcript = await transcribe_audio(audio_bytes, filename=audio.filename)
        return JSONResponse({"transcript": transcript, "analysis": None})

# ── SECONDARY: Full interview report ────────────────────────────────────────
@router.post("/report")
async def generate_interview_report(req: InterviewEndRequest):
    """
    Called when interview session ends.
    Returns overall assessment across all dimensions.
    """
    prompt = build_final_interview_report_prompt(
        req.conversation_history,
        req.school_name,
    )
    result = await chat_completion(
        system_prompt=prompt,
        messages=[{"role": "user", "content": "Generate the final report."}],
        json_mode=True,
    )
    return JSONResponse(content=result)
