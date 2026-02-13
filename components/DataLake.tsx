import React, { useState } from 'react';
import { AnalyzedAct } from '../types';
import { Download, Search, Calendar, Filter, Database, FileSpreadsheet, X } from 'lucide-react';
import { generateCSVChunks } from './DataLake.utils';

interface DataLakeProps {
  acts: AnalyzedAct[];
}

const DataLake: React.FC<DataLakeProps> = ({ acts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
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

  const filteredActs = acts.filter(act => 
    act.mesa.toLowerCase().includes(searchTerm.toLowerCase()) || 
    act.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.id.includes(searchTerm)
  );

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

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search Mesa ID, Zona, or Ref..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-sm font-mono hidden lg:block">
            {acts.length} records in Data Lake
          </div>
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download size={18} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-mono text-xs sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 border-b border-slate-800">Timestamp</th>
                <th className="px-6 py-4 border-b border-slate-800">Mesa ID</th>
                <th className="px-6 py-4 border-b border-slate-800">Zona</th>
                <th className="px-6 py-4 border-b border-slate-800 text-center">Intent</th>
                <th className="px-6 py-4 border-b border-slate-800 text-center">Recommendation</th>
                <th className="px-6 py-4 border-b border-slate-800 text-center">Forensic Details</th>
                <th className="px-6 py-4 border-b border-slate-800 text-center">Status</th>
                <th className="px-6 py-4 border-b border-slate-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredActs.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{act.timestamp}</td>
                  <td className="px-6 py-4 font-bold text-white">{act.mesa}</td>
                  <td className="px-6 py-4">{act.zona}</td>
                  
                  {/* Intent Column */}
                  <td className="px-6 py-4 text-center">
                    {act.strategic_analysis?.intent && (
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        act.strategic_analysis.intent === 'PERJUICIO' ? 'bg-red-500/20 text-red-400' :
                        act.strategic_analysis.intent === 'BENEFICIO' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-slate-700/30 text-slate-500'
                      }`}>
                        {act.strategic_analysis.intent}
                      </span>
                    )}
                  </td>

                  {/* Recommendation Column */}
                  <td className="px-6 py-4 text-center font-mono text-xs text-white">
                     {act.strategic_analysis?.recommendation || '-'}
                  </td>

                   {/* Forensic Summary */}
                  <td className="px-6 py-4 text-center text-xs">
                     {act.forensic_analysis.length > 0 ? (
                        <div className="flex flex-col gap-1 items-center">
                            {act.forensic_analysis.map((f, i) => (
                                <span key={i} className="text-slate-300 bg-slate-800 px-1 rounded border border-slate-700">
                                    {f.type.slice(0,3)}: {f.original_value_inferred ?? '?'}→{f.final_value_legible}
                                </span>
                            ))}
                        </div>
                     ) : (
                         <span className="text-slate-600">-</span>
                     )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                      act.is_fraud 
                      ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                      : 'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                      {act.is_fraud ? 'FRAUD' : 'VERIFIED'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary-400 hover:text-primary-300 text-xs font-medium">View JSON</button>
                  </td>
                </tr>
              ))}
              {filteredActs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <Database size={32} className="mx-auto mb-2 opacity-50" />
                    No records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FileSpreadsheet className="mr-3 text-green-500" size={24} />
                Export Data Lake
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">
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
                      value={exportConfig.startDate}
                      onChange={e => setExportConfig({...exportConfig, startDate: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 color-scheme-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={exportConfig.endDate}
                      onChange={e => setExportConfig({...exportConfig, endDate: e.target.value})}
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
                  {Object.keys(exportConfig.columns).map((col) => (
                    <label key={col} className="flex items-center space-x-3 p-3 bg-slate-950 rounded border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input 
                        type="checkbox" 
                        // @ts-ignore
                        checked={exportConfig.columns[col]} 
                        // @ts-ignore
                        onChange={e => setExportConfig({...exportConfig, columns: {...exportConfig.columns, [col]: e.target.checked}})}
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
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center shadow-lg shadow-green-900/20"
              >
                <Download size={18} className="mr-2" />
                Download CSV
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DataLake;