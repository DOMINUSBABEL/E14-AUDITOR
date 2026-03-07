import { AnalyzedAct } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateLegalTemplate } from './LegalUtils';

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

/**
 * Exports data to a PDF file.
 */
export function exportToPDF(dataToExport: AnalyzedAct[], columns: string[], fileName: string) {
  const doc = new jsPDF('l', 'pt');
  const columnHandlers = getColumnHandlers(columns);
  
  const headers = columns.map(col => col.replace(/_/g, ' ').toUpperCase());
  const body = dataToExport.map(act => columns.map((_, j) => columnHandlers[j](act)));

  doc.text("AUDITOR.IA - Reporte de Auditoría", 40, 40);
  
  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 60,
    styles: { fontSize: 8 },
    headStyles: { fillStyle: 'f', fillColor: [51, 65, 85] }
  });

  doc.save(fileName);
}

/**
 * Generates a ZIP bundle containing CSV, JSON, and legal analysis TXTs.
 */
export async function generateFullAnalysisBundle(dataToExport: AnalyzedAct[], columns: string[], baseFileName: string) {
  const zip = new JSZip();
  
  // 1. Add CSV
  const csvContent = generateCSVChunks(dataToExport, columns).join('');
  zip.file(`${baseFileName}.csv`, csvContent);
  
  // 2. Add JSON
  zip.file(`${baseFileName}.json`, JSON.stringify(dataToExport, null, 2));
  
  // 3. Add Legal Analysis folder
  const legalFolder = zip.folder("analisis_juridico");
  if (legalFolder) {
    dataToExport.forEach(act => {
      if (act.is_fraud || act.document_integrity?.estado === 'IMPUGNABLE') {
        const template = generateLegalTemplate(act);
        legalFolder.file(`impugnacion_mesa_${act.mesa}.txt`, template);
      }
    });
  }
  
  // 4. Generate and save
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${baseFileName}_bundle.zip`);
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
