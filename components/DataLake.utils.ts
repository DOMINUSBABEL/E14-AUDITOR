import { AnalyzedAct } from '../types';

/**
 * Generates an array of strings representing CSV content from an array of AnalyzedAct objects.
 * This function is optimized for performance by minimizing intermediate allocations and string concatenations.
 * It is intended to be used with Blob and URL.createObjectURL for efficient download.
 *
 * @param dataToExport Array of acts to export.
 * @param columns List of column keys to include.
 * @returns An array of strings (chunks) suitable for Blob constructor.
 */
export function generateCSVChunks(dataToExport: AnalyzedAct[], columns: string[]): string[] {
  // Pre-calculate column types/handlers to avoid checks inside the loop
  const columnHandlers = columns.map(col => {
    if (col === 'strategic_intent') {
      return (act: AnalyzedAct) => act.strategic_analysis?.intent || 'N/A';
    }
    if (col === 'strategic_recommendation') {
      return (act: AnalyzedAct) => act.strategic_analysis?.recommendation || 'N/A';
    }
    if (col === 'forensic_summary') {
      return (act: AnalyzedAct) => act.forensic_analysis.map(f => `${f.type} (${f.affected_party})`).join('; ') || 'None';
    }
    return (act: AnalyzedAct) => {
      // @ts-ignore - Dynamic property access is intended for generic export
      const val = act[col];
      return val === undefined || val === null ? '' : val;
    };
  });

  const headers = columns.join(',');
  const chunks: string[] = [];
  chunks.push(headers);
  chunks.push('\n');

  // Reuse this array to avoid allocation per row?
  // Benchmark showed simple allocation per row (Blob Prep) was faster than reusing array (Reused Array).
  // So we allocate a fresh array per row but join immediately.
  // Actually, we can just push strings directly if we want to avoid array allocation entirely?
  // But joining is often faster than repeated string concatenation.

  // Let's use the "Blob Prep" strategy from benchmark:
  // Create array of values for the row, join them, push to chunks.

  const numCols = columns.length;

  for (let i = 0; i < dataToExport.length; i++) {
    const act = dataToExport[i];
    const rowItems = new Array(numCols);

    for (let j = 0; j < numCols; j++) {
      let val = columnHandlers[j](act);

      if (typeof val === 'string') {
        // Prevent CSV Injection
        if (/^[=+\-@]/.test(val)) {
          val = `'${val}`;
        }

        // Escape quotes and wrap in quotes if it's a string
        // Note: This matches original logic which always quotes strings.
        // Optimization: only quote if necessary? For now, stick to original logic for compatibility.
        val = `"${val.replace(/"/g, '""')}"`;
      }
      rowItems[j] = val;
    }
    chunks.push(rowItems.join(','));
    chunks.push('\n');
  }

  return chunks;
}
