from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# --- Analysis Schemas ---
class AnalyzeRequest(BaseModel):
    repo_url: str
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
    top_features: Optional[List[Dict[str, Any]]] = None

class ConfusionMatrixSchema(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int

class ModelMetricItem(BaseModel):
    model_name: str
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    roc_auc: Optional[float] = None
    cv_f1_mean: Optional[float] = None
    cv_f1_std: Optional[float] = None
    cv_auc_mean: Optional[float] = None
    cv_auc_std: Optional[float] = None
    confusion_matrix: ConfusionMatrixSchema
    roc_curve: Optional[List[Dict[str, float]]] = None
    pr_curve: Optional[List[Dict[str, float]]] = None

class FeatureImportanceItem(BaseModel):
    feature: str
    display_name: str
    importance: float

class ModelReportSchema(BaseModel):
    split_strategy: str
    train_commit_count: int
    test_commit_count: int
    train_file_count: int
    positive_samples: int
    negative_samples: int
    best_model: str
    models: List[ModelMetricItem]
    feature_importances: List[FeatureImportanceItem]
    roc_comparison_points: Optional[List[Dict[str, Any]]] = None
    pr_comparison_points: Optional[List[Dict[str, Any]]] = None
    pr_baseline: Optional[float] = None
    insufficient_labels: Optional[bool] = False
    warning: Optional[str] = None
    methodology_notes: str

class AnalysisSummary(BaseModel):
    total_files: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    avg_risk_score: float
    top_vulnerable_file: Optional[str] = None
    total_commits: int
    bug_fixing_commits: int
    rate_limit_remaining: Optional[int] = None
    rate_limit_limit: Optional[int] = None
    data_source: Optional[str] = "Real Repository (GitHub API)"

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
    model_report: Optional[ModelReportSchema] = None
    commit_timeline: Optional[List[Dict[str, Any]]] = None
    rate_limit_remaining: Optional[int] = None
    rate_limit_limit: Optional[int] = None
    data_source: Optional[str] = "Real Repository (GitHub API)"



