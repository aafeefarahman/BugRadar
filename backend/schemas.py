from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# --- Analysis Schemas ---
class AnalyzeRequest(BaseModel):
    repo_url: str
    github_token: Optional[str] = None
    use_sample: Optional[bool] = False
    max_commits: Optional[int] = 200

class FileRiskSummary(BaseModel):
    file_path: str
    risk_score: float                # 0 to 100
    risk_level: str                  # "HIGH", "MEDIUM", "LOW"
    ml_probability: float            # 0.0 to 1.0
    rule_score: float                # 0 to 100
    bug_fix_commits: int
    total_commits: int
    bug_ratio: float
    lines_churn_avg: float
    unique_authors: int
    days_since_modified: int
    complexity_proxy: float
    lines_of_code: int
    top_reasons: List[str]
    file_type: str
    fix_suggestion: Optional[str] = None

class AnalysisSummary(BaseModel):
    total_files: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    avg_risk_score: float
    top_vulnerable_file: Optional[str] = None
    total_commits: int
    bug_fixing_commits: int

class ModelMetadata(BaseModel):
    algorithm: str
    blended_weight_ml: float
    blended_weight_rule: float
    training_samples: int
    class_balance_ratio: float
    notes: str

class AnalyzeResponse(BaseModel):
    repo_url: str
    repo_name: str
    is_cached: bool
    cached_at: Optional[str] = None
    summary: AnalysisSummary
    files: List[FileRiskSummary]
    model_metadata: ModelMetadata
