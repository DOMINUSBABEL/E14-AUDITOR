import { AnalyzedAct } from '../types';
import * as XLSX from 'xlsx';

/**
 * Generates an array of strings representing CSV content from an array of AnalyzedAct objects.
 */
export function generateCSVChunks(dataToExport: AnalyzedAct[], columns: string[]): string[] {
  const columnHandlers = getColumnHandlers(columns);
  const headers = columns.join(',');
  const chunks: string[] = [headers, '\n'];

  for (const act of dataToExport) {
    const rowItems = columns.map((_, j) => {
      let val = columnHandlers[j](act);
      if (typeof val === 'string') {
        if (['=', '+', '-', '@', '\t', '\r'].includes(val[0])) val = "'" + val;
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    chunks.push(rowItems.join(','), '\n');
  }
  return chunks;
}

/**
 * Exports data to an Excel (XLSX) file.
 */
export function exportToExcel(dataToExport: AnalyzedAct[], columns: string[], fileName: string) {
  const columnHandlers = getColumnHandlers(columns);
  
  const worksheetData = dataToExport.map(act => {
    const row: Record<string, any> = {};
    columns.forEach((col, j) => {
      row[col.replace('_', ' ').toUpperCase()] = columnHandlers[j](act);
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Auditor Audit Report");
  XLSX.writeFile(workbook, fileName);
}

function getColumnHandlers(columns: string[]) {
  return columns.map(col => {
    if (col === 'strategic_intent') return (act: AnalyzedAct) => act.strategic_analysis?.intent || 'N/A';
    if (col === 'strategic_recommendation') return (act: AnalyzedAct) => act.strategic_analysis?.recommendation || 'N/A';
    if (col === 'forensic_summary') return (act: AnalyzedAct) => act.forensic_analysis.map(f => `${f.type} (${f.affected_party})`).join('; ') || 'None';
    return (act: AnalyzedAct) => {
      // @ts-ignore
      const val = act[col];
      return val === undefined || val === null ? '' : val;
    };
  });
}
