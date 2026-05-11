from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import GameSave, Player
from app.schemas import SaveOut, SaveUpsert

router = APIRouter(prefix="/players/{player_id}/saves", tags=["saves"])


def _player_or_404(db: Session, player_id: int) -> Player:
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.put("/{slot}", response_model=SaveOut)
def upsert_save(player_id: int, slot: str, body: SaveUpsert, db: Session = Depends(get_db)) -> GameSave:
    _player_or_404(db, player_id)
    row = db.scalar(select(GameSave).where(GameSave.player_id == player_id, GameSave.slot == slot))
    if row:
        row.payload = body.payload
    else:
        row = GameSave(player_id=player_id, slot=slot, payload=body.payload)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{slot}", response_model=SaveOut)
def get_save(player_id: int, slot: str, db: Session = Depends(get_db)) -> GameSave:
    _player_or_404(db, player_id)
    row = db.scalar(select(GameSave).where(GameSave.player_id == player_id, GameSave.slot == slot))
    if not row:
        raise HTTPException(status_code=404, detail="Save not found")
    return row


@router.get("", response_model=list[SaveOut])
def list_saves(player_id: int, db: Session = Depends(get_db)) -> list[GameSave]:
    _player_or_404(db, player_id)
    rows = db.scalars(select(GameSave).where(GameSave.player_id == player_id)).all()
    return list(rows)
