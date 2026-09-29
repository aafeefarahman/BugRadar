import React, { useState, useMemo } from 'react';
import { 
  Radar, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  Sparkles, 
  GitCommit, 
  Flame, 
  Cpu, 
  FileCode2, 
  Clock, 
  Users, 
  Check, 
  Layers,
  BarChart2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import TreemapHeatmap from './TreemapHeatmap';
import { analyzeRepository } from '../api';

function RemediationBullets({ text, darkMode }) {
  if (!text) return null;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const hasBullets = lines.some(l => 
    l.startsWith('-') || 
    l.startsWith('*') || 
    l.toLowerCase().includes('what to do:') || 
    l.toLowerCase().includes('what to replace:') || 
    l.toLowerCase().includes('why:')
  );

  if (hasBullets) {
    return (
      <div className="space-y-1.5 text-xs font-sans">
        {lines.map((line, idx) => {
          const clean = line.replace(/^[-*•]\s*/, '').trim();
          let label = '';
          let rest = clean;
          
          if (clean.toLowerCase().startsWith('what to do:')) {
            label = 'What to do:';
            rest = clean.slice(11).trim();
          } else if (clean.toLowerCase().startsWith('what to replace:')) {
            label = 'What to replace:';
            rest = clean.slice(16).trim();
          } else if (clean.toLowerCase().startsWith('why:')) {
            label = 'Why:';
            rest = clean.slice(4).trim();
          }

          return (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <div className={darkMode ? 'text-gray-300' : 'text-gray-800'}>
                {label && (
                  <strong className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    {label}{' '}
                  </strong>
                )}
                <span>{rest}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <p className={`text-xs sm:text-sm leading-relaxed font-sans ${
      darkMode ? 'text-gray-300' : 'text-gray-800'
    }`}>
      {text}
    </p>
  );
}

export default function Dashboard({ analysisData, onAnalysisComplete, onNewScan, darkMode }) {
  const [repoInputUrl, setRepoInputUrl] = useState('https://github.com/deltaCS99/mern-ecommerce');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanningPhase, setScanningPhase] = useState('Initializing Scanner...');

  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  const [sortField, setSortField] = useState('risk_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedFile, setExpandedFile] = useState(null);
  const [selectedHeatmapFile, setSelectedHeatmapFile] = useState(null);

  const files = analysisData?.files || [];

  // Filter and sort files unconditionally
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesSearch = file.file_path.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRisk = riskFilter === 'ALL' || file.risk_level === riskFilter;
        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [files, searchQuery, riskFilter, sortField, sortOrder]);

  const handleDirectScan = async (e, customUrl = null, useSample = false) => {
    if (e) e.preventDefault();
    const targetUrl = customUrl || repoInputUrl;
    
    if (!targetUrl && !useSample) {
      setError("Please enter a valid GitHub repository URL.");
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
      const result = await analyzeRepository(targetUrl, null, useSample, 150);
      clearInterval(interval);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      clearInterval(interval);
      setError(err.message || "Failed to analyze repository. Verify public accessibility.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleExpand = (filePath) => {
    setExpandedFile(expandedFile === filePath ? null : filePath);
    setSelectedHeatmapFile(filePath);
  };

  const exportJSON = () => {
    if (!analysisData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bugradar_${(analysisData.repo_name || 'repo').replace('/', '_')}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCSV = () => {
    if (!analysisData) return;
    const headers = ["File Path", "Risk Score (%)", "Risk Level", "ML Prob", "Rule Score", "Bug Commits", "Total Commits", "Bug Ratio", "Avg Churn", "Authors", "Days Since Mod", "Complexity", "Top Reasons"];
    const rows = files.map(f => [
      `"${f.file_path}"`,
      f.risk_score,
      f.risk_level,
      f.ml_probability,
      f.rule_score,
      f.bug_fix_commits,
      f.total_commits,
      f.bug_ratio,
      f.lines_churn_avg,
      f.unique_authors,
      f.days_since_modified,
      f.complexity_proxy,
      `"${f.top_reasons.join('; ')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `bugradar_${(analysisData.repo_name || 'repo').replace('/', '_')}_risks.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // If no analysis is loaded yet, show the Live Radar pre-filled scanner interface
  if (!analysisData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Radar className="w-3.5 h-3.5" />
            <span>Live Radar Active</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Live Radar Codebase Intelligence
          </h1>
          <p className={`text-sm sm:text-base mt-2 max-w-xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Scan and inspect code failure risks across your repository. Ready to analyze.
          </p>
        </div>

        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {loading ? (
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
                  Inspecting commits • Computing churn & complexity metrics
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => handleDirectScan(e)} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <div className="font-bold">Scan Error</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Target GitHub Repository URL
                </label>
                <div className="relative">
                  <GithubIcon className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={repoInputUrl}
                    onChange={(e) => setRepoInputUrl(e.target.value)}
                    placeholder="https://github.com/facebook/react or pallets/flask"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border text-sm sm:text-base font-mono focus:outline-none focus:ring-2 transition-all ${
                      darkMode
                        ? 'bg-gray-950 border-gray-800 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder:text-gray-600'
                        : 'bg-gray-50 border-gray-300 focus:border-cyan-600 focus:ring-cyan-600/20 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>
              </div>

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
                  onClick={(e) => handleDirectScan(e, null, true)}
                  className={`px-5 py-4 rounded-2xl border font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                    darkMode ? 'bg-gray-950 border-gray-800 text-gray-300 hover:bg-gray-800' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Instant Demo Run</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const { repo_name, repo_url, summary, model_metadata, is_cached, cached_at } = analysisData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Live Radar Quick URL Bar (Pre-filled with deltaCS99/mern-ecommerce) */}
      <div className={`p-4 rounded-2xl border shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="relative flex-1 w-full">
          <GithubIcon className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={repoInputUrl}
            onChange={(e) => setRepoInputUrl(e.target.value)}
            placeholder="https://github.com/deltaCS99/mern-ecommerce"
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 ${
              darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <button
          onClick={(e) => handleDirectScan(e)}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-cyan-500/20"
        >
          <Radar className="w-3.5 h-3.5" />
          <span>{loading ? "Scanning..." : "Re-Scan Repo"}</span>
        </button>
      </div>

      {/* Top Header Card */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5" />
              Live Radar Active
            </span>
            {is_cached && (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Cached Result ({cached_at || '1-hr TTL'})
              </span>
            )}
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mt-2 flex items-center gap-2 flex-wrap ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <span>{repo_name}</span>
            <a
              href={repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 transition-colors"
              title="View on GitHub"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Analyzed {summary.total_commits} commits • Identified {summary.bug_fixing_commits} bug-fix touches across {summary.total_files} active source files.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onNewScan}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>

          <button
            onClick={exportCSV}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
            }`}
            title="Export CSV Risk Report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportJSON}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
            }`}
            title="Export Raw JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Files */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Files</span>
            <FileCode2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{summary.total_files}</div>
          <div className={`text-[11px] mt-1 font-mono ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Source code files</div>
        </div>

        {/* High Risk Files */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-gray-900/80 border-red-900/40' : 'bg-red-50/70 border-red-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-bold">High Risk (&gt;65%)</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-500">{summary.high_risk_count}</div>
          <div className="text-[11px] text-red-500/80 mt-1 font-mono">Immediate review targets</div>
        </div>

        {/* Medium Risk */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-gray-900/80 border-amber-900/40' : 'bg-amber-50/70 border-amber-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold">Medium (35-65%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">{summary.medium_risk_count}</div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-mono">Watch for regression</div>
        </div>

        {/* Low Risk */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-gray-900/80 border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold">Low (&lt;35%)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">{summary.low_risk_count}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-mono">Stable code files</div>
        </div>

        {/* Average Risk */}
        <div className={`col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Risk</span>
            <BarChart2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
            {summary.avg_risk_score}%
          </div>
          <div className={`text-[11px] mt-1 font-mono ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Codebase probability</div>
        </div>
      </div>

      {/* Model Blending Intelligence Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
        darkMode ? 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-500 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className={`font-bold text-sm ${darkMode ? 'text-indigo-200' : 'text-indigo-950'}`}>
              {model_metadata.algorithm}
            </div>
            <div className={`mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {model_metadata.notes}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Remediation Section */}
      {files.some(f => f.fix_suggestion) && (
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-xl transition-all space-y-4 ${
          darkMode 
            ? 'bg-gradient-to-br from-purple-950/30 via-indigo-950/20 to-gray-900/90 border-purple-500/30' 
            : 'bg-gradient-to-br from-purple-50/70 via-indigo-50/50 to-white border-purple-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500">
                  Actionable Remediation
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Automated fix recommendations for highest-risk code files
                </p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-mono ${
              darkMode ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300' : 'bg-purple-100 border border-purple-200 text-purple-800 font-semibold'
            }`}>
              {files.filter(f => f.fix_suggestion).length} files analyzed
            </span>
          </div>

          {/* Scrollable Card Grid Container */}
          <div 
            className="max-h-[640px] overflow-y-auto pr-1.5"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#a855f7 transparent' : '#c084fc transparent'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.filter(f => f.fix_suggestion).map((f) => (
                <div 
                  key={f.file_path}
                  onClick={() => {
                    setExpandedFile(f.file_path);
                    setSelectedHeatmapFile(f.file_path);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 flex flex-col justify-between ${
                    darkMode 
                      ? 'bg-gray-950/60 border-gray-800 hover:bg-gray-900/80 hover:border-purple-500/60' 
                      : 'bg-white border-gray-200 hover:bg-purple-50/30 hover:border-purple-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-gray-800/40">
                      <span className={`font-mono text-xs font-bold truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`} title={f.file_path}>
                        {f.file_path}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                        {f.risk_score}%
                      </span>
                    </div>
                    
                    {/* Formatted Bullets */}
                    <RemediationBullets text={f.fix_suggestion} darkMode={darkMode} />
                  </div>

                  <div className={`text-[11px] font-semibold pt-1 flex items-center gap-1 ${
                    darkMode ? 'text-purple-400' : 'text-purple-700'
                  }`}>
                    <span>View file breakdown</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Heatmap / Treemap Visualizer */}
      <TreemapHeatmap
        files={files}
        onSelectFile={(filePath) => {
          setSelectedHeatmapFile(filePath);
          setExpandedFile(filePath);
        }}
        selectedFilePath={selectedHeatmapFile || expandedFile}
        darkMode={darkMode}
      />

      {/* File Risk Scoring Table */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden transition-all ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200 shadow-md'
      }`}>
        {/* Table Controls */}
        <div className={`p-5 border-b flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Predictive Risk Rankings</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {filteredFiles.length} files
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file path..."
                className={`w-full sm:w-60 pl-9 pr-3.5 py-1.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 ${
                  darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>

            {/* Risk Filter Buttons */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
              darkMode ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-100 border-gray-200'
            }`}>
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    riskFilter === lvl
                      ? lvl === 'HIGH' ? 'bg-red-600 text-white' :
                        lvl === 'MEDIUM' ? 'bg-amber-600 text-white' :
                        lvl === 'LOW' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className={`border-b uppercase tracking-wider text-[11px] ${
                darkMode ? 'bg-gray-950/60 border-gray-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <th className="py-3 px-4 w-8"></th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => handleSort('file_path')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>File Path</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => handleSort('risk_score')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Bug Risk</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors hidden sm:table-cell"
                  onClick={() => handleSort('bug_fix_commits')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Bug Fixes</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors hidden md:table-cell"
                  onClick={() => handleSort('lines_churn_avg')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Avg Churn</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('complexity_proxy')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Complexity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition-colors hidden lg:table-cell"
                  onClick={() => handleSort('days_since_modified')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Modified</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Contributing Reasons</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-800/60' : 'divide-gray-200'}`}>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No files matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const isExpanded = expandedFile === file.file_path;
                  const isHigh = file.risk_level === 'HIGH';
                  const isMed = file.risk_level === 'MEDIUM';

                  return (
                    <React.Fragment key={file.file_path}>
                      <tr 
                        onClick={() => toggleExpand(file.file_path)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? darkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                            : darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-500">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
                        </td>

                        {/* File Path */}
                        <td className="py-3 px-4 font-semibold">
                          <div className="flex items-center gap-2 max-w-xs sm:max-w-md truncate">
                            <span className={`truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{file.file_path}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {file.file_type || 'file'}
                            </span>
                            {file.fix_suggestion && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1 font-semibold">
                                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                AI Fix
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Risk Score */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-800/30 rounded-full h-2 overflow-hidden border border-gray-700/20">
                              <div 
                                className={`h-full rounded-full ${
                                  isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${file.risk_score}%` }}
                              />
                            </div>
                            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              isHigh ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              isMed ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            }`}>
                              {file.risk_score}%
                            </span>
                          </div>
                        </td>

                        {/* Bug Commits */}
                        <td className={`py-3 px-4 hidden sm:table-cell ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className={file.bug_fix_commits > 0 ? "text-orange-500 font-bold" : "text-gray-400"}>
                            {file.bug_fix_commits}
                          </span>
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}> / {file.total_commits}</span>
                        </td>

                        {/* Churn */}
                        <td className={`py-3 px-4 hidden md:table-cell ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {file.lines_churn_avg} lines
                        </td>

                        {/* Complexity */}
                        <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {file.complexity_proxy}
                        </td>

                        {/* Last Modified */}
                        <td className={`py-3 px-4 hidden lg:table-cell ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {file.days_since_modified === 0 ? "Today" : `${file.days_since_modified}d ago`}
                        </td>

                        {/* Primary Reason Badge */}
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-block max-w-[220px] truncate text-[11px] px-2 py-1 rounded ${
                            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {file.top_reasons[0] || "Stable revision pattern"}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable "Why" Drawer */}
                      {isExpanded && (
                        <tr className={darkMode ? 'bg-gray-950/80' : 'bg-gray-50'}>
                          <td colSpan={8} className={`p-4 sm:p-6 border-y ${darkMode ? 'border-cyan-500/20' : 'border-cyan-200'}`}>
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-cyan-400" />
                                  <h4 className={`font-bold text-sm ${darkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                    Contributing Factor Breakdown: {file.file_path}
                                  </h4>
                                </div>
                                <div className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  ML Prob: <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(file.ml_probability * 100)}%</span> | 
                                  Rule Score: <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{file.rule_score}%</span>
                                </div>
                              </div>

                              {/* Actionable Remediation Box */}
                              {file.fix_suggestion && (
                                <div className={`p-4 rounded-2xl border shadow-md space-y-2.5 ${
                                  darkMode 
                                    ? 'bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-cyan-950/30 border-purple-500/30' 
                                    : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-cyan-50 border-purple-200 shadow-sm'
                                }`}>
                                  <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${
                                    darkMode ? 'text-purple-400' : 'text-purple-700'
                                  }`}>
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span>Actionable Remediation Recommendation</span>
                                  </div>
                                  
                                  {/* Formatted Bullets */}
                                  <RemediationBullets text={file.fix_suggestion} darkMode={darkMode} />
                                </div>
                              )}

                              {/* Top Reasons Badges */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {file.top_reasons.map((reason, idx) => (
                                  <div 
                                    key={idx}
                                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                      darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-800'
                                    }`}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span>{reason}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Deep Metrics Matrix */}
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
                                <div className={`p-3 rounded-xl border ${
                                  darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                                }`}>
                                  <div className="text-gray-500 text-[10px]">BUG COMMIT RATIO</div>
                                  <div className={`font-bold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {Math.round(file.bug_ratio * 100)}%
                                  </div>
                                </div>
                                <div className={`p-3 rounded-xl border ${
                                  darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                                }`}>
                                  <div className="text-gray-500 text-[10px]">AVG CHURN / COMMIT</div>
                                  <div className={`font-bold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {file.lines_churn_avg} lines
                                  </div>
                                </div>
                                <div className={`p-3 rounded-xl border ${
                                  darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                                }`}>
                                  <div className="text-gray-500 text-[10px]">CONTRIBUTOR COUNT</div>
                                  <div className={`font-bold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {file.unique_authors} devs
                                  </div>
                                </div>
                                <div className={`p-3 rounded-xl border ${
                                  darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                                }`}>
                                  <div className="text-gray-500 text-[10px]">CYCLOMATIC PROXY</div>
                                  <div className={`font-bold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {file.complexity_proxy}
                                  </div>
                                </div>
                                <div className={`p-3 rounded-xl border ${
                                  darkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                                }`}>
                                  <div className="text-gray-500 text-[10px]">ESTIMATED LOC</div>
                                  <div className={`font-bold text-sm mt-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {file.lines_of_code} LOC
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
