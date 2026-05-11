from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine
from app.routers import analytics, players, saves, scores


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="MobileGE API", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
wildcard = origins == ["*"] or origins == []
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if wildcard else origins,
    allow_credentials=not wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_prefix
app.include_router(players.router, prefix=prefix)
app.include_router(saves.router, prefix=prefix)
app.include_router(scores.router, prefix=prefix)
app.include_router(analytics.router, prefix=prefix)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
