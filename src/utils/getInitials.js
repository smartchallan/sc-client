// Utility to get initials from a name (max 2 words)
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map(w => w[0]?.toUpperCase() || '').join('');
}
