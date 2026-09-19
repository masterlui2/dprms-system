/**
 * System: DPRMS
 * Purpose: Provide csv utilities.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
/** UTF-8 Excel-compatible CSV, with quoted fields and inert spreadsheet formulas. */
export function createCsvBlob(arrRows: Array<Array<string | number | null | undefined>>): Blob
{
    const strCsv = arrRows
        .map((arrRow) =>
            arrRow
                .map((objValue) =>
                {
                    let strText = String(objValue ?? '');
                    if (typeof objValue === 'string' && /^\s*[=+@-]|^[\t\r\n]/.test(objValue))
                    {
                        strText = `'${strText}`;
                    }
                    return `"${strText.replace(/"/g, '""')}"`;
                })
                .join(','),
        )
        .join('\r\n');
    return new Blob(['\uFEFF', strCsv, '\r\n'], { type: 'text/csv;charset=utf-8' });
}
