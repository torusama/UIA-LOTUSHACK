import os
import httpx

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default: Rachel
BASE_URL = "https://api.elevenlabs.io/v1"

async def text_to_speech(text: str) -> bytes:
    """
    Convert interviewer question to audio.
    Returns raw MP3 bytes — FastAPI streams this back to frontend.
    """
    url = f"{BASE_URL}/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2",
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
        return response.content  # raw MP3 bytes


async def get_available_voices() -> list:
    """List voices — useful for letting user pick interviewer persona."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/voices",
            headers={"xi-api-key": ELEVENLABS_API_KEY}
        )
        data = response.json()
        return [{"id": v["voice_id"], "name": v["name"]} for v in data["voices"]]
