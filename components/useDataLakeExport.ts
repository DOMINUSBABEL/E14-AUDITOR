import { useState } from 'react';
import { AnalyzedAct } from '../types';
import { generateCSVChunks } from './DataLake.utils';
import { ExportConfig } from './DataLakeExportModal';

interface UseDataLakeExportReturn {
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  exportConfig: ExportConfig;
  setExportConfig: (config: ExportConfig) => void;
  handleExport: () => void;
}

export const useDataLakeExport = (acts: AnalyzedAct[]): UseDataLakeExportReturn => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    startDate: '',
    endDate: '',
    columns: {
      id: true,
      mesa: true,
      zona: true,
      total_calculated: true,
      total_declared: true,
      is_fraud: true,
      timestamp: true,
      // New Forensic Columns
      strategic_intent: true,
      strategic_recommendation: true,
      forensic_summary: true,
    }
  });

  const handleExport = () => {
    // 1. Filter Data by Date
    let dataToExport = acts;
    if (exportConfig.startDate || exportConfig.endDate) {
      dataToExport = dataToExport.filter(act => {
        const actDate = new Date(act.isoTimestamp);
        const start = exportConfig.startDate ? new Date(exportConfig.startDate) : new Date('2000-01-01');
        const end = exportConfig.endDate ? new Date(exportConfig.endDate) : new Date();
        // Adjust end date to include the full day
        end.setHours(23, 59, 59, 999);
        return actDate >= start && actDate <= end;
      });
    }

    // 2. Filter Columns
    const selectedColumns = Object.entries(exportConfig.columns)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => key);

    // 3. Generate CSV
    const chunks = generateCSVChunks(dataToExport, selectedColumns);
    const blob = new Blob(chunks, { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 4. Download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `auditor_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    setShowExportModal(false);
  };

  return {
    showExportModal,
    setShowExportModal,
    exportConfig,
    setExportConfig,
    handleExport,
  };
};
