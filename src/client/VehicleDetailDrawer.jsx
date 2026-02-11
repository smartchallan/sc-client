import React from 'react';

export default function VehicleDetailDrawer({ open = false, onClose = () => {}, title = '', children }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',right:0,top:0,bottom:0,width:420,background:'#fff',boxShadow:'-6px 0 24px rgba(0,0,0,0.12)',zIndex:2000,padding:16,overflow:'auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h3 style={{margin:0}}>{title}</h3>
        <button onClick={onClose} style={{background:'transparent',border:'none',fontSize:18,cursor:'pointer'}}>×</button>
      </div>
      <div>{children}</div>
    </div>
  );
}
