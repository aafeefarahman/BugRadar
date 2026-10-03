# 🛡️ BugRadar — Predictive Software Defect Radar & Risk Intelligence

BugRadar is an open-source, full-stack predictive software quality platform. It mines Git repositories, extracts code churn and cyclomatic complexity proxies, applies temporal splits to reduce lookahead bias, trains balanced multi-model machine learning ensembles, and delivers Gemini AI-powered actionable remediation guidance.

-
        C --> D1[Code Churn: Additions + Deletions]
        C --> D2[Cyclomatic Complexity Proxy: Control-Flow Density]
        C --> D3[Author Dispersion & Developer Turnover]
        C --> D4[Touch Frequency & Recency]
    end

    subgraph Label Extraction [Future 30% Window]
        C --> E1[Weak Supervision Regex: fix|bug|patch|defect]
        E1 --> E2[Ground Truth Defect Labels y in 0, 1]
    end

    Feature Extraction & Label Extraction --> F[Balanced ML Ensemble Training]
    
    subgraph ML Rigor & Validation
        F --> G1[Random Forest Classifier]
        F --> G2[Logistic Regression Pipeline]
        F --> G3[Gradient Boosting Classifier]
        F --> G4[Naive Churn-Only Baseline]
        G1 & G2 & G3 & G4 --> H[Stratified 5-Fold Out-of-Fold Cross Validation]
        H --> I[ROC Curves, PR Curves & Confusion Matrix]
    end

    F --> J[Adaptive Bayesian Risk Blender]
    J --> K[Interactive Live Radar, Treemap & Scatter Chart]
    J --> L[Google Gemini AI Code Remediation Engine]
    J --> M[Public Read-Only Shareable Reports & Status Badges]
```

---

## 🚀 Key Features

1. **Machine Learning Rigor (Reduced Lookahead Bias)**
   - **Temporal Split (70/30)**: Features are computed exclusively from the oldest 70% of commits, and defect labels are derived from the newest 30% window to reduce lookahead bias.
   - **Ensemble Benchmarking**: Random Forest, Logistic Regression, Gradient Boosting, and a Naive Churn baseline.
   - **Honest Out-of-Fold Evaluation**: Precision, Recall, F1, ROC-AUC, and Confusion Matrix ($TN/FP/FN/TP$) calculated from out-of-fold predictions.
   - **Small-Sample Safeguard**: Warns and gracefully falls back when positive defect labels are fewer than 10.

2. **Visual Analytics with Recharts**
   - **Scatter Plot**: Churn ($X$) vs. Complexity ($Y$) with dot color = risk tier and dot size = LOC. Click opens the file detail drawer.
   - **File Detail Drawer**: Radar chart normalizing churn, bug ratio, complexity, authors, and recency ($0 \rightarrow 1$), paired with Gemini AI refactoring bullets.
   - **Risk Treemap & Heatmap**: Zoomable, color-coded source directory treemap.
   - **Bug-Fix Commit Timeline**: Weekly bug-fix frequency with a vertical marker at the 70/30 split.
   - **Risk by Folder**: Horizontal bar chart of average risk per top-level module.
   - **Histogram & Donut Charts**: Risk distribution and tier proportions.

3. **Public Sharing & Developer Integrations**
   - **Shareable Public Reports**: Generate read-only report URLs with short IDs (`/report/:id`) for sharing with teammates.
   - **Dynamic Status Badges**: Embed SVG status badges (`GET /badge/{owner}/{repo}.svg`) directly into your GitHub README.
   - **Instant Demo Mode**: Offline realistic repository sample simulation for zero-latency testing.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy, Uvicorn, Httpx.
- **Machine Learning**: `scikit-learn` (`RandomForestClassifier`, `LogisticRegression`, `GradientBoostingClassifier`), NumPy, Pandas.
- **AI Remediation**: Google Gemini AI (`google-generativeai`).
- **Database**: SQLite (default for local development), PostgreSQL via `DATABASE_URL` for production.

---

## ⚙️ Environment Variables

Create a `backend/.env` file (refer to `backend/.env.example`):

```bash
# GitHub Personal Access Token (Raises API rate limits from 60 to 5,000 req/hr)
GITHUB_TOKEN=your_github_token_here

# Google Gemini API Key (For automated AI code fix remediation)
GEMINI_API_KEY=your_gemini_api_key_here

# Database Connection (Default SQLite for local dev, PostgreSQL for production)
DATABASE_URL=sqlite:///./bugradar.db

# JWT Secret Key
SECRET_KEY=your_random_secret_key_here
```

---

## 💻 Local Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Automated Pytest Suite

```bash
pytest backend/tests
```

---

## 🔍 Methodology & Limitations

1. **Temporal Splitting vs. Random K-Fold**: Codebases evolve chronologically. Standard random $K$-fold cross-validation introduces lookahead bias by using future commits to predict past bugs. BugRadar strictly uses temporal cutoff boundaries.
2. **Class Imbalance**: Bug-prone modules are a natural minority in mature repositories. BugRadar mitigates majority-class collapse using inverse class-frequency sample weights.
3. **Small-Sample Caveat**: For repositories with fewer than 30 total commits or fewer than 2 positive defect touches, statistical cross-validation folds exhibit high variance. BugRadar dynamically shifts weight to its Bayesian domain heuristic and displays an explicit `"Too few defect labels for reliable evaluation"` indicator.
