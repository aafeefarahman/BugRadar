import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ConnectRepo from './components/ConnectRepo';
import Dashboard from './components/Dashboard';
import ModelPerformance from './components/ModelPerformance';
import SharedReportView from './components/SharedReportView';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import { getQuickSampleAnalysis, analyzeRepository } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [darkMode, setDarkMode] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sharedReportId, setSharedReportId] = useState(null);

  // Check URL on startup for /report/:id
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/report/')) {
      const id = path.replace('/report/', '').replace(/\/$/, '');
      if (id) {
        setSharedReportId(id);
        setActiveTab('report');
      }
    }
  }, []);

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
    showToast(`Scan complete for ${data.repo_name}!`, 'success');
  };

  const handleOpenDemo = async () => {
    try {
      const data = await getQuickSampleAnalysis();
      setAnalysisData(data);
      setActiveTab('dashboard');
      showToast('Loaded instant demo analysis sample.', 'success');
    } catch (e) {
      setActiveTab('connect');
    }
  };

  const handleViewModelPerformance = async () => {
    if (!analysisData) {
      try {
        const data = await getQuickSampleAnalysis();
        setAnalysisData(data);
      } catch (e) {
        setActiveTab('connect');
        return;
      }
    }
    setActiveTab('model-performance');
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
      darkMode ? 'bg-[#090d16] text-gray-100' : 'bg-slate-50 text-gray-900'
    }`}>
      <div>
        {/* Navbar Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'model-performance' && !analysisData) {
              handleViewModelPerformance();
            } else {
              setActiveTab(tab);
            }
          }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Global Toast Container */}
        <Toast toasts={toasts} onDismiss={dismissToast} darkMode={darkMode} />

        {/* Main Content with Error Boundary */}
        <main className="pb-16">
          <ErrorBoundary>
            {activeTab === 'landing' && (
              <LandingPage
                onStartScan={() => setActiveTab('connect')}
                onInstantDemo={handleOpenDemo}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'connect' && (
              <ConnectRepo
                onAnalysisComplete={handleAnalysisComplete}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                analysisData={analysisData}
                onAnalysisComplete={handleAnalysisComplete}
                onNewScan={() => setActiveTab('connect')}
                onViewModelPerformance={() => setActiveTab('model-performance')}
                darkMode={darkMode}
                showToast={showToast}
              />
            )}

            {activeTab === 'model-performance' && (
              <ModelPerformance
                analysisData={analysisData}
                darkMode={darkMode}
                onBackToRadar={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'report' && sharedReportId && (
              <SharedReportView
                reportId={sharedReportId}
                onBackHome={() => setActiveTab('landing')}
                darkMode={darkMode}
              />
            )}
          </ErrorBoundary>
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

