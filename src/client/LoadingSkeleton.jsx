import React from 'react';

export default function LoadingSkeleton({ rows = 6, columns = 6, style = {} }) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const cols = [];
    for (let c = 0; c < columns; c++) cols.push(<td key={c}><div style={{height:12,background:'#eee',borderRadius:4,width: c===0? '60%':'100%'}}></div></td>);
    cells.push(<tr key={r}>{cols}</tr>);
  }
  return (
    <div style={{padding:12, ...style}}>
      <table style={{width:'100%'}} className="latest-table"><tbody>{cells}</tbody></table>
    </div>
  );
}
