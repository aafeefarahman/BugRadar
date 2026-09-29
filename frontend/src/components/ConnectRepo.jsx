import React, { useState } from 'react';
import { 
  Radar, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Info, 
  ExternalLink, 
  Zap, 
  Layers, 
  Clock 
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { analyzeRepository } from '../api';

const POPULAR_REPOS = [
  { label: "Flask (Python)", url: "https://github.com/pallets/flask", commits: 150 },
  { label: "FastAPI (Python)", url: "https://github.com/fastapi/fastapi", commits: 100 },
  { label: "Express.js (Node)", url: "https://github.com/expressjs/express", commits: 150 },
  { label: "Zod (TypeScript)", url: "https://github.com/colinhacks/zod", commits: 120 }
];

export default function ConnectRepo({ 
  onAnalysisComplete, 
  darkMode 
}) {
  const [repoUrl, setRepoUrl] = useState('');
  const [maxCommits, setMaxCommits] = useState(150);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanningPhase, setScanningPhase] = useState('Initializing Scanner...');

  const handleScan = async (e, customUrl = null, useSample = false) => {
    if (e) e.preventDefault();
    const targetUrl = customUrl || repoUrl;
    
    if (!targetUrl && !useSample) {
      setError("Please provide a valid GitHub repository URL or choose a sample.");
      return;
    }

    setError(null);
    setLoading(true);

    const phases = [
      "Connecting to GitHub API...",
      "Fetching commit tree & history...",
      "Parsing commit messages with regex heuristic...",
      "Extracting cyclomatic complexity & code churn...",
      "Training Random Forest classifier...",
      "Generating actionable remediation steps...",
      "Calculating blended risk scores..."
    ];
    let phaseIdx = 0;
    const interval = setInterval(() => {
      phaseIdx = (phaseIdx + 1) % phases.length;
      setScanningPhase(phases[phaseIdx]);
    }, 900);

    try {
      const result = await analyzeRepository(
        targetUrl, 
        null, 
        useSample, 
        maxCommits
      );
      
      clearInterval(interval);
      onAnalysisComplete(result);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || "Failed to analyze repository. Verify public accessibility.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Radar className="w-3.5 h-3.5" />
          <span>Automated Repository Audit</span>
        </div>
        <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Connect GitHub Repository
        </h1>
        <p className={`text-sm sm:text-base mt-2 max-w-xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Paste any public GitHub repository URL to trigger commit mining, feature aggregation, ML risk scoring, and actionable remediation steps.
        </p>
      </div>

      {/* Main Scan Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200 shadow-md'
      }`}>
        {loading ? (
          /* Radar Loading Animation State */
          <div className="py-16 text-center space-y-6">
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-indigo-500/40 animate-pulse" />
              <div className="absolute inset-6 rounded-full border border-purple-500/30" />
              
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-cyan-500/20 to-cyan-400/40 radar-sweep-animation" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }} />
              
              <Radar className="w-12 h-12 text-cyan-400 relative z-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">
                {scanningPhase}
              </h3>
              <p className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Inspecting up to {maxCommits} commits • Computing churn & branching metrics
              </p>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={(e) => handleScan(e)} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm flex items-start gap-3 leading-relaxed">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-1">
                  <div className="font-bold">Analysis Error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Repo URL Input */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                GitHub Repository URL
              </label>
              <div className="relative">
                <GithubIcon className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/facebook/react or pallets/flask"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border text-sm sm:text-base font-mono focus:outline-none focus:ring-2 transition-all ${
                    darkMode
                      ? 'bg-gray-950 border-gray-800 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-600'
                      : 'bg-gray-50 border-gray-300 focus:border-cyan-600 focus:ring-cyan-600/20 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Quick Pick Samples */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Quick Select Popular Repositories:</span>
                <span className="text-[11px] text-cyan-500 font-mono">Public Repositories</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_REPOS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setRepoUrl(sample.url);
                      setMaxCommits(sample.commits);
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium text-left truncate transition-all ${
                      repoUrl === sample.url
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500 font-semibold'
                        : darkMode 
                          ? 'border-gray-800 bg-gray-950/60 text-gray-300 hover:bg-gray-800' 
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Commit Depth Slider */}
            <div className={`flex items-center justify-between gap-4 p-3.5 rounded-2xl border ${
              darkMode ? 'border-gray-800/80 bg-gray-950/40' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Commit History Depth:</span>
              </div>
              <div className="flex items-center gap-3">
                {[50, 100, 150, 200].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMaxCommits(count)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                      maxCommits === count
                        ? 'bg-indigo-600 text-white shadow'
                        : darkMode 
                          ? 'text-gray-400 hover:text-gray-200 bg-gray-800/50' 
                          : 'text-gray-600 hover:text-gray-900 bg-gray-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <Radar className="w-5 h-5" />
                <span>Run AI Bug Prediction</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleScan(e, null, true)}
                className={`px-5 py-4 rounded-2xl border font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  darkMode ? 'bg-gray-950 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
                title="Instant Offline / Rate-Limit Free Demo Analysis"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Instant Demo Run</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Caching Notice */}
      <div className={`mt-6 flex items-center justify-center gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <Clock className="w-3.5 h-3.5 text-cyan-500" />
        <span>Scans are automatically cached for 1 hour to prevent redundant API calls and rate limits.</span>
      </div>
    </div>
  );
}
