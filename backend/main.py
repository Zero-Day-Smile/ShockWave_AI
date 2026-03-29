"""
Economic Butterfly Effect Simulator — FastAPI Backend
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from api import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    print(f"🦋 Butterfly Simulator API starting")
    print(f"   FRED API: {'live' if settings.fred_api_key != 'demo' else 'synthetic (no key)'}")
    yield
    print("   Shutting down.")


app = FastAPI(
    title="Economic Butterfly Effect Simulator",
    description="Causal simulation + ML risk scoring for macroeconomic education",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "name": "Economic Butterfly Effect Simulator API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "GET  /reality/snapshot",
            "GET  /reality/history",
            "POST /simulate/run",
            "GET  /simulate/graph",
            "POST /predict/score",
            "POST /predict/explain",
            "GET  /crises/library",
            "WS   /simulate/stream",
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
