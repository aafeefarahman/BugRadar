import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

# Regex to identify bug-fixing commits per specifications
BUG_FIX_REGEX = re.compile(
    r'\b(fix|fixes|fixed|bug|bugs|patch|patched|error|errors|issue|issues|crash|crashes|defect|defects|fault|regression)\b',
    re.IGNORECASE
)

# Language-agnostic cyclomatic complexity keyword regex proxy
COMPLEXITY_KEYWORDS_REGEX = re.compile(
    r'\b(if|elif|else\s+if|for|while|case|switch|catch|except|rescue|&&|\|\||\?)\b'
)

# Common extensions to classify / filter
SOURCE_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.go', '.rs', '.java', '.c', '.cpp',
    '.h', '.hpp', '.cs', '.php', '.rb', '.swift', '.kt', '.scala', '.sh', '.vue', '.svelte'
}

def is_bug_fixing_commit(message: str) -> bool:
    """Check if a commit message indicates a bug-fixing commit."""
    if not message:
        return False
    return bool(BUG_FIX_REGEX.search(message))

def calculate_cyclomatic_proxy(code_snippet_or_patch: str, estimated_loc: int) -> float:
    """
    Compute cyclomatic complexity proxy:
    Keyword count of branching constructs divided by LOC, normalized to a friendly scale.
    """
    if not code_snippet_or_patch:
        return 1.0
    matches = len(COMPLEXITY_KEYWORDS_REGEX.findall(code_snippet_or_patch))
    loc = max(estimated_loc, 10)
    # Relative density scaled to 1-100 score proxy
    density = (matches / loc) * 100
    return round(density, 2)

def extract_file_features(raw_commits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Aggregate per-file metrics from a list of commit details.
    
    Each commit item expected:
    - sha: str
    - message: str
    - date: datetime or ISO string
    - author: str
    - files: List[dict(filename, additions, deletions, changes, patch/raw)]
    """
    now = datetime.now(timezone.utc)
    file_map: Dict[str, Dict[str, Any]] = {}

    for commit in raw_commits:
        message = commit.get("message", "")
        is_bug_fix = is_bug_fixing_commit(message)
        author = commit.get("author", "Unknown")
        commit_date = commit.get("date")
        
        if isinstance(commit_date, str):
            try:
                # Handle ISO 8601 strings e.g. 2026-03-24T12:00:00Z
                dt = datetime.fromisoformat(commit_date.replace("Z", "+00:00"))
            except Exception:
                dt = now
        elif isinstance(commit_date, datetime):
            dt = commit_date if commit_date.tzinfo else commit_date.replace(tzinfo=timezone.utc)
        else:
            dt = now

        for f in commit.get("files", []):
            filename = f.get("filename", "")
            if not filename:
                continue

            # Ignore non-source or asset binary files
            ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
            if ext in {".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".lock", ".pdf", ".zip", ".tar", ".gz"}:
                continue

            additions = int(f.get("additions", 0))
            deletions = int(f.get("deletions", 0))
            changes = additions + deletions
            patch = f.get("patch", "")

            if filename not in file_map:
                file_map[filename] = {
                    "file_path": filename,
                    "file_type": ext or "other",
                    "total_commits": 0,
                    "bug_fix_commits": 0,
                    "total_changes": 0,
                    "total_additions": 0,
                    "total_deletions": 0,
                    "authors": set(),
                    "latest_commit_date": dt,
                    "patch_samples": [],
                    "estimated_loc": 50  # base assumption
                }

            entry = file_map[filename]
            entry["total_commits"] += 1
            if is_bug_fix:
                entry["bug_fix_commits"] += 1
            entry["total_changes"] += changes
            entry["total_additions"] += additions
            entry["total_deletions"] += deletions
            entry["authors"].add(author)

            if dt > entry["latest_commit_date"]:
                entry["latest_commit_date"] = dt

            if patch and len(entry["patch_samples"]) < 5:
                entry["patch_samples"].append(patch)
                # refine estimated LOC by net additions
                entry["estimated_loc"] = max(20, entry["estimated_loc"] + additions - (deletions // 2))

    # Now compute aggregated per-file record
    results = []
    for filename, data in file_map.items():
        total_commits = data["total_commits"]
        bug_fix_commits = data["bug_fix_commits"]
        bug_ratio = round(bug_fix_commits / total_commits, 4) if total_commits > 0 else 0.0
        avg_churn = round(data["total_changes"] / total_commits, 2) if total_commits > 0 else 0.0
        unique_authors = len(data["authors"])
        
        days_since_modified = max(0, (now - data["latest_commit_date"]).days)
        combined_patch = " ".join(data["patch_samples"])
        complexity_proxy = calculate_cyclomatic_proxy(combined_patch, data["estimated_loc"])

        results.append({
            "file_path": filename,
            "file_type": data["file_type"],
            "total_commits": total_commits,
            "bug_fix_commits": bug_fix_commits,
            "bug_ratio": bug_ratio,
            "lines_churn_avg": avg_churn,
            "unique_authors": unique_authors,
            "days_since_modified": days_since_modified,
            "complexity_proxy": complexity_proxy,
            "lines_of_code": data["estimated_loc"]
        })

    return results

def parse_commit_datetime(commit: Dict[str, Any]) -> datetime:
    """Safely parse commit timestamp into timezone-aware datetime."""
    now = datetime.now(timezone.utc)
    commit_date = commit.get("date")
    if isinstance(commit_date, str):
        try:
            return datetime.fromisoformat(commit_date.replace("Z", "+00:00"))
        except Exception:
            return now
    elif isinstance(commit_date, datetime):
        return commit_date if commit_date.tzinfo else commit_date.replace(tzinfo=timezone.utc)
    return now

def extract_temporal_split_features(
    raw_commits: List[Dict[str, Any]], 
    split_ratio: float = 0.70
) -> Tuple[List[Dict[str, Any]], List[int], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Perform a strict temporal split across commit history to prevent label leakage.
    - Features are computed from the historical (oldest split_ratio %) commits.
    - Binary labels y are derived from the future (newest (1 - split_ratio) %) commits:
      A file is labeled buggy (y=1) if it is modified in at least one bug-fixing commit
      in the future evaluation window.
    - Full features across all commits are also returned to maintain complete UI visibility.
    """
    if not raw_commits:
        return [], [], [], {
            "total_commits": 0,
            "train_commits": 0,
            "test_commits": 0,
            "split_ratio": split_ratio
        }

    # Sort chronologically (oldest commit first, newest commit last)
    sorted_commits = sorted(raw_commits, key=parse_commit_datetime)
    total_commits = len(sorted_commits)

    if total_commits < 4:
        split_idx = max(1, total_commits - 1)
    else:
        split_idx = max(1, int(total_commits * split_ratio))
        # Ensure at least 1 commit in test window
        if split_idx >= total_commits:
            split_idx = total_commits - 1

    historical_commits = sorted_commits[:split_idx]
    future_commits = sorted_commits[split_idx:]

    # 1. Compute features solely on the historical commit window
    historical_file_features = extract_file_features(historical_commits)

    # 2. Identify files that received bug-fixing commits in the future window
    future_buggy_files = set()
    for commit in future_commits:
        if is_bug_fixing_commit(commit.get("message", "")):
            for f in commit.get("files", []):
                fname = f.get("filename", "")
                if fname:
                    future_buggy_files.add(fname)

    # 3. Label historical files (y = 1 if fixed in future window, else 0)
    train_features = []
    train_labels = []

    for f_feat in historical_file_features:
        train_features.append(f_feat)
        train_labels.append(1 if f_feat["file_path"] in future_buggy_files else 0)

    # If future window had no bug fixes at all (edge case in sample or quiescent repo),
    # fallback to historical bug_fix_commits > 0 labels so supervised training remains informative
    if sum(train_labels) == 0:
        train_labels = [1 if f["bug_fix_commits"] > 0 else 0 for f in historical_file_features]

    # 4. Compute full features across all commits for full repo reporting and Treemap
    full_file_features = extract_file_features(sorted_commits)

    # 5. Extract Weekly Bug-Fix Timeline with 70/30 split boundary
    commit_timeline = extract_commit_timeline(sorted_commits, split_idx)

    split_stats = {
        "total_commits": total_commits,
        "train_commits": len(historical_commits),
        "test_commits": len(future_commits),
        "split_ratio": split_ratio,
        "positive_labels": int(sum(train_labels)),
        "negative_labels": int(len(train_labels) - sum(train_labels)),
        "commit_timeline": commit_timeline
    }

    return train_features, train_labels, full_file_features, split_stats

def extract_commit_timeline(
    sorted_commits: List[Dict[str, Any]],
    split_idx: int
) -> List[Dict[str, Any]]:
    """Group commits into chronological weekly buckets with bug-fix counts and split indicator."""
    if not sorted_commits:
        return []
    
    weeks_map: Dict[str, Dict[str, Any]] = {}
    for i, c in enumerate(sorted_commits):
        dt = parse_commit_datetime(c)
        is_bug = is_bug_fixing_commit(c.get("message", ""))
        iso_year, iso_week, _ = dt.isocalendar()
        key = f"{iso_year}-W{iso_week:02d}"
        label = dt.strftime("%b %d")
        is_history = (i < split_idx)

        if key not in weeks_map:
            weeks_map[key] = {
                "week_key": key,
                "label": label,
                "total_commits": 0,
                "bug_fixes": 0,
                "is_training_window": is_history
            }
        weeks_map[key]["total_commits"] += 1
        if is_bug:
            weeks_map[key]["bug_fixes"] += 1
        if not is_history:
            weeks_map[key]["is_training_window"] = False

    timeline = list(weeks_map.values())
    return timeline[-16:] if len(timeline) > 16 else timeline


