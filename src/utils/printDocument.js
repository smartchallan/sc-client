export default function printDocument(htmlContent, filename = 'document') {
  try {
    const w = window.open('', '', 'height=700,width=900');
    if (!w) return false;
    w.document.write('<html><head><title>Print</title>');
    w.document.write('<style>body{font-family:Segoe UI, Arial, sans-serif;font-size:13px;color:#333;} table{border-collapse:collapse;width:100%;} td,th{padding:6px 8px;border-bottom:1px solid #e3eaf1;} </style>');
    w.document.write('</head><body>' + htmlContent + '</body></html>');
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
    return true;
  } catch (e) { return false; }
}
