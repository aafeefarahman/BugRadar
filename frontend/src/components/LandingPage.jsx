import React from 'react';
import { 
  Radar, 
  ArrowRight, 
  Zap,
  Link2,
  Search,
  BarChart3
} from 'lucide-react';

export default function LandingPage({ onStartScan, onOpenDemo, darkMode }) {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center max-w-5xl mx-auto px-4 pt-2 sm:pt-4 pb-6">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-indigo-600/15 to-red-500/15 blur-3xl pointer-events-none -z-10 rounded-full" />

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-5">
          Know which files will <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
            break before you ship
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
          BugRadar mines git commit history, models code churn, and calculates cyclomatic complexity to predict bug-prone hotspots using machine learning and resilient heuristic fallback scoring.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartScan}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
          >
            <Radar className="w-5 h-5" />
            <span>Connect & Scan Repository</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenDemo}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl border font-semibold text-base transition-all ${
              darkMode
                ? 'bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800 hover:border-gray-600'
                : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Explore Live Demo Data</span>
          </button>
        </div>

        {/* Interactive Mock Preview Widget */}
        <div className="mt-10 relative max-w-4xl mx-auto rounded-2xl border border-gray-800 bg-gray-950/90 shadow-2xl p-4 sm:p-6 text-left">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs font-mono text-gray-400 ml-2">bugradar scan: expressjs/express (commit depth: 200)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>AI Ensemble Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50">
              <div className="text-red-400 font-bold flex items-center justify-between">
                <span>src/router/index.js</span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">RISK: 91%</span>
              </div>
              <p className="text-gray-400 text-[11px] mt-1.5">14 bug fixes • 4 unique authors • high cyclomatic complexity</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50">
              <div className="text-amber-400 font-bold flex items-center justify-between">
                <span>src/middleware/init.js</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">RISK: 58%</span>
              </div>
              <p className="text-gray-400 text-[11px] mt-1.5">5 bug fixes • churn 45 lines/commit • modified 12d ago</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
              <div className="text-emerald-400 font-bold flex items-center justify-between">
                <span>src/utils/status.js</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">RISK: 12%</span>
              </div>
              <p className="text-gray-400 text-[11px] mt-1.5">0 bug fixes • low branching complexity • 1 author</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Box Workflow Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How BugRadar Predicts Code Failure Hotspots
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto mt-2">
            Multi-stage analysis combines commit telemetry, heuristic proxy parsing, and machine learning models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className={`p-6 rounded-2xl border transition-all ${
            darkMode ? 'bg-gray-900/50 border-gray-800 hover:border-cyan-500/40' : 'bg-white border-gray-200 hover:border-cyan-500/40'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Link2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">1. Paste Your Repo Link</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enter any public GitHub repository URL. BugRadar pulls up to 200 commits deep to start the scan.
            </p>
          </div>

          {/* Card 2 */}
          <div className={`p-6 rounded-2xl border transition-all ${
            darkMode ? 'bg-gray-900/50 border-gray-800 hover:border-indigo-500/40' : 'bg-white border-gray-200 hover:border-indigo-500/40'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">2. We Scan Every File</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Each file is analyzed for bug-fix history, code churn, complexity, and author activity to build a risk profile.
            </p>
          </div>

          {/* Card 3 */}
          <div className={`p-6 rounded-2xl border transition-all ${
            darkMode ? 'bg-gray-900/50 border-gray-800 hover:border-purple-500/40' : 'bg-white border-gray-200 hover:border-purple-500/40'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">3. Get Instant Risk Scores</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              See every file ranked by risk, with clear reasons behind each score — so you know exactly where to focus testing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
