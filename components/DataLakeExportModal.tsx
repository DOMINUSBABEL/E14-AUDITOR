import React from 'react';
import { Download, Calendar, Filter, FileSpreadsheet, X } from 'lucide-react';

export interface ExportConfig {
  startDate: string;
  endDate: string;
  columns: {
    [key: string]: boolean;
  };
}

interface DataLakeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  config: ExportConfig;
  setConfig: (config: ExportConfig) => void;
}

const DataLakeExportModal: React.FC<DataLakeExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  config,
  setConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center">
            <FileSpreadsheet className="mr-3 text-green-500" size={24} />
            Export Data Lake
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Date Range Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Calendar className="mr-2" size={16} /> Date Range
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={e => setConfig({...config, startDate: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 color-scheme-dark"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={config.endDate}
                  onChange={e => setConfig({...config, endDate: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 color-scheme-dark"
                />
              </div>
            </div>
          </div>

          {/* Column Selection Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Filter className="mr-2" size={16} /> Select Columns
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(config.columns).map((col) => (
                <label key={col} className="flex items-center space-x-3 p-3 bg-slate-950 rounded border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.columns[col]}
                    onChange={e => setConfig({...config, columns: {...config.columns, [col]: e.target.checked}})}
                    className="rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-primary-600"
                  />
                  <span className="text-sm text-slate-300 capitalize">{col.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              <span className="font-bold">Note:</span> Exporting large datasets (over 10,000 rows) may take a few moments. The file will download as a CSV automatically.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-900 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center shadow-lg shadow-green-900/20"
          >
            <Download size={18} className="mr-2" />
            Download CSV
          </button>
        </div>

      </div>
    </div>
  );
};

export default DataLakeExportModal;
