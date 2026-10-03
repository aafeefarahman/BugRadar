import React, { useState, useEffect } from 'react';
import { Share2, ArrowLeft, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { getSharedReport } from '../api';
import Dashboard from './Dashboard';

export default function SharedReportView({ reportId, onBackHome, darkMode }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await getSharedReport(reportId);
        setReport(data);
      } catch (err) {
        setError(err.message || 'Failed to load shared report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4 animate-pulse">
        <div className="h-12 bg-gray-800/40 rounded-2xl w-1/3 mx-auto" />
        <div className="h-64 bg-gray-800/40 rounded-3xl" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className={`p-8 rounded-3xl border ${
          darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
        }`}>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-400">Shared Report Not Found</h2>
          <p className="text-xs text-gray-500 mt-2">{error || 'This link may have expired or is invalid.'}</p>
          <button
            onClick={onBackHome}
            className="mt-5 px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-Only Banner */}
      <div className={`py-2 px-4 border-b text-xs flex items-center justify-between ${
        darkMode ? 'bg-purple-950/40 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>
              Viewing <strong>Public Read-Only Report</strong> for <code className="font-mono font-bold">{report.repo_name}</code> (Shared {report.created_at?.split('T')[0]})
            </span>
          </div>
          <button
            onClick={onBackHome}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to BugRadar</span>
          </button>
        </div>
      </div>

      <Dashboard
        analysisData={report.scan_data}
        onAnalysisComplete={() => {}}
        onNewScan={onBackHome}
        darkMode={darkMode}
      />
    </div>
  );
}
