import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
import models

router = APIRouter(prefix="/reports", tags=["Shareable Reports"])

class ShareReportRequest(BaseModel):
    repo_name: str
    scan_data: Dict[str, Any]

@router.post("/share")
def share_report(payload: ShareReportRequest, db: Session = Depends(get_db)):
    """Generate a permanent shareable short ID for a scan report."""
    short_id = uuid.uuid4().hex[:10]
    report = models.SharedReport(
        id=short_id,
        repo_name=payload.repo_name,
        results_json=json.dumps(payload.scan_data),
        created_at=datetime.now(timezone.utc)
    )
    db.add(report)
    db.commit()

    return {
        "id": short_id,
        "share_url": f"/report/{short_id}",
        "created_at": report.created_at.isoformat()
    }

@router.get("/{report_id}")
def get_shared_report(report_id: str, db: Session = Depends(get_db)):
    """Fetch a public read-only shared scan report by short ID."""
    report = db.query(models.SharedReport).filter(models.SharedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Shared report not found or has expired.")

    scan_data = json.loads(report.results_json)
    return {
        "id": report.id,
        "repo_name": report.repo_name,
        "created_at": report.created_at.isoformat(),
        "scan_data": scan_data
    }
