/** UTF-8 Excel-compatible CSV, with quoted fields and inert spreadsheet formulas. */
export function createCsvBlob(rows: Array<Array<string | number | null | undefined>>): Blob {
  const csv = rows.map((row) => row.map((value) => {
    let text = String(value ?? '')
    if (typeof value === 'string' && /^\s*[=+@-]|^[\t\r\n]/.test(value)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }).join(',')).join('\r\n')
  return new Blob(['\uFEFF', csv, '\r\n'], { type: 'text/csv;charset=utf-8' })
}
