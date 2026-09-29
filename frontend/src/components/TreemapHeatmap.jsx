import React, { useState } from 'react';
import { Layers, Flame, ShieldAlert, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';

export default function TreemapHeatmap({ files, onSelectFile, selectedFilePath, darkMode }) {
  const [hoveredFile, setHoveredFile] = useState(null);

  if (!files || files.length === 0) return null;

  // Helper to get color depending on risk score
  const getRiskColor = (score) => {
    if (score >= 75) {
      return {
        bg: 'bg-red-600/80 hover:bg-red-500',
        border: 'border-red-500',
        badge: 'bg-red-950 text-red-300 border-red-800',
        text: 'text-red-400',
        hex: '#ef4444'
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-orange-600/80 hover:bg-orange-500',
        border: 'border-orange-500',
        badge: 'bg-orange-950 text-orange-300 border-orange-800',
        text: 'text-orange-400',
        hex: '#f97316'
      };
    } else if (score >= 40) {
      return {
        bg: 'bg-amber-600/80 hover:bg-amber-500',
        border: 'border-amber-500',
        badge: 'bg-amber-950 text-amber-300 border-amber-800',
        text: 'text-amber-400',
        hex: '#eab308'
      };
    } else if (score >= 20) {
      return {
        bg: 'bg-emerald-600/80 hover:bg-emerald-500',
        border: 'border-emerald-500',
        badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        text: 'text-emerald-400',
        hex: '#10b981'
      };
    } else {
      return {
        bg: 'bg-teal-600/80 hover:bg-teal-500',
        border: 'border-teal-500',
        badge: 'bg-teal-950 text-teal-300 border-teal-800',
        text: 'text-teal-400',
        hex: '#14b8a6'
      };
    }
  };

  // Compute total LOC or weight for relative sizing
  const totalWeight = files.reduce((acc, f) => acc + Math.max(f.lines_of_code || 30, 20), 0);

  return (
    <div className={`p-6 rounded-3xl border transition-all ${
      darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 mb-5 border-b ${
        darkMode ? 'border-gray-800/80' : 'border-gray-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Codebase Risk Heatmap & Treemap</h3>
          </div>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Tile size reflects lines of code/weight; color intensity indicates AI bug probability.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Risk Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[10px]">
              &lt; 35% Safe
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px]">
              35-65% Med
            </span>
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/30 text-[10px]">
              &gt; 65% Critical
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Grid / Treemap Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {files.map((file) => {
          const colorMeta = getRiskColor(file.risk_score);
          const isSelected = selectedFilePath === file.file_path;
          const fileName = file.file_path.split('/').pop();
          const fileDir = file.file_path.substring(0, file.file_path.lastIndexOf('/'));

          return (
            <div
              key={file.file_path}
              onClick={() => onSelectFile && onSelectFile(file.file_path)}
              onMouseEnter={() => setHoveredFile(file)}
              onMouseLeave={() => setHoveredFile(null)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 transform hover:scale-[1.03] flex flex-col justify-between min-h-[105px] relative overflow-hidden ${
                colorMeta.bg
              } ${
                isSelected 
                  ? 'ring-2 ring-white shadow-xl scale-[1.04]' 
                  : 'border-black/20'
              }`}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono text-white/75 truncate" title={fileDir}>
                    {fileDir ? `${fileDir}/` : ''}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-black/50 text-white font-mono font-bold text-[10px] shrink-0">
                    {file.risk_score}%
                  </span>
                </div>
                <div className="font-bold text-xs text-white truncate" title={file.file_path}>
                  {fileName}
                </div>
              </div>

              <div className="relative z-10 pt-2 flex items-center justify-between text-[10px] text-white/80 font-mono">
                <span>{file.bug_fix_commits} bug-fixes</span>
                <span>{file.lines_of_code} LOC</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hovered / Active Details Banner */}
      {(hoveredFile || (selectedFilePath && files.find(f => f.file_path === selectedFilePath))) && (
        (() => {
          const active = hoveredFile || files.find(f => f.file_path === selectedFilePath);
          if (!active) return null;
          return (
            <div className={`mt-4 p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-mono text-xs ${
              darkMode ? 'bg-gray-950 border-gray-800 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-bold text-sm text-cyan-500 truncate">{active.file_path}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  active.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500' :
                  active.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {active.risk_level} RISK ({active.risk_score}%)
                </span>
              </div>
              <div className={`flex flex-wrap items-center gap-4 text-[11px] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>Bug Commits: <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{active.bug_fix_commits}</strong> / {active.total_commits}</span>
                <span>Avg Churn: <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{active.lines_churn_avg}</strong> lines</span>
                <span>Authors: <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{active.unique_authors}</strong></span>
                <span>Complexity: <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{active.complexity_proxy}</strong></span>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
