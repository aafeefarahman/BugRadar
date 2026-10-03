import React from 'react';
import { 
  Radar, 
  ShieldAlert, 
  Sun, 
  Moon, 
  BarChart2 
} from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function Navbar({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode
}) {
  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ${
      darkMode ? 'bg-gray-950/85 border-gray-800 text-gray-100' : 'bg-white/90 border-gray-200 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Radar className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">BugRadar</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'landing'
                  ? darkMode ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-900 shadow-sm'
                  : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('connect')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'connect'
                  ? darkMode ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>Scan Repo</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? darkMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
              <span>Live Radar</span>
            </button>

            <button
              onClick={() => setActiveTab('model-performance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'model-performance'
                  ? darkMode ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-purple-50 text-purple-700 border border-purple-200'
                  : darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Model Rigor</span>
            </button>
          </nav>

          {/* Right Action Controls: Dark Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${
                darkMode
                  ? 'bg-gray-900 border-gray-800 text-yellow-400 hover:bg-gray-800 hover:border-gray-700'
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle Dark / Light Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
