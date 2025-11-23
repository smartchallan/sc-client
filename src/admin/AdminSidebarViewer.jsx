
import React, { useEffect, useRef } from "react";
import "./AdminSidebarViewer.css";

function renderValue(value) {
  if (value === null || value === undefined) return <span style={{color:'#888'}}>—</span>;
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      if (value.length === 0) return <span style={{color:'#888'}}>[]</span>;
      return (
        <ul style={{margin:0, paddingLeft:18}}>
          {value.map((v, i) => <li key={i}>{renderValue(v)}</li>)}
        </ul>
      );
    }
    // Object
    return (
      <table style={{background:'#f9f9f9',margin:'4px 0',fontSize:13}}>
        <tbody>
          {Object.entries(value).map(([k, v]) => (
            <tr key={k}>
              <th style={{fontWeight:400, color:'#0072ff', width:80}}>{k}</th>
              <td>{renderValue(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default function AdminSidebarViewer({ open, onClose, title, data }) {
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);
  if (!open || !data) return null;
  return (
    <div className={`admin-sidebar-viewer${open ? "" : " closed"}`} tabIndex={-1} ref={ref} style={{animation:open?'slideInRight 0.3s cubic-bezier(.4,0,.2,1)':''}}>
      <div className="sidebar-header">
        <div className="sidebar-title">{title}</div>
        <button className="sidebar-close" onClick={onClose} title="Close">×</button>
      </div>
      <div>
        <table>
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <th className="sidebar-key">{key}</th>
                <td>{renderValue(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
