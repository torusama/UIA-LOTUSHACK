import os
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.elevenlabs.io/v1"

async def text_to_speech(text: str) -> bytes:
    api_key  = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")

    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY chưa được set trong .env")

    url = f"{BASE_URL}/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
            "use_speaker_boost": True,
        },
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.content


async def get_available_voices() -> list:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/voices",
            headers={"xi-api-key": api_key}
        )
        data = response.json()
        return [{"id": v["voice_id"], "name": v["name"]} for v in data["voices"]]