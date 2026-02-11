import React, { useState } from 'react';

export default function TableControls({ columns = [], visibleColumns = [], onToggleColumn = () => {}, onExport = () => {} }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="table-controls">
      <button type="button" className="controls-btn" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        Columns ▾
      </button>

      {open && (
        <div className="controls-panel" role="menu">
          <div className="columns-list">
            {columns.map(col => (
              <label key={col.key} style={{display:'block',margin:'4px 0'}}>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => onToggleColumn(col.key)}
                />
                <span style={{marginLeft:8}}>{col.label}</span>
              </label>
            ))}
          </div>

          <div className="export-group" style={{marginTop:8}}>
            <select
              aria-label="Export format"
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                onExport(val);
                e.target.value = '';
              }}
            >
              <option value="">Export…</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
