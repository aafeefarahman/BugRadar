import React, { useState } from 'react';
import { 
  BarChart2, 
  Cpu, 
  Award, 
  Sparkles,
  ArrowRight,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  GitBranch,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

function ChartSkeleton({ height = 300, darkMode }) {
  return (
    <div 
      style={{ height }} 
      className={`w-full rounded-2xl animate-pulse flex flex-col justify-end p-6 gap-3 ${
        darkMode ? 'bg-gray-800/40 border border-gray-800' : 'bg-gray-100 border border-gray-200'
      }`}
    >
      <div className="flex items-end gap-3 h-full w-full opacity-60">
        <div className="w-1/6 bg-gray-700/50 rounded-t h-1/3" />
        <div className="w-1/6 bg-gray-700/50 rounded-t h-2/3" />
        <div className="w-1/6 bg-gray-700/50 rounded-t h-1/2" />
        <div className="w-1/6 bg-gray-700/50 rounded-t h-4/5" />
        <div className="w-1/6 bg-gray-700/50 rounded-t h-3/5" />
        <div className="w-1/6 bg-gray-700/50 rounded-t h-2/3" />
      </div>
      <div className={`h-3 w-1/3 rounded ${darkMode ? 'bg-gray-700/60' : 'bg-gray-300'}`} />
    </div>
  );
}

export default function ModelPerformance({ analysisData, loading, darkMode, onBackToRadar }) {
  const modelReport = analysisData?.model_report;
  const models = modelReport?.models || [];
  
  // 1. ML Models and Churn Baseline
  const mlModels = models.filter(m => !m.model_name.includes('Baseline'));
  const baselineModel = models.find(m => m.model_name.includes('Baseline'));

  // 2. Best ML model by highest ROC-AUC among ML models only (>= 0.60)
  let bestMlModel = null;
  let highestAuc = 0;
  mlModels.forEach(m => {
    const auc = typeof m.roc_auc === 'number' ? m.roc_auc : 0;
    if (auc > highestAuc) {
      highestAuc = auc;
      bestMlModel = m;
    }
  });

  const hasBestBadge = Boolean(bestMlModel && highestAuc >= 0.60);
  const bestModelName = hasBestBadge ? bestMlModel.model_name : null;
  const defaultSelected = bestMlModel ? bestMlModel.model_name : (models[0]?.model_name || 'Random Forest');
  const featureImportances = modelReport?.feature_importances || [];

  const [selectedModel, setSelectedModel] = useState(defaultSelected);
  const [methodologyExpanded, setMethodologyExpanded] = useState(false);
  const activeModelObj = models.find(m => m.model_name === selectedModel) || bestMlModel || models[0];

  // 3. Verdict calculation relative to churn baseline
  const baselineF1 = baselineModel?.f1 ?? 0;
  const baselineAuc = baselineModel?.roc_auc ?? 0;
  const positiveLabelsCount = modelReport?.positive_samples ?? 0;

  const beatsOnF1 = mlModels.some(m => (m.f1 ?? 0) > baselineF1);
  const beatsOnAuc = mlModels.some(m => (m.roc_auc ?? 0) > baselineAuc);
  const beatsBaseline = beatsOnF1 || beatsOnAuc;

  let verdictText = '';
  let isPositiveVerdict = false;

  if (!beatsBaseline) {
    verdictText = `On this repo, models perform close to the churn baseline. Interpret with caution (${positiveLabelsCount} defect label${positiveLabelsCount === 1 ? '' : 's'}).`;
    isPositiveVerdict = false;
  } else {
    const leadModel = bestMlModel || mlModels[0];
    const aucGain = leadModel && typeof leadModel.roc_auc === 'number' ? (leadModel.roc_auc - baselineAuc) * 100 : 0;
    const f1Gain = leadModel && typeof leadModel.f1 === 'number' ? (leadModel.f1 - baselineF1) * 100 : 0;
    
    const gainSegments = [];
    if (aucGain > 0) gainSegments.push(`+${aucGain.toFixed(1)}% ROC-AUC`);
    if (f1Gain > 0) gainSegments.push(`+${f1Gain.toFixed(1)}% F1`);

    verdictText = `${leadModel.model_name} outperforms the churn baseline by ${gainSegments.join(' and ') || 'higher accuracy'} on out-of-fold validation.`;
    isPositiveVerdict = true;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <ChartSkeleton height={140} darkMode={darkMode} />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100'}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={340} darkMode={darkMode} />
          <ChartSkeleton height={340} darkMode={darkMode} />
        </div>
      </div>
    );
  }

  const hasInsufficientLabels = Boolean(modelReport?.insufficient_labels || modelReport?.warning === 'insufficient_labels');

  if (!modelReport || models.length === 0 || hasInsufficientLabels) {
    const isInsufficient = hasInsufficientLabels;
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className={`p-8 rounded-3xl border max-w-lg mx-auto shadow-xl ${
          darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
            isInsufficient ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
          }`}>
            {isInsufficient ? <AlertCircle className="w-8 h-8" /> : <BarChart2 className="w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold">
            {isInsufficient 
              ? "Not enough defect history in this repo for reliable model evaluation" 
              : "No Model Evaluation Available"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            {isInsufficient
              ? "This repository has too few historical bug-fix commits (fewer than 2 positive defect labels) in its commit history to establish statistically reliable cross-validation folds and ROC/PR curves. BugRadar uses domain-heuristic risk analysis for this repository."
              : "Please run a scan from the Live Radar or Connect Repo tab to generate real-time multi-model evaluation reports with out-of-fold curves."}
          </p>
          {onBackToRadar && (
            <button
              onClick={onBackToRadar}
              className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-md inline-flex items-center gap-2"
            >
              <span>Go to Live Radar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate derived confusion matrix rates for active model
  const cm = activeModelObj?.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
  const totalSamples = cm.tn + cm.fp + cm.fn + cm.tp || 1;
  const sensitivity = (cm.tp + cm.fn > 0) ? (cm.tp / (cm.tp + cm.fn)) : 0;
  const specificity = (cm.tn + cm.fp > 0) ? (cm.tn / (cm.tn + cm.fp)) : 0;
  const accuracy = (cm.tp + cm.tn) / totalSamples;

  const rocData = modelReport.roc_comparison_points || [];
  const prData = modelReport.pr_comparison_points || [];
  const prBaseline = modelReport.pr_baseline ?? 0.3;

  const modelColorMap = {
    'Random Forest': '#38bdf8',
    'Logistic Regression': '#a855f7',
    'Gradient Boosting': '#10b981',
    'Naive Churn Baseline': '#94a3b8'
  };

  const CustomChartTooltip = ({ active, payload, label, xLabel = 'X' }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-xl border shadow-xl text-xs font-mono space-y-1 ${
          darkMode ? 'bg-gray-950/95 border-gray-800 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-900 shadow-md'
        }`}>
          <div className="text-[11px] font-bold text-gray-400 border-b pb-1 mb-1 border-gray-700/40">
            {xLabel}: {label}
          </div>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold">{(entry.value * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Machine Learning Rigor Report
            </span>
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1">
              <span>Data source: {analysisData.data_source || (analysisData.repo_name.includes('demo') ? 'Offline Demo Sample' : 'Real Repository (GitHub API)')}</span>
            </span>
            <span className="text-xs font-medium text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Temporal Split (70/30)
            </span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Out-of-Fold Validation
            </span>
            {modelReport.positive_samples < 10 && (
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Too few defect labels for reliable evaluation</span>
              </span>
            )}
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Model Evaluation & Defect Predictive Benchmarks
          </h1>
          <p className={`text-xs sm:text-sm max-w-3xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Rigorous temporal validation benchmarking Logistic Regression, Random Forest, Gradient Boosting, 
            and a Naive Churn baseline on <span className="font-semibold text-cyan-400">{analysisData.repo_name}</span>.
          </p>
        </div>

        {onBackToRadar && (
          <button
            onClick={onBackToRadar}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
              darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <span>Back to Live Radar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dataset & Split Statistics KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Split Strategy</div>
          <div className="text-sm font-bold mt-1 text-purple-400">70% / 30% Temporal</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Temporal split used to reduce leakage</div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Feature Window</div>
          <div className={`text-lg font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {modelReport.train_commit_count} <span className="text-xs font-normal text-gray-500">commits</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Oldest 70% revisions</div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Label Window</div>
          <div className={`text-lg font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {modelReport.test_commit_count} <span className="text-xs font-normal text-gray-500">commits</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Newest 30% ground truth</div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Training Files</div>
          <div className={`text-lg font-black mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {modelReport.train_file_count}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Historical corpus</div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Defect Labels (y=1)</div>
          <div className="text-lg font-black mt-1 text-red-400">
            {modelReport.positive_samples} <span className="text-xs font-normal text-gray-500">files</span>
          </div>
          <div className="text-[11px] mt-0.5">
            {modelReport.positive_samples < 10 ? (
              <span className="text-amber-400 font-medium">Sample &lt; 10 (low reliability)</span>
            ) : (
              <span className="text-gray-500">Future bug-fix touches</span>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            {hasBestBadge ? 'Top Performing' : 'Evaluation Mode'}
          </div>
          <div className="text-sm font-bold mt-1 text-emerald-400 truncate" title={hasBestBadge ? bestModelName : (modelReport.positive_samples < 10 ? 'Heuristic Blended' : 'Baseline / Heuristic')}>
            {hasBestBadge ? bestModelName : (modelReport.positive_samples < 10 ? 'Heuristic Blended' : 'Close to Baseline')}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {hasBestBadge ? 'Highest ROC-AUC' : (modelReport.positive_samples < 10 ? 'Evaluating small sample' : 'No ML model >= 0.60 AUC')}
          </div>
        </div>
      </div>

      {/* Benchmark Verdict Banner */}
      <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 transition-all ${
        isPositiveVerdict
          ? darkMode ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : darkMode ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isPositiveVerdict
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isPositiveVerdict ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>
        <div className="font-medium leading-relaxed">
          {verdictText}
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div>
            <h3 className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Multi-Model Benchmark Matrix
            </h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Evaluated with out-of-fold stratified cross-validation and class imbalance balancing.
            </p>
          </div>
          <div className="text-xs text-cyan-400 font-mono">
            Curves: Out-of-fold CV probabilities
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                darkMode ? 'border-gray-800 bg-gray-950/60 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}>
                <th className="py-3.5 px-4 sm:px-6">Model / Classifier</th>
                <th className="py-3.5 px-4 text-center">Precision</th>
                <th className="py-3.5 px-4 text-center">Recall</th>
                <th className="py-3.5 px-4 text-center">F1-Score</th>
                <th className="py-3.5 px-4 text-center">ROC-AUC</th>
                <th className="py-3.5 px-4 text-center">5-Fold CV F1 (μ ± σ)</th>
                <th className="py-3.5 px-4 text-center">5-Fold CV AUC (μ ± σ)</th>
                <th className="py-3.5 px-4 text-center">Confusion (TN/FP/FN/TP)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-800/60' : 'divide-gray-200'}`}>
              {models.map((m, idx) => {
                const isBest = hasBestBadge && (m.model_name === bestModelName);
                const isSelected = m.model_name === selectedModel;
                return (
                  <tr 
                    key={idx}
                    onClick={() => setSelectedModel(m.model_name)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? darkMode ? 'bg-indigo-950/30' : 'bg-indigo-50/60'
                        : darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: modelColorMap[m.model_name] || '#38bdf8' }} />
                        <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{m.model_name}</span>
                        {isBest && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Best
                          </span>
                        )}
                        {m.model_name.includes('Baseline') && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                            Baseline
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-400">
                      {m.precision !== null && m.precision !== undefined ? `${(m.precision * 100).toFixed(1)}%` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-400">
                      {m.recall !== null && m.recall !== undefined ? `${(m.recall * 100).toFixed(1)}%` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-400">
                      {m.f1 !== null && m.f1 !== undefined ? `${(m.f1 * 100).toFixed(1)}%` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                      {m.roc_auc !== null && m.roc_auc !== undefined ? `${(m.roc_auc * 100).toFixed(1)}%` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-gray-300">
                      {m.cv_f1_mean !== null && m.cv_f1_mean !== undefined 
                        ? `${(m.cv_f1_mean * 100).toFixed(1)}% ± ${(m.cv_f1_std * 100).toFixed(1)}%` 
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-gray-300">
                      {m.cv_auc_mean !== null && m.cv_auc_mean !== undefined 
                        ? `${(m.cv_auc_mean * 100).toFixed(1)}% ± ${(m.cv_auc_std * 100).toFixed(1)}%` 
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs text-gray-400">
                      <span className="text-gray-500">{m.confusion_matrix.tn}</span> / 
                      <span className="text-amber-500"> {m.confusion_matrix.fp}</span> / 
                      <span className="text-red-400"> {m.confusion_matrix.fn}</span> / 
                      <span className="text-emerald-400 font-bold"> {m.confusion_matrix.tp}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Recharts Curves: ROC Curve & Precision-Recall Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ROC Curve */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between gap-4 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Activity className="w-4 h-4 text-cyan-400" />
                Receiver Operating Characteristic (ROC)
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Out-of-Fold
              </span>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              True Positive Rate vs. False Positive Rate across classification thresholds.
            </p>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#e5e7eb'} />
                <XAxis 
                  dataKey="fpr" 
                  type="number" 
                  domain={[0, 1]} 
                  tickCount={6}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                  label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5, fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  tickCount={6}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                  label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', offset: 15, fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                />
                <Tooltip content={<CustomChartTooltip xLabel="FPR" darkMode={darkMode} />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                {/* Chance diagonal line */}
                <Line 
                  type="monotone" 
                  dataKey="Chance" 
                  name="Chance Diagonal" 
                  stroke="#64748b" 
                  strokeDasharray="4 4" 
                  dot={false} 
                  strokeWidth={1.5}
                />

                {/* Model lines */}
                <Line 
                  type="monotone" 
                  dataKey="Random Forest" 
                  name="Random Forest" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gradient Boosting" 
                  name="Gradient Boosting" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Logistic Regression" 
                  name="Logistic Regression" 
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Naive Churn Baseline" 
                  name="Churn Baseline" 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  strokeWidth={1.5} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precision-Recall Curve */}
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between gap-4 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Activity className="w-4 h-4 text-purple-400" />
                Precision-Recall (PR) Curve
              </h3>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Imbalance Benchmark
              </span>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Precision vs. Recall under class imbalance (Baseline ratio = {(prBaseline * 100).toFixed(1)}%).
            </p>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#e5e7eb'} />
                <XAxis 
                  dataKey="recall" 
                  type="number" 
                  domain={[0, 1]} 
                  tickCount={6}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                  label={{ value: 'Recall', position: 'insideBottom', offset: -5, fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  tickCount={6}
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 11 }}
                  label={{ value: 'Precision', angle: -90, position: 'insideLeft', offset: 15, fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 11 }}
                />
                <Tooltip content={<CustomChartTooltip xLabel="Recall" darkMode={darkMode} />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                {/* Horizontal chance baseline */}
                <Line 
                  type="monotone" 
                  dataKey="Baseline" 
                  name={`Baseline (${(prBaseline * 100).toFixed(0)}%)`} 
                  stroke="#64748b" 
                  strokeDasharray="4 4" 
                  dot={false} 
                  strokeWidth={1.5}
                />

                {/* Model lines */}
                <Line 
                  type="monotone" 
                  dataKey="Random Forest" 
                  name="Random Forest" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gradient Boosting" 
                  name="Gradient Boosting" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Logistic Regression" 
                  name="Logistic Regression" 
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="Naive Churn Baseline" 
                  name="Churn Baseline" 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  strokeWidth={1.5} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Feature Importance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Confusion Matrix Heatmap for Active Model */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border shadow-xl flex flex-col justify-between gap-6 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Confusion Matrix: {selectedModel}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                Out-of-fold Accuracy: {(accuracy * 100).toFixed(1)}%
              </span>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Temporal split evaluation classifications (N = {totalSamples} files).
            </p>
          </div>

          {/* 2x2 Matrix Grid */}
          <div className="grid grid-cols-2 gap-3 text-center">
            {/* True Negative */}
            <div className={`p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">True Negative (TN)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{cm.tn}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Clean & Predicted Clean</div>
            </div>

            {/* False Positive */}
            <div className={`p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">False Positive (FP)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{cm.fp}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">False Alarm (Type I)</div>
            </div>

            {/* False Negative */}
            <div className={`p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">False Negative (FN)</div>
              <div className="text-2xl font-black text-red-400 mt-1">{cm.fn}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Missed Defect (Type II)</div>
            </div>

            {/* True Positive */}
            <div className={`p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-cyan-950/30 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
            }`}>
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">True Positive (TP)</div>
              <div className="text-2xl font-black text-cyan-300 mt-1">{cm.tp}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Defect Caught Successfully</div>
            </div>
          </div>

          {/* Rates Row */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className={`p-2.5 rounded-xl border text-center ${
              darkMode ? 'bg-gray-950/50 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <span className="text-gray-500 text-[10px] block">SENSITIVITY (RECALL)</span>
              <span className="font-bold text-cyan-400 text-sm">{(sensitivity * 100).toFixed(1)}%</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-center ${
              darkMode ? 'bg-gray-950/50 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <span className="text-gray-500 text-[10px] block">SPECIFICITY</span>
              <span className="font-bold text-emerald-400 text-sm">{(specificity * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Global Feature Importance */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border shadow-xl space-y-6 ${
          darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Feature Importance (Random Forest)
              </h3>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Derived from Gini impurity reduction across Random Forest decision trees.
            </p>
          </div>

          <div className="space-y-4">
            {featureImportances.map((f, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="font-mono text-cyan-400 text-[11px]">#{idx + 1}</span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{f.display_name}</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-xs">
                    {f.importance}%
                  </span>
                </div>
                <div className="w-full bg-gray-800/40 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"
                    style={{ width: `${Math.max(4, f.importance)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Methodology Accordion (Replacing long text blocks) */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden transition-all ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={() => setMethodologyExpanded(!methodologyExpanded)}
          className={`w-full p-6 flex items-center justify-between text-left transition-colors ${
            darkMode ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
          }`}
        >
          <div>
            <h3 className={`text-sm sm:text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Methodology & Academic Defense Notes
            </h3>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Temporal split mechanics, label leakage prevention, and class-imbalance mitigation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
            <span>{methodologyExpanded ? 'Collapse' : 'Expand Details'}</span>
            {methodologyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {methodologyExpanded && (
          <div className={`p-6 border-t space-y-4 text-xs leading-relaxed ${
            darkMode ? 'border-gray-800 bg-gray-950/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>1. Temporal Split vs. Random K-Fold</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Standard cross-validation causes lookahead bias in sequential code repositories. BugRadar trains strictly on the oldest 70% of chronological commits and evaluates against defect fixes appearing in the newest 30% window.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>2. Class Imbalance Mitigation</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Bug-prone modules represent a minority class. BugRadar applies balanced inverse class-frequency sample weighting across Random Forest, Logistic Regression, and Gradient Boosting models to prevent majority-class collapse.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>3. Small-Sample Adaptivity</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  For young repositories with fewer than 30 commits, cross-validation folds exhibit higher variance. BugRadar dynamically shifts blend weights toward our domain-heuristic Bayesian blender to guarantee robustness.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
