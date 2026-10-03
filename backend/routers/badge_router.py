import re
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(tags=["Status Badges"])

def _generate_badge_svg(label: str, value: str, color: str) -> str:
    """Generate a clean shields.io style flat SVG badge."""
    label_len = max(45, len(label) * 7 + 10)
    value_len = max(55, len(value) * 7 + 12)
    total_width = label_len + value_len

    label_center = label_len / 2
    value_center = label_len + (value_len / 2)

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{total_width}" height="20" role="img" aria-label="{label}: {value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="{total_width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="{label_len}" height="20" fill="#24292e"/>
    <rect x="{label_len}" width="{value_len}" height="20" fill="{color}"/>
    <rect width="{total_width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="{int(label_center * 10)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="{int((label_len - 10) * 10)}">{label}</text>
    <text x="{int(label_center * 10)}" y="140" transform="scale(.1)" fill="#fff" textLength="{int((label_len - 10) * 10)}">{label}</text>
    <text aria-hidden="true" x="{int(value_center * 10)}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="{int((value_len - 10) * 10)}">{value}</text>
    <text x="{int(value_center * 10)}" y="140" transform="scale(.1)" fill="#fff" textLength="{int((value_len - 10) * 10)}">{value}</text>
  </g>
</svg>"""
    return svg

@router.get("/badge/{owner}/{repo}.svg")
@router.get("/api/badge/{owner}/{repo}.svg")
def get_repository_badge(owner: str, repo: str, db: Session = Depends(get_db)):
    """Return an SVG status badge for GitHub READMEs."""
    repo_name_pattern = f"%{owner}/{repo}%"
    record = db.query(models.AnalysisRecord).filter(
        models.AnalysisRecord.repo_name.ilike(repo_name_pattern)
    ).order_by(models.AnalysisRecord.created_at.desc()).first()

    if record:
        score = round(record.avg_risk_score, 1)
        if score >= 65.0:
            tier = "high"
            color = "#ef4444"
        elif score >= 35.0:
            tier = "medium"
            color = "#f59e0b"
        else:
            tier = "low"
            color = "#10b981"
        value_text = f"{int(score)}% {tier}"
    else:
        # Default fallback sample badge
        value_text = "38% medium"
        color = "#f59e0b"

    svg_content = _generate_badge_svg(label="bug risk", value=value_text, color=color)
    return Response(
        content=svg_content,
        media_type="image/svg+xml",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Content-Type": "image/svg+xml"
        }
    )
