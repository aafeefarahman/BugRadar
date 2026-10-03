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
  CheckCircle2,
  FolderGit2,
  Activity,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar
} from 'recharts';
import GithubIcon from './GithubIcon';
import TreemapHeatmap from './TreemapHeatmap';
import { analyzeRepository, formatErrorDetail, createSharedReport } from '../api';

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

function ChartSkeleton({ height = 260, darkMode }) {
  return (
    <div 
      style={{ height }} 
      className={`w-full rounded-2xl animate-pulse flex flex-col justify-end p-4 gap-2 ${
        darkMode ? 'bg-gray-800/30 border border-gray-800' : 'bg-gray-100 border border-gray-200'
      }`}
    >
      <div className="flex items-end gap-2 h-full w-full opacity-50">
        <div className="w-1/5 bg-gray-700/50 rounded-t h-2/5" />
        <div className="w-1/5 bg-gray-700/50 rounded-t h-4/5" />
        <div className="w-1/5 bg-gray-700/50 rounded-t h-3/5" />
        <div className="w-1/5 bg-gray-700/50 rounded-t h-5/6" />
        <div className="w-1/5 bg-gray-700/50 rounded-t h-1/2" />
      </div>
      <div className={`h-2.5 w-1/3 rounded ${darkMode ? 'bg-gray-700/60' : 'bg-gray-300'}`} />
    </div>
  );
}

export default function Dashboard({ analysisData, onAnalysisComplete, onNewScan, onViewModelPerformance, darkMode, showToast }) {
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

  // Max metrics for normalization in Radar charts
  const maxMetrics = useMemo(() => {
    if (!files.length) return { churn: 100, complexity: 30, authors: 5 };
    return {
      churn: Math.max(...files.map(f => f.lines_churn_avg || 1), 60),
      complexity: Math.max(...files.map(f => f.complexity_proxy || 1), 20),
      authors: Math.max(...files.map(f => f.unique_authors || 1), 4)
    };
  }, [files]);

  // 1. Risk Distribution Histogram Data (with threshold markers)
  const histogramData = useMemo(() => {
    const bins = [
      { range: '0-19%', label: '0-19%', count: 0, tier: 'LOW', fill: '#10b981' },
      { range: '20-34%', label: '20-34%', count: 0, tier: 'LOW', fill: '#10b981' },
      { range: '35-49%', label: '35-49%', count: 0, tier: 'MEDIUM', fill: '#f59e0b' },
      { range: '50-64%', label: '50-64%', count: 0, tier: 'MEDIUM', fill: '#f59e0b' },
      { range: '65-79%', label: '65-79%', count: 0, tier: 'HIGH', fill: '#ef4444' },
      { range: '80-100%', label: '80-100%', count: 0, tier: 'HIGH', fill: '#dc2626' }
    ];
    files.forEach(f => {
      const s = f.risk_score;
      if (s < 20) bins[0].count++;
      else if (s < 35) bins[1].count++;
      else if (s < 50) bins[2].count++;
      else if (s < 65) bins[3].count++;
      else if (s < 80) bins[4].count++;
      else bins[5].count++;
    });
    return bins;
  }, [files]);

  // 2. Risk Tier Donut Chart Data
  const donutData = useMemo(() => {
    const high = files.filter(f => f.risk_level === 'HIGH').length;
    const med = files.filter(f => f.risk_level === 'MEDIUM').length;
    const low = files.filter(f => f.risk_level === 'LOW').length;
    return [
      { name: 'High (≥65%)', value: high, color: '#ef4444' },
      { name: 'Medium (35-64%)', value: med, color: '#f59e0b' },
      { name: 'Low (<35%)', value: low, color: '#10b981' }
    ];
  }, [files]);

  // 3. Risk by Top-Level Folder
  const folderRiskData = useMemo(() => {
    const map = {};
    files.forEach(f => {
      const parts = f.file_path.split('/');
      let folder = parts.length > 1 ? parts[0] : 'root';
      if (parts.length > 2 && (folder === 'src' || folder === 'backend' || folder === 'frontend' || folder === 'app')) {
        folder = `${parts[0]}/${parts[1]}`;
      }
      if (!map[folder]) {
        map[folder] = { folder, totalRisk: 0, count: 0 };
      }
      map[folder].totalRisk += f.risk_score;
      map[folder].count++;
    });
    return Object.values(map)
      .map(d => ({
        folder: d.folder,
        avgRisk: Math.round(d.totalRisk / d.count),
        fileCount: d.count
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 7);
  }, [files]);

  // 4. Scatter Plot Data: Churn (x) vs Complexity (y)
  const scatterData = useMemo(() => {
    return files.map(f => ({
      file_path: f.file_path,
      churn: f.lines_churn_avg,
      complexity: f.complexity_proxy,
      loc: Math.max(20, f.lines_of_code),
      risk_score: f.risk_score,
      risk_level: f.risk_level,
      fill: f.risk_level === 'HIGH' ? '#ef4444' : f.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981'
    }));
  }, [files]);

  // 5. Bug-Fix Commit Timeline Data with 70/30 split line
  const timelineData = useMemo(() => {
    if (analysisData?.commit_timeline && analysisData.commit_timeline.length > 0) {
      return analysisData.commit_timeline;
    }
    return [
      { label: 'W-6', total_commits: 12, bug_fixes: 2, is_training_window: true },
      { label: 'W-5', total_commits: 18, bug_fixes: 4, is_training_window: true },
      { label: 'W-4', total_commits: 15, bug_fixes: 3, is_training_window: true },
      { label: 'W-3', total_commits: 22, bug_fixes: 6, is_training_window: true },
      { label: 'W-2', total_commits: 14, bug_fixes: 5, is_training_window: false },
      { label: 'W-1', total_commits: 19, bug_fixes: 7, is_training_window: false }
    ];
  }, [analysisData]);

  const splitMarkerLabel = useMemo(() => {
    const transitionIndex = timelineData.findIndex(t => !t.is_training_window);
    if (transitionIndex > 0) {
      return timelineData[transitionIndex].label;
    }
    return timelineData[Math.floor(timelineData.length * 0.7)]?.label || '';
  }, [timelineData]);

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
      "Applying 70/30 temporal split...",
      "Extracting cyclomatic complexity & code churn...",
      "Training Random Forest & multi-model classifiers...",
      "Generating out-of-fold ROC & PR curves...",
      "Calculating blended risk scores..."
    ];
    let phaseIdx = 0;
    const interval = setInterval(() => {
      phaseIdx = (phaseIdx + 1) % phases.length;
      setScanningPhase(phases[phaseIdx]);
    }, 900);

    try {
      const data = await analyzeRepository({
        repo_url: targetUrl,
        use_sample: useSample
      });
      clearInterval(interval);
      setLoading(false);
      onAnalysisComplete(data);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      const errString = formatErrorDetail(err?.detail || err?.response?.data?.detail || err?.message || err, "Failed to analyze repository.");
      setError(errString);
    }
  };

  const toggleExpand = (filePath) => {
    setExpandedFile(expandedFile === filePath ? null : filePath);
    setSelectedHeatmapFile(filePath);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
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
    if (!analysisData || !analysisData.files) return;
    const headers = ["File Path", "Risk Score", "Risk Level", "ML Prob", "Bug Commits", "Total Commits", "Bug Ratio", "Avg Churn", "Authors", "Days Since Mod", "Complexity", "Top Reasons"];
    const rows = analysisData.files.map(f => [
      `"${f.file_path}"`,
      f.risk_score,
      f.risk_level,
      f.ml_probability,
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

  // Custom Tooltip for Scatter Plot
  const ScatterCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border shadow-xl text-xs font-mono space-y-1 ${
          darkMode ? 'bg-gray-950/95 border-gray-800 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-900 shadow-md'
        }`}>
          <div className="font-bold text-cyan-400 truncate max-w-xs">{data.file_path}</div>
          <div className="flex items-center justify-between gap-4">
            <span>Risk Score:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
              data.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
              data.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {data.risk_score}% ({data.risk_level})
            </span>
          </div>
          <div className="text-gray-400 text-[11px]">Avg Churn: <span className="font-bold text-white">{data.churn} lines</span></div>
          <div className="text-gray-400 text-[11px]">Complexity: <span className="font-bold text-white">{data.complexity}</span></div>
          <div className="text-gray-400 text-[11px]">Est. LOC: <span className="font-bold text-white">{data.loc}</span></div>
          <div className="text-[10px] text-purple-400 italic pt-1 border-t border-gray-800">
            Click point to open file detail drawer
          </div>
        </div>
      );
    }
    return null;
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
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row items-start justify-between gap-3 ${
                  (typeof error === 'string' && (error.toLowerCase().includes('rate limit') || error.includes('429')))
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                      (typeof error === 'string' && (error.toLowerCase().includes('rate limit') || error.includes('429')))
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`} />
                    <div>
                      <div className="font-bold">
                        {(typeof error === 'string' && (error.toLowerCase().includes('rate limit') || error.includes('429')))
                          ? 'GitHub API Rate Limit Reached'
                          : 'Scan Error Encountered'}
                      </div>
                      <div className="mt-0.5">{typeof error === 'string' ? error : formatErrorDetail(error)}</div>
                    </div>
                  </div>
                  {(typeof error === 'string' && (error.toLowerCase().includes('rate limit') || error.includes('429'))) && (
                    <button
                      type="button"
                      onClick={() => handleDirectScan(null, null, true)}
                      className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow transition-all flex items-center gap-1.5 self-end sm:self-auto"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Try Sample Demo</span>
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <GithubIcon className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={repoInputUrl}
                    onChange={(e) => setRepoInputUrl(e.target.value)}
                    placeholder="https://github.com/deltaCS99/mern-ecommerce"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Radar className="w-4 h-4" />
                  <span>Launch Live Radar Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectScan(null, null, true)}
                  disabled={loading}
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
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1">
              <span>Data source: {analysisData.data_source || (repo_name.includes('demo') ? 'Offline Demo Sample' : 'Real Repository (GitHub API)')}</span>
            </span>
            {analysisData.rate_limit_remaining !== undefined && analysisData.rate_limit_remaining !== null && (
              <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>API Limit: {analysisData.rate_limit_remaining} / {analysisData.rate_limit_limit || 5000}</span>
              </span>
            )}
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

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <button
            onClick={async () => {
              try {
                const res = await createSharedReport(repo_name, analysisData);
                const fullUrl = `${window.location.origin}/report/${res.id}`;
                if (navigator?.clipboard?.writeText) {
                  await navigator.clipboard.writeText(fullUrl);
                }
                showToast?.(`Shareable report generated! Link copied to clipboard.`, 'success');
              } catch (err) {
                showToast?.(err.message, 'error');
              }
            }}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              darkMode ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
            title="Generate a public read-only share link"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Share Report</span>
          </button>

          {onViewModelPerformance && (
            <button
              onClick={onViewModelPerformance}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                darkMode ? 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
              title="View ML Rigor & Benchmark Matrix"
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Model Rigor</span>
            </button>
          )}

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

        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-gray-900/80 border-red-900/40' : 'bg-red-50/70 border-red-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-bold">High Risk (≥65%)</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-500">{summary.high_risk_count}</div>
          <div className="text-[11px] text-red-500/80 mt-1 font-mono">Immediate review targets</div>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-gray-900/80 border-amber-900/40' : 'bg-amber-50/70 border-amber-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold">Medium (35-64%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">{summary.medium_risk_count}</div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-mono">Watch for regression</div>
        </div>

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

      {/* NEW SECTION 1: Risk Distribution Histogram & Tier Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Histogram with Threshold Markers */}
        <div className={`lg:col-span-8 p-6 rounded-3xl border shadow-xl flex flex-col justify-between gap-4 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Risk Score Distribution Histogram
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-emerald-400">&lt;35% Low</span>
                <span>•</span>
                <span className="text-amber-400">35-64% Med</span>
                <span>•</span>
                <span className="text-red-400">≥65% High</span>
              </div>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              File population across predictive risk intervals with Low/Medium/High threshold markers.
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#e5e7eb'} vertical={false} />
                <XAxis 
                  dataKey="range" 
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                  label={{ value: 'Files', angle: -90, position: 'insideLeft', offset: 15, fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className={`p-2.5 rounded-xl border text-xs font-mono shadow-md ${
                          darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}>
                          <div className="font-bold">{d.range} Interval</div>
                          <div className="text-cyan-400">{d.count} files ({d.tier} tier)</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x="20-34%" stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "35% Threshold", fill: "#f59e0b", fontSize: 10, position: 'top' }} />
                <ReferenceLine x="50-64%" stroke="#ef4444" strokeDasharray="3 3" label={{ value: "65% High Risk", fill: "#ef4444", fontSize: 10, position: 'top' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Tier Composition Donut Chart */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border shadow-xl flex flex-col justify-between gap-4 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Layers className="w-4 h-4 text-purple-400" />
              Risk Tier Composition
            </h3>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Categorical proportion of files analyzed.
            </p>
          </div>

          <div className="w-full h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={darkMode ? '#111827' : '#fff'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0];
                      return (
                        <div className={`p-2 rounded-xl border text-xs font-mono shadow-md ${
                          darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}>
                          <div style={{ color: d.payload.color }} className="font-bold">{d.name}</div>
                          <div>{d.value} files ({Math.round((d.value / Math.max(1, files.length)) * 100)}%)</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Callout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {files.length}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Total Files
              </span>
            </div>
          </div>

          {/* Legend Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
            <div className={`p-1.5 rounded-xl border ${darkMode ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-red-50 text-red-700'}`}>
              High: <strong>{summary.high_risk_count}</strong>
            </div>
            <div className={`p-1.5 rounded-xl border ${darkMode ? 'bg-amber-950/20 border-amber-500/30 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
              Med: <strong>{summary.medium_risk_count}</strong>
            </div>
            <div className={`p-1.5 rounded-xl border ${darkMode ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
              Low: <strong>{summary.low_risk_count}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION 2: Scatter Plot (Code Churn vs Cyclomatic Complexity) */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Activity className="w-4 h-4 text-cyan-400" />
              Defect Surface Map: Code Churn vs. Cyclomatic Complexity
            </h3>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              X = Average Lines Churn • Y = Complexity Proxy • Dot Size = LOC • Dot Color = Risk Tier. Click any file to open drawer.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-red-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High</span>
            <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium</span>
            <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low</span>
          </div>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#e5e7eb'} />
              <XAxis 
                type="number" 
                dataKey="churn" 
                name="Avg Churn" 
                unit=" lines"
                tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                label={{ value: 'Average Lines Churned / Commit (x)', position: 'insideBottom', offset: -10, fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="complexity" 
                name="Complexity Proxy"
                tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                label={{ value: 'Cyclomatic Complexity (y)', angle: -90, position: 'insideLeft', offset: 15, fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="loc" range={[50, 450]} name="Lines of Code" />
              <Tooltip content={<ScatterCustomTooltip darkMode={darkMode} />} />
              <Scatter 
                data={scatterData} 
                cursor="pointer" 
                onClick={(node) => {
                  if (node && node.file_path) {
                    toggleExpand(node.file_path);
                    const el = document.getElementById('risk-table-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`scatter-cell-${index}`} 
                    fill={entry.fill} 
                    stroke={entry.fill} 
                    strokeWidth={1} 
                    fillOpacity={0.75} 
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW SECTION 3: Risk by Folder & Bug-Fix Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Average Risk by Top-Level Folder */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border shadow-xl flex flex-col justify-between gap-4 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <FolderGit2 className="w-4 h-4 text-amber-400" />
              Average Bug Risk by Folder
            </h3>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Identifies directories with elevated aggregate vulnerability density.
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={folderRiskData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#e5e7eb'} horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]} 
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                  unit="%" 
                />
                <YAxis 
                  type="category" 
                  dataKey="folder" 
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className={`p-2.5 rounded-xl border text-xs font-mono shadow-md ${
                          darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}>
                          <div className="font-bold text-amber-400">{d.folder}</div>
                          <div>Avg Risk: <strong>{d.avgRisk}%</strong></div>
                          <div className="text-gray-400">{d.fileCount} files in directory</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgRisk" radius={[0, 6, 6, 0]}>
                  {folderRiskData.map((entry, index) => (
                    <Cell 
                      key={`folder-cell-${index}`} 
                      fill={entry.avgRisk >= 65 ? '#ef4444' : entry.avgRisk >= 35 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bug-Fix Commit Timeline with 70/30 Temporal Split Line */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border shadow-xl flex flex-col justify-between gap-4 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Clock className="w-4 h-4 text-purple-400" />
                Weekly Bug-Fix History & Temporal Split
              </h3>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                70/30 Split
              </span>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Weekly commit volume and defect fixes, split into historical train & future evaluation windows.
            </p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#e5e7eb'} vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className={`p-2.5 rounded-xl border text-xs font-mono shadow-md ${
                          darkMode ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                        }`}>
                          <div className="font-bold text-cyan-300">{d.label}</div>
                          <div>Total Commits: <strong>{d.total_commits}</strong></div>
                          <div className="text-orange-400">Bug Fixes: <strong>{d.bug_fixes}</strong></div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            Window: {d.is_training_window ? 'Historical (70% Train)' : 'Future (30% Test)'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                {splitMarkerLabel && (
                  <ReferenceLine 
                    x={splitMarkerLabel} 
                    stroke="#a855f7" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ value: "70/30 Split", fill: "#c084fc", fontSize: 10, position: 'top' }} 
                  />
                )}
                <Bar dataKey="total_commits" name="Total Commits" fill="#38bdf8" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                <Bar dataKey="bug_fixes" name="Bug-Fix Touches" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
      <div id="risk-table-section" className={`rounded-3xl border shadow-xl overflow-hidden transition-all ${
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

                  // Normalized 0-1 radar data for this specific file
                  const fileRadarData = [
                    { metric: 'Churn', value: Math.min(1.0, (file.lines_churn_avg || 0) / maxMetrics.churn), raw: `${file.lines_churn_avg} lines` },
                    { metric: 'Bug Ratio', value: Math.min(1.0, file.bug_ratio || 0), raw: `${Math.round(file.bug_ratio * 100)}%` },
                    { metric: 'Complexity', value: Math.min(1.0, (file.complexity_proxy || 0) / maxMetrics.complexity), raw: `${file.complexity_proxy}` },
                    { metric: 'Authors', value: Math.min(1.0, (file.unique_authors || 0) / maxMetrics.authors), raw: `${file.unique_authors} devs` },
                    { metric: 'Recency', value: Math.max(0.1, 1.0 - (file.days_since_modified / 90.0)), raw: `${file.days_since_modified}d ago` }
                  ];

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

                      {/* Expandable "Why" Drawer with NEW Radar Chart */}
                      {isExpanded && (
                        <tr className={darkMode ? 'bg-gray-950/80' : 'bg-gray-50'}>
                          <td colSpan={8} className={`p-4 sm:p-6 border-y ${darkMode ? 'border-cyan-500/20' : 'border-cyan-200'}`}>
                            <div className="space-y-5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <h4 className={`font-bold text-sm ${darkMode ? 'text-cyan-300' : 'text-cyan-800'}`}>
                                    Contributing Factor Breakdown: {file.file_path}
                                  </h4>
                                </div>
                                <div className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  ML Prob: <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(file.ml_probability * 100)}%</span> | 
                                  Rule Score: <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{file.rule_score}%</span>
                                </div>
                              </div>

                              {/* Drawer Content Grid: Details Left, Radar Chart Right */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                {/* Left Side: Remediation & Drivers */}
                                <div className="lg:col-span-8 space-y-4">
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

                                  {/* Model Explainability Drivers */}
                                  {file.top_features && file.top_features.length > 0 && (
                                    <div className="space-y-2">
                                      <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Top Contributing ML Feature Drivers (Explainability)</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {file.top_features.map((feat, fIdx) => (
                                          <div 
                                            key={fIdx}
                                            className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1.5 ${
                                              darkMode ? 'bg-cyan-950/20 border-cyan-500/20 text-gray-200' : 'bg-cyan-50/50 border-cyan-200 text-gray-800'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="font-semibold text-cyan-400">{feat.feature_name}</span>
                                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                darkMode ? 'bg-cyan-900/60 text-cyan-300' : 'bg-cyan-100 text-cyan-800'
                                              }`}>
                                                {feat.contribution_pct}% impact
                                              </span>
                                            </div>
                                            <div className={`text-[11px] font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                              Metric: <span className="font-bold">{feat.value}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Right Side: Small Recharts Radar Chart */}
                                <div className={`lg:col-span-4 p-4 rounded-2xl border flex flex-col items-center justify-between ${
                                  darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                                }`}>
                                  <div className="w-full text-center">
                                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                                      <Radar className="w-3.5 h-3.5" />
                                      <span>Normalized Risk Dimensions</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500">0.0 (low) to 1.0 (elevated)</div>
                                  </div>

                                  <div className="w-full h-52 my-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <RadarChart data={fileRadarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                        <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                                        <PolarAngleAxis 
                                          dataKey="metric" 
                                          tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 10 }} 
                                        />
                                        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                                        <RechartsRadar 
                                          name="Risk Profile" 
                                          dataKey="value" 
                                          stroke="#38bdf8" 
                                          fill="#38bdf8" 
                                          fillOpacity={0.4} 
                                        />
                                      </RadarChart>
                                    </ResponsiveContainer>
                                  </div>

                                  <div className="w-full grid grid-cols-2 gap-1 text-[10px] font-mono text-gray-400 border-t pt-2 border-gray-800/40">
                                    <div>Churn: <span className="text-white font-bold">{file.lines_churn_avg}l</span></div>
                                    <div>Bug: <span className="text-white font-bold">{Math.round(file.bug_ratio * 100)}%</span></div>
                                    <div>Comp: <span className="text-white font-bold">{file.complexity_proxy}</span></div>
                                    <div>Devs: <span className="text-white font-bold">{file.unique_authors}</span></div>
                                  </div>
                                </div>
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
