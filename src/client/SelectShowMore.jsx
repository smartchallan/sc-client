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
    <>
      <select
        style={{
          padding: '7px 16px',
          borderRadius: 6,
          border: '1.5px solid #1976d2',
          fontSize: 15,
          fontWeight: 600,
          color: '#1976d2',
          background: '#f5faff',
          outline: 'none',
          marginRight: 8
        }}
        value={selectValue}
        onChange={e => {
          const val = e.target.value;
          setSelectValue(0); // Reset to default after selection
          if (typeof onShowMoreRecords === 'function') onShowMoreRecords(val);
        }}
      >
        <option value={0} disabled>Select</option>
        {options.map(n => (
          <option key={n} value={n}>{n} records</option>
        ))}
        <option value="all">All records</option>
      </select>
      {typeof onResetRecords === 'function' && (
        <button className="action-btn flat-btn" onClick={() => {
          onResetRecords();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} style={{ padding: '6px 10px' }}>Reset</button>
      )}
    </>
  );
}