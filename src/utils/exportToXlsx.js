import * as XLSX from 'xlsx';

// Export an array of objects to an XLSX file.
// rows: Array<Object> or Array<Array>
// filename: string (e.g., 'export.xlsx')
// sheetName: string
export function exportToXlsx(rows, filename = 'export.xlsx', sheetName = 'Sheet1') {
  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    return false;
  }

  let worksheet;
  try {
    if (Array.isArray(rows) && rows.length > 0 && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
      // Normalize: remove any internal fields like _raw
      const normalized = rows.map(r => {
        const copy = {};
        Object.keys(r).forEach(k => {
          if (k === '_raw') return;
          copy[k] = r[k];
        });
        return copy;
      });
      worksheet = XLSX.utils.json_to_sheet(normalized);
    } else {
      // Assume array of arrays or primitive rows
      worksheet = XLSX.utils.aoa_to_sheet(rows);
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
    return true;
  } catch (err) {
    console.error('exportToXlsx error', err);
    return false;
  }
}

export default exportToXlsx;
