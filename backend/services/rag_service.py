import json
import os
import chromadb
from pathlib import Path
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

chroma_client = chromadb.PersistentClient(
    path=str(Path(__file__).parent.parent / "chroma_db")
)

COLLECTION_NAME = "successful_essays"

def get_collection():
    return chroma_client.get_or_create_collection(COLLECTION_NAME)

async def build_index():
    collection = get_collection()

    if collection.count() > 0:
        print(f"✅ RAG index already built: {collection.count()} essays")
        return

    essays_path = Path(__file__).parent.parent / "data" / "sample_essays.json"
    essays = json.loads(essays_path.read_text())

    print(f"🔨 Building RAG index for {len(essays)} essays...")

    for essay in essays:
        response = await client.embeddings.create(
            input=essay["essay"],
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding

        collection.add(
            embeddings=[embedding],
            documents=[essay["essay"]],
            metadatas=[{
                "school":       essay["school"],
                "major":        essay.get("major", ""),
                "prompt_topic": essay.get("prompt_topic", "general"),
                "admitted":     str(essay.get("admitted", True)),
            }],
            ids=[essay["id"]]
        )
        print(f"  ✓ Indexed: {essay['id']}")

    print(f"🎉 RAG index built: {collection.count()} essays total")

async def find_similar_essays(user_essay: str, school: str, topic: str = "", n: int = 2) -> list[str]:
    collection = get_collection()

    if collection.count() == 0:
        return []

    response = await client.embeddings.create(
        input=user_essay,
        model="text-embedding-3-small"
    )
    user_embedding = response.data[0].embedding

    try:
        # Ưu tiên 1: cùng trường + cùng topic
        if topic and topic != "general" and school:
            results = collection.query(
                query_embeddings=[user_embedding],
                n_results=min(n, collection.count()),
                where={"$and": [{"school": school}, {"prompt_topic": topic}]}
            )
            if results["documents"][0]:
                print(f"RAG: found {len(results['documents'][0])} essays (school+topic match)")
                return results["documents"][0]

        # Fallback 1: chỉ cùng trường
        if school:
            results = collection.query(
                query_embeddings=[user_embedding],
                n_results=min(n, collection.count()),
                where={"school": school}
            )
            if results["documents"][0]:
                print(f"RAG: found {len(results['documents'][0])} essays (school match)")
                return results["documents"][0]

        # Fallback 2: vector similarity thuần
        results = collection.query(
            query_embeddings=[user_embedding],
            n_results=min(n, collection.count()),
        )
        print(f"RAG: found {len(results['documents'][0])} essays (similarity only)")
        return results["documents"][0]

    except Exception as e:
        print(f"RAG query error: {e}")
        return []