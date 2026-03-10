import React from 'react';

export default function PaginationControls({ visibleLimit, setVisibleLimit, totalCount = 0, defaultLimit = 50 }) {
  const options = [defaultLimit, defaultLimit + 50, defaultLimit + 100, totalCount].filter((v, i, a) => v && a.indexOf(v) === i);
  return (
    <div className="vst-show-more" style={{ justifyContent: 'flex-start', borderTop: 'none', padding: '12px 24px' }}>
      <span className="vst-show-more__label">Show more records:</span>
      <div className="show-more-control">
        <select className="show-more-select" value={visibleLimit} onChange={e => setVisibleLimit(Number(e.target.value))}>
          <option value={visibleLimit}>Load more…</option>
          {options.map(opt => opt > visibleLimit && <option key={opt} value={opt}>{opt === totalCount ? 'All records' : `${opt} records`}</option>)}
        </select>
      </div>
    </div>
  );
}
