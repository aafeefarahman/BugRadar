# BugRadar — AI-Based Predictive Bug Prediction System

> **"Know which files will break before you ship"**  
> An end-to-end full-stack AI system that mines Git commit history, extracts code churn and complexity metrics, and trains a hybrid Machine Learning & heuristic model to forecast file-level defect risks.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Custom Interactive Risk Treemap / Heatmap visualizer.
- **Backend**: FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy, Uvicorn, Httpx.
- **Machine Learning**: `scikit-learn` (`RandomForestClassifier`), NumPy, Pandas.
- **Database**: SQLite (built-in, seamless swappable to PostgreSQL via `DATABASE_URL` environment variable).
- **Authentication**: JWT (JSON Web Tokens) with `bcrypt` password hashing.
- **Data Pipeline**: GitHub REST API v3 commit mining, regex weak-supervision heuristics, language-agnostic cyclomatic complexity proxy.

---

## Key Features

1. **Authentication & User Session**
   - Secure email/password registration and login with JWT access tokens.
   - Scan history tracking for signed-in developers.
   - Guest scans permitted without mandatory sign-in.

2. **Repository Connector & Smart Token Handling**
   - Paste any public GitHub URL (e.g. `https://github.com/pallets/flask` or `fastapi/fastapi`).
   - Quick-pick sample presets for instant evaluations.
   - **Optional Personal Access Token (PAT)** support: Unlocks GitHub's 5,000 req/hr tier (bumping up from the 60 req/hr unauthenticated limit).
   - **Privacy First**: PATs are stored **only in ephemeral session memory** and are never saved to disk or the database.

3. **Telemetry Mining & Feature Extraction Pipeline**
   - Inspects up to 200 commits per repository.
   - Identifies bug-fixing commits using the regex heuristic: `/\b(fix|bug|patch|error|issue|crash|defect|regression)\b/i`.
   - Per-file aggregated metrics:
     - `total_commits`: Touch frequency.
     - `bug_fix_commits`: Historical defect involvement.
     - `bug_ratio`: Proportion of commits modifying this file that were bug fixes.
     - `lines_churn_avg`: Average lines added/deleted per commit.
     - `unique_authors`: Developer dispersion and team handoff turnover.
     - `days_since_modified`: Recency of code changes.
     - `complexity_proxy`: Keyword-based branching density proxy (`if/for/while/case/switch/catch` divided by LOC).

4. **Hybrid AI / Rule-Based Blending Engine**
   - Trains a `RandomForestClassifier` with balanced class weights on historical file features.
   - Computes a domain-heuristic fallback score (weighted formula of bug history, churn, complexity, and author count).
   - **Adaptive Dynamic Blend**: Automatically balances ML score vs. heuristic score based on sample size $N$, preventing model degradation or overfitting on small repos.
   - Generates human-readable "Top Contributing Factors" for code review decisions.

5. **Modern SaaS Dashboard & Heatmap Visualizer**
   - Summary KPI cards: Total files analyzed, High/Medium/Low risk counts, Average codebase risk.
   - **Interactive Treemap / Heatmap**: Color-coded tiles (Emerald $\rightarrow$ Amber $\rightarrow$ Red) with live tooltips and click-to-inspect.
   - **Sortable & Filterable Risk Table**: Real-time search, risk-level tabs, sort by any metric.
   - **Expandable Factor Drawers**: Click any row to see why the AI flagged the file.
   - **Report Export**: Instant export to CSV and JSON formats.
   - **Dark / Light Mode Toggle**: Smooth theme switching.


