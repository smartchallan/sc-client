import React from 'react';

export default function BulkActionModal({ isOpen = false, onClose = () => {}, onConfirm = () => {}, title = 'Bulk Actions', children, confirmLabel = 'Apply' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{maxWidth:600,margin:'48px auto',padding:16,background:'#fff',borderRadius:8}}>
        <header className="modal-header" style={{marginBottom:12}}>
          <h3 style={{margin:0}}>{title}</h3>
        </header>
        <div className="modal-body" style={{marginBottom:12}}>{children}</div>
        <footer className="modal-footer" style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </footer>
      </div>
    </div>
  );
}
