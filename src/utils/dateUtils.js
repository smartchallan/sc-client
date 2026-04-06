/**
 * Shared date formatting utilities — used across all templates.
 * Output format: DD-Mon-YYYY (e.g. 15-Mar-2024)
 */

/**
 * Parse a date string in any of the three supported formats:
 *   DD-MMM-YYYY  (e.g. 15-Mar-2024)
 *   DD-MM-YYYY   (e.g. 15-03-2024)
 *   YYYY-MM-DD   (e.g. 2024-03-15)
 * Returns a Date object, or null if unparseable.
 */
export function parseDate(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === 'NA' || dateStr === 'N/A') return null;

  let val = dateStr;
  // Unwrap object wrappers like { value } or { date }
  if (typeof val === 'object') {
    val = val.value || val.date || null;
    if (!val) return null;
  }
  if (typeof val !== 'string') val = String(val);

  // Try JSON-wrapped objects
  if (val.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(val);
      val = parsed.value || parsed.date || val;
    } catch (_) { /* ignore */ }
  }

  val = val.trim();

  // DD-MMM-YYYY  e.g. 15-Mar-2024
  const dmy3 = val.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmy3) {
    const d = new Date(`${dmy3[2]} ${dmy3[1]} ${dmy3[3]}`);
    if (!isNaN(d)) return d;
  }

  // DD-MM-YYYY HH:mm:ss  e.g. 31-03-2026 08:36:08  (ULIP challan datetime)
  const dmyHms = val.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (dmyHms) {
    const sec = dmyHms[6] || '00';
    const d = new Date(
      `${dmyHms[3]}-${dmyHms[2].padStart(2, '0')}-${dmyHms[1].padStart(2, '0')}` +
      `T${dmyHms[4].padStart(2, '0')}:${dmyHms[5]}:${sec}`
    );
    if (!isNaN(d)) return d;
  }

  // DD-MM-YYYY  e.g. 15-03-2024
  const dmy = val.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`);
    if (!isNaN(d)) return d;
  }

  // YYYY-MM-DD or ISO string
  const d = new Date(val);
  if (!isNaN(d)) return d;

  return null;
}

/**
 * Format a date value as DD-Mon-YYYY (e.g. 15-Mar-2024).
 * Returns '-' if the value cannot be parsed.
 */
export function formatDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).replace(/ /g, '-');
}

/**
 * Format a datetime value as a human-readable string with time.
 * Output: 15 Mar 2024, 02:30 PM (IST)
 */
export function formatDateTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  if (isNaN(d)) return '-';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Format a challan date/time value.
 * - If the source string contains a time component (HH:mm), shows date + time.
 * - If date-only, shows date only (DD-Mon-YYYY).
 * Handles "DD-MM-YYYY HH:mm:ss" (raw ULIP) and "DD-MMM-YYYY" (normalized) formats.
 */
export function formatChallanDateTime(dateStr) {
  if (!dateStr || dateStr === '-' || dateStr === 'NA' || dateStr === 'N/A') return '-';
  const s = String(dateStr).trim();
  const hasTime = /\d{2}:\d{2}/.test(s);
  const d = parseDate(s);
  if (!d) return s; // return raw string if still unparseable
  if (hasTime) {
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).replace(/ /g, '-');
}

/**
 * Relative time string (e.g. "3m ago", "2h ago", "5d ago").
 * Falls back to formatDate for dates older than 7 days.
 */
export function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
