import re
import random
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
from fastapi import HTTPException
try:
    from config import settings
except ImportError:
    from backend.config import settings

def parse_github_repo_url(url: str) -> Tuple[str, str]:
    """
    Extracts (owner, repo) from URLs like:
    - https://github.com/fastapi/fastapi
    - https://github.com/fastapi/fastapi.git
    - github.com/fastapi/fastapi/
    - fastapi/fastapi
    """
    clean = url.strip().rstrip("/")
    if clean.endswith(".git"):
        clean = clean[:-4]
    
    # Check for github.com pattern
    match = re.search(r'github\.com[/:]([\w.-]+)/([\w.-]+)', clean)
    if match:
        return match.group(1), match.group(2)
    
    # Check for owner/repo shorthand
    parts = clean.split("/")
    if len(parts) == 2 and not clean.startswith("http"):
        return parts[0], parts[1]
    
    # Strip protocol and check
    clean = re.sub(r'^https?://', '', clean)
    parts = clean.split("/")
    if len(parts) >= 2:
        return parts[-2], parts[-1]

    raise HTTPException(
        status_code=400,
        detail="Invalid GitHub repository URL. Please provide a valid URL like 'https://github.com/owner/repository' or 'owner/repository'."
    )

async def fetch_github_repo_commits(
    owner: str,
    repo: str,
    token: Optional[str] = None,
    max_commits: int = 200
) -> Tuple[List[Dict[str, Any]], Optional[int], Optional[int]]:
    """
    Fetches commit history and file diffs using GitHub REST API.
    Handles rate limits, pagination, and token authentication.
    Returns (parsed_commits, rate_limit_remaining, rate_limit_limit).
    """
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "BugRadar-AI-Scanner/1.0"
    }
    
    # Use supplied token or default to settings.GITHUB_TOKEN
    effective_token = token.strip() if (token and token.strip()) else settings.GITHUB_TOKEN
    if effective_token and effective_token.strip():
        headers["Authorization"] = f"Bearer {effective_token.strip()}"

    base_url = f"https://api.github.com/repos/{owner}/{repo}"
    rate_limit_remaining = None
    rate_limit_limit = None
    
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        # 1. Verify repository existence & accessibility
        try:
            repo_res = await client.get(base_url, headers=headers)
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Network error connecting to GitHub API: {str(e)}"
            )

        if "x-ratelimit-remaining" in repo_res.headers:
            try:
                rate_limit_remaining = int(repo_res.headers.get("x-ratelimit-remaining"))
            except Exception:
                pass
        if "x-ratelimit-limit" in repo_res.headers:
            try:
                rate_limit_limit = int(repo_res.headers.get("x-ratelimit-limit"))
            except Exception:
                pass

        if repo_res.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Repository '{owner}/{repo}' not found. Please verify that the repository exists and is public."
            )
        elif repo_res.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="GitHub authentication failed. Please verify server GITHUB_TOKEN configuration."
            )
        elif repo_res.status_code == 403:
            msg = repo_res.json().get("message", "") if repo_res.text.startswith("{") else repo_res.text
            if "rate limit" in str(msg).lower():
                raise HTTPException(
                    status_code=429,
                    detail="GitHub rate limit reached. Please try again later or run the instant demo."
                )
            raise HTTPException(
                status_code=403,
                detail=f"Access forbidden by GitHub: {msg}"
            )
        elif repo_res.status_code != 200:
            raise HTTPException(
                status_code=repo_res.status_code,
                detail=f"GitHub API returned error: {repo_res.text}"
            )

        # 2. Fetch commits (paginated up to max_commits)
        commits_list = []
        page = 1
        per_page = 100
        total_needed = min(max_commits, 200)

        while len(commits_list) < total_needed:
            commits_url = f"{base_url}/commits?per_page={per_page}&page={page}"
            res = await client.get(commits_url, headers=headers)
            
            if "x-ratelimit-remaining" in res.headers:
                try:
                    rate_limit_remaining = int(res.headers.get("x-ratelimit-remaining"))
                except Exception:
                    pass

            if res.status_code != 200:
                break
            
            batch = res.json()
            if not batch or not isinstance(batch, list):
                break
                
            commits_list.extend(batch)
            if len(batch) < per_page:
                break
            page += 1

        if not commits_list:
            raise HTTPException(
                status_code=400,
                detail=f"No commit history found in repository '{owner}/{repo}'."
            )

        # Slice to requested max
        commits_list = commits_list[:total_needed]

        # 3. For detailed file changes, fetch individual commit details
        detailed_limit = 120 if (effective_token and effective_token.strip()) else 30
        commits_to_inspect = commits_list[:detailed_limit]

        parsed_commits = []

        for c_item in commits_to_inspect:
            sha = c_item.get("sha", "")
            commit_info = c_item.get("commit", {})
            message = commit_info.get("message", "")
            author_info = commit_info.get("author", {})
            author_name = author_info.get("name") or (c_item.get("author") or {}).get("login", "contributor")
            commit_date = author_info.get("date", datetime.now(timezone.utc).isoformat())

            # Fetch detailed commit changes
            commit_detail_res = await client.get(f"{base_url}/commits/{sha}", headers=headers)
            
            files_changed = []
            if commit_detail_res.status_code == 200:
                c_data = commit_detail_res.json()
                for f in c_data.get("files", []):
                    files_changed.append({
                        "filename": f.get("filename", ""),
                        "additions": f.get("additions", 0),
                        "deletions": f.get("deletions", 0),
                        "changes": f.get("changes", 0),
                        "patch": f.get("patch", "")
                    })
            
            parsed_commits.append({
                "sha": sha,
                "message": message,
                "author": author_name,
                "date": commit_date,
                "files": files_changed
            })

        return parsed_commits, rate_limit_remaining, rate_limit_limit

def generate_sample_demo_repository(owner: str, repo: str) -> List[Dict[str, Any]]:
    """
    Generates realistic, rich commit histories with authentic bug-fix patterns,
    churn distributions, and cyclomatic complexity variations for seamless offline
    or rate-limit-free viva and presentation demonstrations.
    """
    now = datetime.now(timezone.utc)
    authors = ["alex_lead", "sarah_core", "dev_chen", "elena_backend", "jordan_fe", "marcus_qa"]
    
    files_catalog = [
        {"path": "src/core/auth_service.py", "type": "backend", "base_complexity": 22.4, "bug_tendency": 0.65},
        {"path": "src/controllers/payment_processor.py", "type": "backend", "base_complexity": 28.1, "bug_tendency": 0.75},
        {"path": "src/middleware/session_validator.py", "type": "backend", "base_complexity": 18.0, "bug_tendency": 0.45},
        {"path": "src/services/order_calculator.py", "type": "backend", "base_complexity": 19.5, "bug_tendency": 0.50},
        {"path": "src/database/query_builder.py", "type": "backend", "base_complexity": 24.8, "bug_tendency": 0.60},
        {"path": "src/utils/crypto_helpers.py", "type": "backend", "base_complexity": 12.0, "bug_tendency": 0.20},
        {"path": "src/components/CheckoutModal.tsx", "type": "frontend", "base_complexity": 16.5, "bug_tendency": 0.55},
        {"path": "src/components/DataTable.tsx", "type": "frontend", "base_complexity": 14.2, "bug_tendency": 0.35},
        {"path": "src/hooks/useWebSocketStream.ts", "type": "frontend", "base_complexity": 21.0, "bug_tendency": 0.60},
        {"path": "src/state/globalStore.ts", "type": "frontend", "base_complexity": 15.3, "bug_tendency": 0.40},
        {"path": "src/api/httpClient.ts", "type": "frontend", "base_complexity": 8.5, "bug_tendency": 0.15},
        {"path": "src/config/envLoader.py", "type": "backend", "base_complexity": 6.2, "bug_tendency": 0.10},
        {"path": "src/views/UserDashboard.tsx", "type": "frontend", "base_complexity": 9.4, "bug_tendency": 0.25},
        {"path": "src/validators/schemaChecker.ts", "type": "backend", "base_complexity": 17.8, "bug_tendency": 0.45},
        {"path": "src/workers/backgroundSync.py", "type": "backend", "base_complexity": 26.3, "bug_tendency": 0.70},
        {"path": "src/utils/dateFormatter.ts", "type": "frontend", "base_complexity": 4.1, "bug_tendency": 0.05}
    ]

    commit_messages_templates = {
        "bug_fix": [
            "fix(auth): resolve race condition in token expiration refresh",
            "fix(payment): patch null pointer exception during currency conversion",
            "bug: fix crash when user payload contains malformed utf-8 characters",
            "fix(worker): handle timeout exception on redis disconnect",
            "hotfix: prevent double charge defect on stripe retry callback",
            "fix(state): resolve state desync issue in checkout stepper",
            "patch: address memory leak error in websocket subscription",
            "fix: correct order total rounding defect on discount vouchers",
            "fix(db): handle transaction rollback on deadlocks in query builder"
        ],
        "feature": [
            "feat(auth): add multi-factor authentication support via TOTP",
            "feat(checkout): add Apple Pay and Google Pay integration",
            "feat(ui): redesign table sorting and pagination component",
            "feat(worker): implement exponential backoff retry for notifications",
            "refactor: modernize state store and reduce re-renders",
            "chore: update dependencies and build pipeline",
            "docs: update API documentation and onboarding instructions",
            "feat(analytics): add telemetry events on conversion funnels"
        ]
    }

    mock_commits = []
    num_commits = 85

    for i in range(num_commits):
        commit_date = now - timedelta(days=int((num_commits - i) * 1.1), hours=random.randint(1, 23))
        author = random.choice(authors)
        
        # Decide if this commit is a bug-fix commit
        is_bug = random.random() < 0.42
        if is_bug:
            msg = random.choice(commit_messages_templates["bug_fix"])
        else:
            msg = random.choice(commit_messages_templates["feature"])

        # Pick 1 to 4 files touched in this commit
        # If bug fix, pick files with higher bug tendency
        weights = [f["bug_tendency"] if is_bug else (1.0 - f["bug_tendency"] * 0.5) for f in files_catalog]
        chosen_files = random.choices(files_catalog, weights=weights, k=random.randint(1, 4))
        
        files_payload = []
        for cf in chosen_files:
            additions = random.randint(5, 120 if not is_bug else 45)
            deletions = random.randint(2, 60 if not is_bug else 35)
            
            patch_sim = "if (err) { handleException(); } for (let item of list) { switch(type) { case 1: break; } }" if cf["base_complexity"] > 15 else "const x = val; return x;"

            files_payload.append({
                "filename": cf["path"],
                "additions": additions,
                "deletions": deletions,
                "changes": additions + deletions,
                "patch": patch_sim
            })

        mock_commits.append({
            "sha": f"demo_{i:04x}{random.randint(1000, 9999)}",
            "message": msg,
            "author": author,
            "date": commit_date.isoformat(),
            "files": files_payload
        })

    return mock_commits
