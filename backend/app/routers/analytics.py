from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AnalyticsEvent, Player
from app.schemas import AnalyticsBatch

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/players/{player_id}/events")
def ingest_events(player_id: int, body: AnalyticsBatch, db: Session = Depends(get_db)) -> dict[str, int]:
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    for ev in body.events:
        db.add(
            AnalyticsEvent(
                player_id=player_id,
                name=ev.name,
                properties=ev.properties,
                client_ts=ev.client_ts,
            )
        )
    db.commit()
    return {"accepted": len(body.events)}
