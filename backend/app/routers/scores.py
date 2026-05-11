from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Player, ScoreEntry
from app.schemas import LeaderboardRow, ScoreOut, ScoreSubmit

router = APIRouter(prefix="/scores", tags=["scores"])


def _player_or_404(db: Session, player_id: int) -> Player:
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("/players/{player_id}", response_model=ScoreOut)
def submit_score(player_id: int, body: ScoreSubmit, db: Session = Depends(get_db)) -> ScoreEntry:
    _player_or_404(db, player_id)
    row = ScoreEntry(
        player_id=player_id,
        game_mode=body.game_mode,
        score=body.score,
        metadata_json=body.metadata,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/leaderboard", response_model=list[LeaderboardRow])
def leaderboard(
    game_mode: str = Query("default"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[LeaderboardRow]:
    subq = (
        select(
            ScoreEntry.id,
            ScoreEntry.score,
            ScoreEntry.player_id,
            ScoreEntry.created_at,
            Player.display_name,
            func.row_number()
            .over(partition_by=ScoreEntry.player_id, order_by=(desc(ScoreEntry.score), ScoreEntry.created_at))
            .label("rn"),
        )
        .join(Player, Player.id == ScoreEntry.player_id)
        .where(ScoreEntry.game_mode == game_mode)
        .subquery()
    )
    stmt = (
        select(subq.c.id, subq.c.score, subq.c.player_id, subq.c.created_at, subq.c.display_name)
        .where(subq.c.rn == 1)
        .order_by(desc(subq.c.score), subq.c.created_at)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    out: list[LeaderboardRow] = []
    for rank, r in enumerate(rows, start=1):
        out.append(
            LeaderboardRow(
                rank=rank,
                score=r.score,
                display_name=r.display_name,
                player_id=r.player_id,
                created_at=r.created_at,
            )
        )
    return out
