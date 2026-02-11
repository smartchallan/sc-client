import React from 'react';

export default function PaginationControls({ visibleLimit, setVisibleLimit, totalCount = 0, defaultLimit = 50 }) {
  const options = [defaultLimit, defaultLimit + 50, defaultLimit + 100, totalCount].filter((v, i, a) => v && a.indexOf(v) === i);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 24 }}>
      <span style={{ color: '#1976d2', fontSize: 15 }}>Show more records:</span>
      <select className="form-control" style={{ maxWidth: 180, display: 'inline-block' }} value={visibleLimit} onChange={e => setVisibleLimit(Number(e.target.value))}>
        <option value={visibleLimit}>Show More...</option>
        {options.map(opt => opt > visibleLimit && <option key={opt} value={opt}>{opt === totalCount ? 'Show All' : `Show ${opt}`}</option>)}
      </select>
    </div>
  );
}
