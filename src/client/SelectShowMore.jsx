import React from "react";

export default function SelectShowMore({ onShowMoreRecords, onResetRecords, maxCount }) {
  const [selectValue, setSelectValue] = React.useState(0);
  // Generate options: 100, 200, 300, ... up to maxCount, then All
  const options = [];
  for (let n = 100; n < maxCount; n += 100) {
    options.push(n);
  }
  // If maxCount is not a multiple of 100 and > 30, add the remaining count as an option
  if (maxCount > 30 && maxCount % 100 !== 0 && !options.includes(maxCount)) {
    options.push(maxCount);
  }
  return (
    <div className="show-more-control">
      <select
        className="show-more-select"
        value={selectValue}
        onChange={e => {
          const val = e.target.value;
          setSelectValue(0);
          if (typeof onShowMoreRecords === 'function') onShowMoreRecords(val);
        }}
      >
        <option value={0} disabled>Load more…</option>
        {options.map(n => (
          <option key={n} value={n}>{n} records</option>
        ))}
        <option value="all">All records</option>
      </select>
      {typeof onResetRecords === 'function' && (
        <button className="show-more-reset" onClick={() => {
          onResetRecords();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}>
          <i className="ri-refresh-line"></i> Reset
        </button>
      )}
    </div>
  );
}