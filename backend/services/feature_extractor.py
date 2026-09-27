import re
from datetime import datetime, timezone
from typing import List, Dict, Any

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
