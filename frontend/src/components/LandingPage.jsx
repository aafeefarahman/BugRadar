import React from 'react';
import { 
  Radar, 
  Sparkles, 
  Cpu, 
  Activity, 
  BarChart2, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Share2
} from 'lucide-react';

export default function LandingPage({ onStartScan, onInstantDemo, darkMode }) {
  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 text-center space-y-8">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <span>Next-Gen Machine Learning Defect Radar</span>
        </div>

        <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Predict Software Bugs{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
            Before Production.
          </span>
        </h1>

        <p className={`text-base sm:text-xl max-w-2xl mx-auto leading-relaxed ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          BugRadar mines git commits, extracts churn & control-flow complexity, runs out-of-fold ML classifiers on a temporal split, and delivers AI-guided code fixes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onStartScan}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <Radar className="w-5 h-5" />
            <span>Scan a Repository</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onInstantDemo}
            className={`w-full sm:w-auto px-7 py-4 rounded-2xl border font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
              darkMode 
                ? 'bg-gray-900/90 border-gray-800 text-gray-200 hover:bg-gray-800' 
                : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100 shadow-sm'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Instant Demo Run</span>
          </button>
        </div>

        {/* Quick Highlights Row */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            No account or credit card needed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Reduced lookahead bias (70/30 split)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            Out-of-fold ROC/PR evaluation
          </span>
        </div>
      </div>

      {/* Live Preview / Stats Card */}
      <div className="max-w-6xl mx-auto px-4">
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-[11px] font-bold uppercase text-gray-500">Classification Models</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">4 Ensembles</div>
              <div className="text-[11px] text-gray-500 mt-0.5">RF, LR, GB & Churn Baseline</div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-[11px] font-bold uppercase text-gray-500">Evaluation Rigor</div>
              <div className="text-2xl font-black text-purple-400 mt-1">5-Fold OOF</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Stratified cross-validation</div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-[11px] font-bold uppercase text-gray-500">AI Remediation</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">Gemini AI</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Automated code fix bullets</div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-[11px] font-bold uppercase text-gray-500">Public Audit Badge</div>
              <div className="text-2xl font-black text-amber-400 mt-1">SVG Badges</div>
              <div className="text-[11px] text-gray-500 mt-0.5">GitHub README integration</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step "How It Works" Pipeline */}
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Under The Hood</div>
          <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How BugRadar Predicts Defect Hotspots
          </h2>
          <p className={`text-xs sm:text-sm max-w-xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            A 3-step pipeline that mines commit history, trains and evaluates models on out-of-fold data, and explains every prediction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-4 ${
            darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black text-lg">
                01
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Temporal Git Mining
              </h3>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                BugRadar splits commit history into a 70% historical window and a 30% future window. Features (churn, complexity, recency, author dispersion) are computed only from the historical window, and bug-fix commits in the future window provide the labels. This reduces lookahead bias.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono text-cyan-400 flex items-center gap-1">
              <span>Reduced lookahead bias</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-4 ${
            darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-lg">
                02
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Balanced ML Ensembling
              </h3>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Trains Random Forest, Logistic Regression, and Gradient Boosting with class balancing. Models are evaluated with out-of-fold cross-validation and compared against a naive churn baseline.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono text-purple-400 flex items-center gap-1">
              <span>Out-of-fold ROC & PR curves</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-4 ${
            darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-lg">
                03
              </div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Explainability & Remediation
              </h3>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Shows the top feature-importance-weighted drivers for each file, renders an interactive risk treemap, and generates Gemini-powered refactoring advice with concrete steps for the riskiest files.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span>Actionable fix guidance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">Complete Toolkit</div>
          <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Built for Developers & Engineering Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-3xl border space-y-3 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Scatter Plot & Treemaps</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Explore churn vs. complexity across your codebase with interactive zoomable treemaps and scatter clusters.
            </p>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Multi-Model Ensembles</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Benchmark Random Forest, Logistic Regression, and Gradient Boosting against naive churn-based baselines.
            </p>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Out-of-Fold Model Rigor</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              View out-of-fold ROC curves, precision-recall curves, confusion matrix heatmaps, and CV statistics.
            </p>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Gemini AI Fix Remediation</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Receive structured, file-specific code refactoring instructions with clear what-to-do bullets.
            </p>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Shareable Public Reports</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Generate read-only report URLs with short IDs to share defect insights with teammates and stakeholders.
            </p>
          </div>

          <div className={`p-6 rounded-3xl border space-y-3 ${darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Dynamic README Badges</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Embed dynamic SVG status badges in your repository README to signal ongoing code health and defect risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
