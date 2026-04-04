import React from 'react';
import SelectShowMore from './SelectShowMore';

export default function PaginationControls({ visibleLimit, setVisibleLimit, totalCount = 0, defaultLimit = 30 }) {
  return (
    <div className="vst-show-more" style={{ justifyContent: 'flex-start', borderTop: 'none', padding: '12px 24px' }}>
      <span className="vst-show-more__label">Show more records:</span>
      <SelectShowMore
        onShowMoreRecords={val => {
          if (val === 'all') setVisibleLimit(totalCount);
          else setVisibleLimit(Number(val));
        }}
        onResetRecords={() => setVisibleLimit(defaultLimit)}
        maxCount={totalCount}
      />
    </div>
  );
}
