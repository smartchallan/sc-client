import React from 'react';

export default function EmptyState({ title = 'No data', message = 'No items to show.', children }) {
  return (
    <div style={{padding:24,textAlign:'center',color:'#666'}}>
      <h3 style={{margin:0,marginBottom:8}}>{title}</h3>
      <div style={{marginBottom:12}}>{message}</div>
      {children}
    </div>
  );
}
