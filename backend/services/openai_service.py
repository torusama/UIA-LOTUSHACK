import os, json
from dotenv import load_dotenv
from openai import AsyncOpenAI
from dotenv import load_dotenv
load_dotenv()

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def chat_completion(system_prompt: str, messages: list, json_mode: bool = True) -> dict:
    """Core wrapper — all features go through here."""
    response = await client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"} if json_mode else {"type": "text"},
        messages=[
            {"role": "system", "content": system_prompt},
            *messages
        ],
        temperature=0.7,
        max_tokens=2000,
    )
    content = response.choices[0].message.content
    return json.loads(content) if json_mode else content


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Whisper STT — for voice interview input."""
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename
    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="en",
    )
    return transcript.text
async def analyze_speech(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Dùng GPT-4o Audio để vừa transcribe vừa phân tích:
    - Độ chính xác phát âm
    - Tone giọng / mức độ hứng thú
    - Gợi ý cải thiện
    """
    import io, base64

    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

    # Detect format từ filename
    ext = filename.rsplit(".", 1)[-1].lower()
    fmt_map = {"webm": "webm", "mp4": "mp4", "wav": "wav", "m4a": "mp4", "ogg": "ogg"}
    audio_format = fmt_map.get(ext, "webm")

    response = await client.chat.completions.create(
        model="gpt-4o-audio-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": audio_b64,
                            "format": audio_format,
                        },
                    },
                    {
                        "type": "text",
                        "text": """You are analyzing a non-native English speaker (Vietnamese student) 
answering study abroad scholarship interview questions.

Analyze the audio and return JSON with exactly these fields:
{
  "transcript": "<accurate full transcript of what was said>",
  "pronunciation_issues": [
    {"word": "<mispronounced word>", "issue": "<what was wrong>", "suggestion": "<how to say it correctly>"}
  ],
  "filler_words": ["<list of filler words used: um, uh, like, you know, etc>"],
  "tone_analysis": {
    "enthusiasm_score": <1-10, how excited/passionate they sound>,
    "confidence_score": <1-10>,
    "clarity_score": <1-10, how clear and well-paced>,
    "tone_label": "<one of: very_enthusiastic | enthusiastic | neutral | flat | nervous>",
    "tone_summary": "<1 sentence describing their vocal energy>"
  },
  "content_quality": {
    "is_relevant": <true|false, does the answer seem on-topic for an interview>,
    "is_complete": <true|false, did they finish their thought or trail off>,
    "suggested_improvement": "<1 specific tip to improve this answer>"
  },
  "overall_speech_tip": "<1 actionable tip for their next answer>"
}

Be honest but encouraging. Focus on patterns, not every small mistake."""
                    }
                ],
            }
        ],
        response_format={"type": "json_object"},
        max_tokens=1000,
    )

    import json
    return json.loads(response.choices[0].message.content)
