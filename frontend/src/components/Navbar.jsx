import React from 'react';
import { ShieldAlert, Sun, Moon } from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function Navbar({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode
}) {
  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-200 ${
      darkMode ? 'bg-gray-950/80 border-gray-800 text-gray-100' : 'bg-white/85 border-gray-200 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img 
              src="/logo.png" 
              alt="BugRadar Logo" 
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]" 
            />
            <span className="font-black text-xl tracking-tight">BugRadar</span>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'landing'
                  ? darkMode ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('connect')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'connect'
                  ? darkMode ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <GithubIcon className="w-4 h-4" />
              Scan Repo
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? darkMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              Live Radar
            </button>
          </nav>

          {/* Right Action Controls: Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all ${
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
