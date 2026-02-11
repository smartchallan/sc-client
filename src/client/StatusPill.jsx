import React from 'react';

export default function StatusPill({ status = '', count = null }) {
  const cls = `status-pill status-${String(status || '').toLowerCase()}`;
  return (
    <span className={cls} style={{display:'inline-block',padding:'4px 8px',borderRadius:12,background:'#f1f5f9',fontSize:12}}>
      {status}{count != null ? ` (${count})` : ''}
    </span>
  );
}
