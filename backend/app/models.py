from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    saves: Mapped[list["GameSave"]] = relationship(back_populates="player", cascade="all, delete-orphan")
    scores: Mapped[list["ScoreEntry"]] = relationship(back_populates="player", cascade="all, delete-orphan")
    events: Mapped[list["AnalyticsEvent"]] = relationship(back_populates="player", cascade="all, delete-orphan")


class GameSave(Base):
    __tablename__ = "game_saves"
    __table_args__ = (UniqueConstraint("player_id", "slot", name="uq_player_save_slot"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), index=True)
    slot: Mapped[str] = mapped_column(String(32), default="default")
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    player: Mapped["Player"] = relationship(back_populates="saves")


class ScoreEntry(Base):
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), index=True)
    game_mode: Mapped[str] = mapped_column(String(64), default="default", index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    player: Mapped["Player"] = relationship(back_populates="scores")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    player_id: Mapped[int | None] = mapped_column(ForeignKey("players.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(128), index=True)
    properties: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    client_ts: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    player: Mapped["Player | None"] = relationship(back_populates="events")
