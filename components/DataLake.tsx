import React, { useState, useMemo } from 'react';
import { AnalyzedAct } from '../types';
import { Download, Search, Database } from 'lucide-react';
import { useDataLakeExport } from './useDataLakeExport';
import DataLakeExportModal from './DataLakeExportModal';

interface DataLakeProps {
  acts: AnalyzedAct[];
}

const DataLake: React.FC<DataLakeProps> = ({ acts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    showExportModal,
    setShowExportModal,
    exportConfig,
    setExportConfig,
    handleExport,
  } = useDataLakeExport(acts);

  const filteredActs = useMemo(() => acts.filter(act =>
    act.mesa.toLowerCase().includes(searchTerm.toLowerCase()) || 
    act.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.id.includes(searchTerm)
  ), [acts, searchTerm]);

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

      <DataLakeExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        config={exportConfig}
        setConfig={setExportConfig}
      />
    </div>
  );
};

export default DataLake;
