// Helpers to resolve per-host whitelabel environment variables.
export function normalizeHostname(hostname) {
  return (hostname || '').toLowerCase();
}

function toEnvKey(prefix, suffix) {
  return `VITE_${prefix}_${suffix}`;
}

export function resolvePerHostEnv(hostname, suffix) {
  const env = import.meta.env || {};
  if (!hostname) return null;
  const parts = hostname.split('.').filter(Boolean);
  const candidates = [];
  // full hostname: e.g. challan.nigraani.com -> CHALLAN_NIGRAANI_COM
  candidates.push(parts.join('_').toUpperCase());
  // domain + tld: nigraani_com
  if (parts.length >= 2) {
    candidates.push(parts.slice(-2).join('_').toUpperCase());
  }
  // second-level only: nigraani
  if (parts.length >= 2) {
    candidates.push(parts[parts.length - 2].toUpperCase());
  }
  // generic CUSTOM fallback
  candidates.push('CUSTOM');

  for (const cand of candidates) {
    const key = toEnvKey(cand, suffix);
    if (key in env && env[key]) return env[key];
  }
  return null;
}

export function getWhitelabelHosts() {
  const raw = import.meta.env.VITE_WHITELABEL_HOSTS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(s => {
    try {
      return s.startsWith('http') ? new URL(s).hostname : new URL('https://' + s).hostname;
    } catch (e) {
      return s;
    }
  });
}
