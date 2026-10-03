import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from services.github_service import parse_github_repo_url, fetch_github_repo_commits, generate_sample_demo_repository
from services.feature_extractor import extract_file_features, is_bug_fixing_commit, extract_temporal_split_features
from services.ml_engine import train_and_predict_risks
from services.ai_advisor import enrich_risks_with_ai_suggestions
from services.cache_service import analysis_cache

router = APIRouter(prefix="/analysis", tags=["Repository Analysis"])

@router.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_repository(
    request: schemas.AnalyzeRequest,
    db: Session = Depends(get_db)
):
    repo_url = request.repo_url.strip()
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    # 1. Parse repository coordinates
    if request.use_sample or "demo" in repo_url.lower() or "sample" in repo_url.lower():
        owner, repo_name = "demo-org", "bugradar-ecommerce-sample"
        is_sample = True
    else:
        owner, repo_name = parse_github_repo_url(repo_url)
        is_sample = False

    cache_key = f"{owner}/{repo_name}"

    # 2. Check 1-Hour Cache
    cached_payload = analysis_cache.get(cache_key)
    if cached_payload and not request.use_sample:
        cached_payload["is_cached"] = True
        return schemas.AnalyzeResponse(**cached_payload)

    # 3. Fetch Commits from GitHub API (or realistic sample generator)
    rate_limit_remaining = None
    rate_limit_limit = None
    data_source_label = "Offline Demo Sample" if is_sample else "Real Repository (GitHub API)"

    if is_sample:
        raw_commits = generate_sample_demo_repository(owner, repo_name)
        rate_limit_remaining = 5000
        rate_limit_limit = 5000
    else:
        try:
            raw_commits, rate_limit_remaining, rate_limit_limit = await fetch_github_repo_commits(
                owner=owner,
                repo=repo_name,
                max_commits=request.max_commits or 200
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error while extracting GitHub repository data: {str(e)}"
            )

    if not raw_commits:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to extract commits from repository '{owner}/{repo_name}'."
        )

    # 4. Temporal Split Feature Extraction (70% Historical / 30% Future to prevent label leakage)
    train_features, train_labels, file_features, split_stats = extract_temporal_split_features(
        raw_commits,
        split_ratio=0.70
    )
    if not file_features:
        raise HTTPException(
            status_code=400,
            detail=f"No source code modifications identified in recent commit history for '{owner}/{repo_name}'."
        )

    # 5. Multi-Model ML Rigor & Rule-based Scoring Engine
    file_risks, model_metadata, model_report = train_and_predict_risks(
        file_features=file_features,
        train_features=train_features,
        train_labels=train_labels,
        split_stats=split_stats
    )

    # 5.1 AI-Powered Actionable Fix Suggestions (Risk >= 0.55, capped at 12 files)
    try:
        file_risks = await enrich_risks_with_ai_suggestions(file_risks, min_risk_threshold=0.55, max_files=12)
    except Exception as e:
        # Non-blocking graceful degradation
        pass

    # 6. Aggregate Summary Metrics
    total_commits = len(raw_commits)
    bug_fixing_commits = sum(1 for c in raw_commits if is_bug_fixing_commit(c.get("message", "")))
    high_risk = sum(1 for f in file_risks if f["risk_level"] == "HIGH")
    med_risk = sum(1 for f in file_risks if f["risk_level"] == "MEDIUM")
    low_risk = sum(1 for f in file_risks if f["risk_level"] == "LOW")
    avg_score = round(sum(f["risk_score"] for f in file_risks) / len(file_risks), 1) if file_risks else 0.0
    top_file = file_risks[0]["file_path"] if file_risks else None

    summary_obj = {
        "total_files": len(file_risks),
        "high_risk_count": high_risk,
        "medium_risk_count": med_risk,
        "low_risk_count": low_risk,
        "avg_risk_score": avg_score,
        "top_vulnerable_file": top_file,
        "total_commits": total_commits,
        "bug_fixing_commits": bug_fixing_commits,
        "rate_limit_remaining": rate_limit_remaining,
        "rate_limit_limit": rate_limit_limit,
        "data_source": data_source_label
    }

    response_data = {
        "repo_url": f"https://github.com/{owner}/{repo_name}" if not is_sample else "https://github.com/demo-org/bugradar-ecommerce-sample",
        "repo_name": f"{owner}/{repo_name}",
        "is_cached": False,
        "cached_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "summary": summary_obj,
        "files": file_risks,
        "model_metadata": model_metadata,
        "model_report": model_report,
        "commit_timeline": split_stats.get("commit_timeline", []),
        "rate_limit_remaining": rate_limit_remaining,
        "rate_limit_limit": rate_limit_limit,
        "data_source": data_source_label
    }

    # 7. Store in Cache (1 hour TTL)
    analysis_cache.set(cache_key, response_data, ttl=3600)

    # 8. Save analysis record log to database
    try:
        record = models.AnalysisRecord(
            repo_url=response_data["repo_url"],
            repo_name=response_data["repo_name"],
            commits_analyzed=total_commits,
            files_analyzed=len(file_risks),
            high_risk_count=high_risk,
            avg_risk_score=avg_score,
            results_json=json.dumps(response_data)
        )
        db.add(record)
        db.commit()
    except Exception:
        db.rollback()

    return schemas.AnalyzeResponse(**response_data)

@router.get("/quick-sample")
async def get_quick_sample(db: Session = Depends(get_db)):
    req = schemas.AnalyzeRequest(repo_url="https://github.com/demo-org/bugradar-ecommerce-sample", use_sample=True)
    return await analyze_repository(req, db=db)
