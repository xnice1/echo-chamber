from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Player
from app.schemas import PlayerCreate, PlayerOut

router = APIRouter(prefix="/players", tags=["players"])


@router.post("", response_model=PlayerOut)
def register_or_get_player(body: PlayerCreate, db: Session = Depends(get_db)) -> Player:
    existing = db.scalar(select(Player).where(Player.external_id == body.external_id))
    if existing:
        if body.display_name and body.display_name != existing.display_name:
            existing.display_name = body.display_name
            db.commit()
            db.refresh(existing)
        return existing
    player = Player(external_id=body.external_id, display_name=body.display_name)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("/by-external/{external_id}", response_model=PlayerOut)
def get_by_external(external_id: str, db: Session = Depends(get_db)) -> Player:
    player = db.scalar(select(Player).where(Player.external_id == external_id))
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.get("/{player_id}", response_model=PlayerOut)
def get_player(player_id: int, db: Session = Depends(get_db)) -> Player:
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player
