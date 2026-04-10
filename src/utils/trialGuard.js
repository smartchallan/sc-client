/**
 * Trial account guard utilities.
 * Reads account_type and trial_expires_at from sc_user in localStorage.
 */

export const TRIAL_VEHICLE_LIMIT = parseInt(import.meta.env.VITE_TRIAL_VEHICLE_LIMIT, 10) || 10;
export const TRIAL_BULK_LIMIT    = parseInt(import.meta.env.VITE_TRIAL_BULK_LIMIT, 10) || 10;

function getUser() {
  try { return JSON.parse(localStorage.getItem('sc_user')) || {}; } catch { return {}; }
}

/** Returns true if the logged-in account is of type 'trial'. */
export function isTrialAccount() {
  const u = getUser();
  return (u.user?.account_type || '') === 'trial';
}

/** Returns true if the trial period has expired (date in the past). */
export function isTrialExpired() {
  const u = getUser();
  const exp = u.user?.trial_expires_at;
  if (!exp) return false;
  return new Date(exp) < new Date();
}

/**
 * Returns the number of whole days left in the trial (negative when expired).
 * Returns null if not a trial account or no expiry date set.
 */
export function getTrialDaysLeft() {
  const u = getUser();
  const exp = u.user?.trial_expires_at;
  if (!exp) return null;
  return Math.ceil((new Date(exp) - new Date()) / (24 * 60 * 60 * 1000));
}

/**
 * Returns a restricted-feature object describing what is blocked for this session.
 * {
 *   download: boolean,  // block all download/export
 *   print: boolean,     // block all print
 *   vehicleLimit: number | null,  // max vehicles (null = unlimited)
 *   bulkLimit: number,  // max rows in any bulk upload
 * }
 */
export function getTrialRestrictions() {
  if (!isTrialAccount()) {
    return { download: false, print: false, vehicleLimit: null, bulkLimit: Infinity };
  }
  return {
    download: true,
    print: true,
    vehicleLimit: TRIAL_VEHICLE_LIMIT,
    bulkLimit: TRIAL_BULK_LIMIT,
  };
}
