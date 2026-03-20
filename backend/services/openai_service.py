import os, json
from openai import AsyncOpenAI
from dotenv import load_dotenv
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
