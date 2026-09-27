# 🎯 BugRadar — AI-Based Predictive Bug Prediction System

> **"Know which files will break before you ship"**  
> An end-to-end full-stack AI system that mines Git commit history, extracts code churn and complexity metrics, and trains a hybrid Machine Learning & heuristic model to forecast file-level defect risks.

---

## ⚡ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Custom Interactive Risk Treemap / Heatmap visualizer.
- **Backend**: FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy, Uvicorn, Httpx.
- **Machine Learning**: `scikit-learn` (`RandomForestClassifier`), NumPy, Pandas.
- **Database**: SQLite (built-in, seamless swappable to PostgreSQL via `DATABASE_URL` environment variable).
- **Authentication**: JWT (JSON Web Tokens) with `bcrypt` password hashing.
- **Data Pipeline**: GitHub REST API v3 commit mining, regex weak-supervision heuristics, language-agnostic cyclomatic complexity proxy.

---

## 🚀 Key Features

1. **🔐 Authentication & User Session**
   - Secure email/password registration and login with JWT access tokens.
   - Scan history tracking for signed-in developers.
   - Guest scans permitted without mandatory sign-in.

2. **🔗 Repository Connector & Smart Token Handling**
   - Paste any public GitHub URL (e.g. `https://github.com/pallets/flask` or `fastapi/fastapi`).
   - Quick-pick sample presets for instant evaluations.
   - **Optional Personal Access Token (PAT)** support: Unlocks GitHub's 5,000 req/hr tier (bumping up from the 60 req/hr unauthenticated limit).
   - **Privacy First**: PATs are stored **only in ephemeral session memory** and are never saved to disk or the database.

3. **📊 Telemetry Mining & Feature Extraction Pipeline**
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

4. **🤖 Hybrid AI / Rule-Based Blending Engine**
   - Trains a `RandomForestClassifier` with balanced class weights on historical file features.
   - Computes a domain-heuristic fallback score (weighted formula of bug history, churn, complexity, and author count).
   - **Adaptive Dynamic Blend**: Automatically balances ML score vs. heuristic score based on sample size $N$, preventing model degradation or overfitting on small repos.
   - Generates human-readable "Top Contributing Factors" for code review decisions.

5. **🎨 Modern SaaS Dashboard & Heatmap Visualizer**
   - Summary KPI cards: Total files analyzed, High/Medium/Low risk counts, Average codebase risk.
   - **Interactive Treemap / Heatmap**: Color-coded tiles (Emerald $\rightarrow$ Amber $\rightarrow$ Red) with live tooltips and click-to-inspect.
   - **Sortable & Filterable Risk Table**: Real-time search, risk-level tabs, sort by any metric.
   - **Expandable Factor Drawers**: Click any row to see why the AI flagged the file.
   - **Report Export**: Instant export to CSV and JSON formats.
   - **Dark / Light Mode Toggle**: Smooth theme switching.

6. **🎓 Academic Viva & Evaluation Defense Manual**
   - Built-in `/methodology` page detailing weak supervision theory, limitations of regex labeling, feature mathematical formulations, and answers to common examiner questions.

---

## 🛠️ Quickstart / Running Locally

You can run both the backend and frontend locally in two terminal windows:

### 1. Start the Backend API (FastAPI)

```bash
# Navigate to the backend directory
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on http://localhost:8000)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API Docs (Swagger UI): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

### 2. Start the Frontend (React + Vite)

In a second terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗄️ Database Configuration

By default, BugRadar uses SQLite (`backend/bugradar.db`) for zero-configuration development. To switch to PostgreSQL in production:

```bash
# Set the DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/bugradar_db"
```

SQLAlchemy will automatically detect the connection string and configure the engine.

---

## 🧠 Viva & Project Evaluation Summary

### 1. Why Weak-Supervision Regex Matching?
Real git commits lack ground-truth defect annotations. Regex keyword matching (`fix`, `bug`, `patch`, `error`, `crash`) serves as a practical weak-label heuristic based on empirical software engineering research (Mockus et al., SZZ algorithm).

### 2. Known Limitations
- *False Positives*: Commits fixing typographical errors or documentation still match the keyword "fix".
- *False Negatives*: Bug-fix commits with vague messages (e.g., "update logic") are omitted.
- *Mitigation*: Our dynamic heuristic fallback accounts for code churn, cyclomatic branching complexity, and contributor turnover to cross-verify risk even when commit messages are sparse.

### 3. Dynamic Score Blending Formulation
$$\text{Weight}_{ML} = \min\left(0.65, 0.30 + \frac{N_{\text{files}}}{100} \times 0.35\right)$$
$$\text{Weight}_{\text{Rule}} = 1.0 - \text{Weight}_{ML}$$
$$\text{Final Risk Score} = \left(\text{Weight}_{ML} \times \text{ML\_Probability} \times 100\right) + \left(\text{Weight}_{\text{Rule}} \times \text{Rule\_Score}\right)$$

---

## 📄 License
MIT License. Built for predictive software reliability engineering.
