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

// Try to fetch an image URL and return a data URL (useful when external images
// block html2canvas due to CORS). If fetching or conversion fails, returns null.
export async function fetchImageAsDataUrl(url) {
  if (!url) return null;
  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}
