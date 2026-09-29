const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL.replace(/\/$/, '')}/api`;

export async function analyzeRepository(repoUrl, githubToken = null, useSample = false, maxCommits = 200) {
  const response = await fetch(`${API_BASE}/analysis/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo_url: repoUrl,
      github_token: githubToken ? githubToken.trim() : null,
      use_sample: useSample,
      max_commits: maxCommits,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Analysis request failed.');
  }

  return await response.json();
}

export async function getQuickSampleAnalysis() {
  const response = await fetch(`${API_BASE}/analysis/quick-sample`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch demo sample.');
  }
  return await response.json();
}
