from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import essay, interview, profile
from services.rag_service import build_index

@asynccontextmanager
async def lifespan(app: FastAPI):
    await build_index()
    yield

app = FastAPI(title="UniMatch AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(essay.router,     prefix="/essay",     tags=["Essay"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(profile.router,   prefix="/profile",   tags=["Profile"])

@app.get("/")
def root():
    return {"status": "UniMatch AI backend is running 🚀"}