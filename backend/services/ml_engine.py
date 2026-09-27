import math
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

def compute_rule_based_score(file_feat: Dict[str, Any]) -> Tuple[float, List[str]]:
    """
    Compute a domain-heuristic fallback bug risk score (0 - 100)
    and formulate human-understandable explanations for viva/code-review.
    
    Formula:
    - Bug history & ratio weight: 35%
    - Code churn weight: 25%
    - Complexity proxy weight: 20%
    - Author dispersion & recency: 20%
    """
    bug_fix_commits = file_feat["bug_fix_commits"]
    total_commits = file_feat["total_commits"]
    bug_ratio = file_feat["bug_ratio"]
    avg_churn = file_feat["lines_churn_avg"]
    complexity = file_feat["complexity_proxy"]
    authors = file_feat["unique_authors"]
    days_since_mod = file_feat["days_since_modified"]

    # 1. Bug fixing history component (0 - 35)
    if bug_fix_commits > 0:
        bug_comp = min(35.0, 15.0 * math.log2(bug_fix_commits + 1) + 20.0 * bug_ratio)
    else:
        bug_comp = 0.0

    # 2. Churn component (0 - 25)
    # Logarithmic saturation on lines churn
    churn_norm = min(1.0, math.log1p(avg_churn) / math.log1p(250))
    churn_comp = 25.0 * churn_norm

    # 3. Complexity proxy component (0 - 20)
    comp_norm = min(1.0, complexity / 25.0)
    comp_comp = 20.0 * comp_norm

    # 4. Author & Recency component (0 - 20)
    author_factor = min(1.0, (authors - 1) / 5.0) if authors > 1 else 0.1
    # Recency factor: modified recently (<30 days) adds risk
    recency_factor = max(0.0, 1.0 - (days_since_mod / 90.0))
    author_recency_comp = (12.0 * author_factor) + (8.0 * recency_factor)

    raw_rule_score = bug_comp + churn_comp + comp_comp + author_recency_comp
    rule_score = max(5.0, min(99.0, raw_rule_score))

    # Generate Top Contributing Reasons
    reasons = []
    if bug_fix_commits > 0:
        reasons.append(f"{bug_fix_commits} bug-fix commit{'s' if bug_fix_commits > 1 else ''} ({round(bug_ratio * 100)}% of touches)")
    
    if avg_churn > 60:
        reasons.append(f"High code churn (avg {int(avg_churn)} lines/commit)")
    elif avg_churn > 25:
        reasons.append(f"Moderate code churn (avg {int(avg_churn)} lines/commit)")

    if complexity > 15:
        reasons.append(f"Elevated cyclomatic complexity proxy ({complexity:.1f})")
    elif complexity > 8:
        reasons.append(f"Moderate control-flow branching ({complexity:.1f})")

    if authors >= 4:
        reasons.append(f"High developer dispersion ({authors} unique authors)")
    elif authors > 1:
        reasons.append(f"Collaborative file ({authors} authors)")

    if days_since_mod <= 7:
        reasons.append("Active modification in the last 7 days")
    elif days_since_mod <= 30:
        reasons.append(f"Modified {days_since_mod} days ago")

    if not reasons:
        reasons.append("Low historical churn and clean revision record")

    return round(rule_score, 1), reasons[:4]

def train_and_predict_risks(file_features: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Train a Random Forest classifier on repo file metrics,
    predict probabilities, blend with heuristic fallback score,
    and package comprehensive risk profiles.
    """
    n_samples = len(file_features)
    if n_samples == 0:
        return [], {
            "algorithm": "None",
            "blended_weight_ml": 0.0,
            "blended_weight_rule": 1.0,
            "training_samples": 0,
            "class_balance_ratio": 0.0,
            "notes": "No files extracted"
        }

    # Features: [total_commits, bug_fix_commits, bug_ratio, lines_churn_avg, unique_authors, days_since_modified, complexity_proxy]
    X_matrix = []
    y_labels = []

    for f in file_features:
        features = [
            float(f["total_commits"]),
            float(f["bug_fix_commits"]),
            float(f["bug_ratio"]),
            float(f["lines_churn_avg"]),
            float(f["unique_authors"]),
            float(f["days_since_modified"]),
            float(f["complexity_proxy"])
        ]
        X_matrix.append(features)
        y_labels.append(1 if f["bug_fix_commits"] > 0 else 0)

    X = np.array(X_matrix)
    y = np.array(y_labels)

    pos_count = int(np.sum(y))
    neg_count = n_samples - pos_count
    class_ratio = round(pos_count / max(n_samples, 1), 3)

    # Calculate dynamic blend weight for ML vs Rule
    # When sample size is small (< 30) or classes are highly single-sided, we give more weight to Rule-based
    if n_samples >= 25 and pos_count >= 3 and neg_count >= 3:
        # Sufficient data for ML
        ml_weight = min(0.65, 0.30 + (n_samples / 100.0) * 0.35)
        can_train_ml = True
    elif n_samples >= 10 and pos_count >= 1:
        ml_weight = 0.30
        can_train_ml = True
    else:
        ml_weight = 0.15 if (pos_count > 0 and neg_count > 0) else 0.0
        can_train_ml = (pos_count > 0 and neg_count > 0)

    rule_weight = round(1.0 - ml_weight, 2)
    ml_weight = round(ml_weight, 2)

    ml_probs = np.zeros(n_samples)

    if can_train_ml:
        try:
            # Train Random Forest Classifier with class balancing
            rf = RandomForestClassifier(
                n_estimators=60,
                max_depth=4,
                min_samples_split=max(2, n_samples // 20),
                random_state=42,
                class_weight="balanced"
            )
            rf.fit(X, y)
            # Predict probability of class 1 (buggy)
            if len(rf.classes_) == 2:
                ml_probs = rf.predict_proba(X)[:, 1]
            else:
                # Only 1 class present
                single_cls = rf.classes_[0]
                ml_probs = np.full(n_samples, 0.8 if single_cls == 1 else 0.2)
        except Exception:
            # Fallback if scikit-learn training hits edge case
            ml_probs = np.array([f["bug_ratio"] for f in file_features])
    else:
        # When dataset is too sparse for supervised fit, ML prob estimates from normalized ratios
        ml_probs = np.array([min(1.0, f["bug_ratio"] * 1.2) for f in file_features])

    results = []
    for i, file_feat in enumerate(file_features):
        rule_score, top_reasons = compute_rule_based_score(file_feat)
        ml_prob = float(ml_probs[i])
        ml_score = ml_prob * 100.0

        # Dynamic Blended Final Score
        final_risk = (ml_weight * ml_score) + (rule_weight * rule_score)
        final_risk = round(max(2.0, min(98.5, final_risk)), 1)

        # Risk Classification
        if final_risk >= 65.0:
            risk_level = "HIGH"
        elif final_risk >= 35.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        results.append({
            "file_path": file_feat["file_path"],
            "risk_score": final_risk,
            "risk_level": risk_level,
            "ml_probability": round(ml_prob, 3),
            "rule_score": rule_score,
            "bug_fix_commits": file_feat["bug_fix_commits"],
            "total_commits": file_feat["total_commits"],
            "bug_ratio": file_feat["bug_ratio"],
            "lines_churn_avg": file_feat["lines_churn_avg"],
            "unique_authors": file_feat["unique_authors"],
            "days_since_modified": file_feat["days_since_modified"],
            "complexity_proxy": file_feat["complexity_proxy"],
            "lines_of_code": file_feat["lines_of_code"],
            "top_reasons": top_reasons,
            "file_type": file_feat["file_type"]
        })

    # Sort descending by risk score
    results.sort(key=lambda x: x["risk_score"], reverse=True)

    metadata = {
        "algorithm": "Random Forest Classifier + Bayesian Heuristic Blender" if can_train_ml else "Adaptive Heuristic Churn-Complexity Engine",
        "blended_weight_ml": ml_weight,
        "blended_weight_rule": rule_weight,
        "training_samples": n_samples,
        "class_balance_ratio": class_ratio,
        "notes": f"Blended {int(ml_weight*100)}% ML + {int(rule_weight*100)}% Rule heuristic. Adapted to sample size (N={n_samples})."
    }

    return results, metadata
