from datetime import datetime

from pydantic import BaseModel, Field


class PlayerCreate(BaseModel):
    external_id: str = Field(..., max_length=128, description="Stable client id (e.g. device id or auth subject).")
    display_name: str | None = Field(None, max_length=64)


class PlayerOut(BaseModel):
    id: int
    external_id: str
    display_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SaveUpsert(BaseModel):
    payload: dict


class SaveOut(BaseModel):
    slot: str
    payload: dict
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScoreSubmit(BaseModel):
    game_mode: str = Field("default", max_length=64)
    score: int
    metadata: dict | None = None


class ScoreOut(BaseModel):
    id: int
    game_mode: str
    score: int
    metadata: dict | None = Field(
        default=None,
        validation_alias="metadata_json",
        serialization_alias="metadata",
    )
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class LeaderboardRow(BaseModel):
    rank: int
    score: int
    display_name: str | None
    player_id: int
    created_at: datetime


class AnalyticsEventIn(BaseModel):
    name: str = Field(..., max_length=128)
    properties: dict | None = None
    client_ts: datetime | None = None


class AnalyticsBatch(BaseModel):
    events: list[AnalyticsEventIn] = Field(..., max_length=100)
