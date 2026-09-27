import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ConnectRepo from './components/ConnectRepo';
import Dashboard from './components/Dashboard';
import { getQuickSampleAnalysis } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'connect', 'dashboard'
  const [darkMode, setDarkMode] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [sessionToken, setSessionToken] = useState('');

  // Update theme class on HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#090d16';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [darkMode]);

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setActiveTab('dashboard');
  };

  const handleOpenDemo = async () => {
    try {
      const data = await getQuickSampleAnalysis();
      setAnalysisData(data);
      setActiveTab('dashboard');
    } catch (e) {
      setActiveTab('connect');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
      darkMode ? 'bg-[#090d16] text-gray-100' : 'bg-slate-50 text-gray-900'
    }`}>
      <div>
        {/* Navbar Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Main Content Router */}
        <main className="pb-16">
          {activeTab === 'landing' && (
            <LandingPage
              onStartScan={() => setActiveTab('connect')}
              onOpenDemo={handleOpenDemo}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'connect' && (
            <ConnectRepo
              onAnalysisComplete={handleAnalysisComplete}
              darkMode={darkMode}
              sessionToken={sessionToken}
              setSessionToken={setSessionToken}
            />
          )}

          {activeTab === 'dashboard' && (
            <Dashboard
              analysisData={analysisData}
              onAnalysisComplete={handleAnalysisComplete}
              onNewScan={() => setActiveTab('connect')}
              darkMode={darkMode}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs font-mono transition-colors ${
        darkMode ? 'border-gray-800/80 text-gray-400 bg-gray-950/60' : 'border-gray-200 text-gray-600 bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-gray-200">BugRadar AI</span>
          </div>
          <div>
            Made by <span className="text-cyan-400 font-bold">LG 07</span> <span className="text-gray-300 font-semibold">(3017 & 3029)</span>
          </div>
          <div className="text-gray-500 text-[11px]">
            Predictive Software Reliability
          </div>
        </div>
      </footer>
    </div>
  );
}
