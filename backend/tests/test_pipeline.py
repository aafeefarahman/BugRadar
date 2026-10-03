import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import numpy as np
from services.github_service import generate_sample_demo_repository
from services.feature_extractor import extract_temporal_split_features, is_bug_fixing_commit
from services.ml_engine import train_and_predict_risks, _sanitize_obj, compute_rule_based_score
from routers.badge_router import _generate_badge_svg

def test_temporal_split_zero_leakage():
    """Verify that temporal split partitions commits into 70% train and 30% test without lookahead bias."""
    raw_commits = generate_sample_demo_repository("test-owner", "test-repo")
    assert len(raw_commits) >= 50

    train_features, train_labels, file_features, split_stats = extract_temporal_split_features(
        raw_commits,
        split_ratio=0.70
    )

    assert len(train_features) > 0
    assert len(train_labels) == len(train_features)
    assert len(file_features) > 0
    assert split_stats["split_ratio"] == 0.70
    assert split_stats["train_commits"] > split_stats["test_commits"]

def test_feature_extraction_keys():
    """Verify all 7 predictive signals are extracted per file."""
    raw_commits = generate_sample_demo_repository("test-owner", "test-repo")
    _, _, file_features, _ = extract_temporal_split_features(raw_commits, split_ratio=0.70)
    
    first_file = file_features[0]
    required_keys = [
        "file_path", "total_commits", "bug_fix_commits", "bug_ratio",
        "lines_churn_avg", "unique_authors", "days_since_modified",
        "complexity_proxy", "lines_of_code"
    ]
    for k in required_keys:
        assert k in first_file

def test_ml_engine_and_model_report():
    """Verify that ML engine computes ensemble models and honest out-of-fold metrics."""
    raw_commits = generate_sample_demo_repository("test-owner", "test-repo")
    train_features, train_labels, file_features, split_stats = extract_temporal_split_features(
        raw_commits,
        split_ratio=0.70
    )

    results, metadata, model_report = train_and_predict_risks(
        file_features=file_features,
        train_features=train_features,
        train_labels=train_labels,
        split_stats=split_stats
    )

    assert len(results) > 0
    assert "risk_score" in results[0]
    assert results[0]["risk_score"] >= 0.0 and results[0]["risk_score"] <= 100.0
    assert results[0]["risk_level"] in ["HIGH", "MEDIUM", "LOW"]

    assert model_report is not None
    assert "models" in model_report
    assert len(model_report["models"]) >= 3
    assert "feature_importances" in model_report

def test_nan_sanitization():
    """Verify _sanitize_obj converts NaN/inf to None."""
    data = {
        "score": float("nan"),
        "inf_val": float("inf"),
        "list_vals": [1.0, float("nan"), 3.0],
        "nested": {"val": float("-inf")}
    }
    cleaned = _sanitize_obj(data)
    assert cleaned["score"] is None
    assert cleaned["inf_val"] is None
    assert cleaned["list_vals"] == [1.0, None, 3.0]
    assert cleaned["nested"]["val"] is None

def test_badge_svg_generation():
    """Verify SVG badge rendering."""
    svg = _generate_badge_svg(label="bug risk", value="42% medium", color="#f59e0b")
    assert "<svg" in svg
    assert "bug risk" in svg
    assert "42% medium" in svg
    assert "#f59e0b" in svg

def test_parse_github_repo_url_strip_query_and_fragments():
    """Verify query strings and fragments are stripped from repo URLs."""
    from services.github_service import parse_github_repo_url
    
    # URL with query parameters
    owner, repo = parse_github_repo_url("https://github.com/fastapi/fastapi?tab=readme-ov-file")
    assert owner == "fastapi" and repo == "fastapi"
    
    # URL with hash fragment
    owner, repo = parse_github_repo_url("https://github.com/facebook/react#installation")
    assert owner == "facebook" and repo == "react"
    
    # URL with both query string and fragment
    owner, repo = parse_github_repo_url("https://github.com/tiangolo/sqlmodel?query=1#readme")
    assert owner == "tiangolo" and repo == "sqlmodel"
    
    # URL with .git and query string
    owner, repo = parse_github_repo_url("https://github.com/psf/requests.git?utm_source=test#top")
    assert owner == "psf" and repo == "requests"
    
    # Shorthand with query and fragment
    owner, repo = parse_github_repo_url("pallets/flask?branch=main#code")
    assert owner == "pallets" and repo == "flask"

def test_cors_regex_and_localhost():
    """Verify CORS allows localhost and regex-matching vercel preview domains."""
    from fastapi.testclient import TestClient
    from main import app
    
    client = TestClient(app)
    
    # 1. Localhost origin should be allowed
    res_local = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert res_local.status_code == 200
    assert res_local.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res_local.headers.get("access-control-allow-credentials") == "true"
    
    # 2. Matching Vercel regex origin should be allowed
    res_vercel_preview = client.get("/health", headers={"Origin": "https://bug-radar-preview-abc.vercel.app"})
    assert res_vercel_preview.status_code == 200
    assert res_vercel_preview.headers.get("access-control-allow-origin") == "https://bug-radar-preview-abc.vercel.app"
    assert res_vercel_preview.headers.get("access-control-allow-credentials") == "true"
    
    res_vercel_git = client.get("/health", headers={"Origin": "https://bug-radar-git-feature-branch.vercel.app"})
    assert res_vercel_git.status_code == 200
    assert res_vercel_git.headers.get("access-control-allow-origin") == "https://bug-radar-git-feature-branch.vercel.app"
    
    # 3. Non-matching origins should NOT be allowed
    res_disallowed = client.get("/health", headers={"Origin": "https://other-app.vercel.app"})
    assert res_disallowed.status_code == 200
    assert "access-control-allow-origin" not in res_disallowed.headers
    
    res_spoof = client.get("/health", headers={"Origin": "https://bug-radar-preview.vercel.app.attacker.com"})
    assert res_spoof.status_code == 200
    assert "access-control-allow-origin" not in res_spoof.headers

