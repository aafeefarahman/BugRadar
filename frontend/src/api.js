export function formatErrorDetail(detail, fallbackMsg = 'Request failed.') {
  if (!detail) return fallbackMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const formatted = detail
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const loc = Array.isArray(item.loc) ? item.loc.filter(l => l !== 'body').join('.') : '';
          const msg = item.msg || item.message || JSON.stringify(item);
          return loc ? `${loc}: ${msg}` : msg;
        }
        return String(item);
      })
      .filter(Boolean)
      .join('; ');
    return formatted || fallbackMsg;
  }
  if (typeof detail === 'object') {
    if (detail.message) return String(detail.message);
    if (detail.msg) return String(detail.msg);
    try {
      return JSON.stringify(detail);
    } catch {
      return fallbackMsg;
    }
  }
  return String(detail);
}

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL.replace(/\/$/, '')}/api`;

export async function analyzeRepository(repoUrlOrParams, useSample = false, maxCommits = 200) {
  let repoUrl = repoUrlOrParams;
  let sample = useSample;
  let commits = maxCommits;

  if (repoUrlOrParams && typeof repoUrlOrParams === 'object') {
    repoUrl = repoUrlOrParams.repo_url || repoUrlOrParams.repoUrl || '';
    sample = repoUrlOrParams.use_sample ?? repoUrlOrParams.useSample ?? false;
    commits = repoUrlOrParams.max_commits || repoUrlOrParams.maxCommits || 200;
  }

  const response = await fetch(`${API_BASE}/analysis/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo_url: typeof repoUrl === 'string' ? repoUrl.trim() : '',
      use_sample: Boolean(sample),
      max_commits: Number(commits) || 200,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = formatErrorDetail(err.detail, `Analysis request failed with status ${response.status}`);
    throw new Error(message);
  }

  return await response.json();
}

export async function getQuickSampleAnalysis() {
  const response = await fetch(`${API_BASE}/analysis/quick-sample`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = formatErrorDetail(err.detail, 'Failed to fetch demo sample.');
    throw new Error(message);
  }
  return await response.json();
}

// --- Shareable Reports API ---
export async function createSharedReport(repoName, scanData) {
  const response = await fetch(`${API_BASE}/reports/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo_name: repoName,
      scan_data: scanData
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(formatErrorDetail(err.detail, 'Failed to generate shareable report.'));
  }
  return await response.json();
}

export async function getSharedReport(reportId) {
  const response = await fetch(`${API_BASE}/reports/${reportId}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(formatErrorDetail(err.detail, 'Shared report not found.'));
  }
  return await response.json();
}



