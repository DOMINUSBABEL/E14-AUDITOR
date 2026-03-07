import React, { useMemo } from 'react';
import { AnalyzedAct, ForensicDetail } from '../types';
import { X, Scale, FileText, Download, AlertTriangle, ShieldCheck, Gavel, Printer } from 'lucide-react';
import { generateLegalTemplate } from './LegalUtils';

interface LegalDocumentModalProps {
  act: AnalyzedAct;
  onClose: () => void;
}

const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({ act, onClose }) => {
  const forensicSummary = useMemo(() => {
    if (!act.forensic_analysis || act.forensic_analysis.length === 0) return "No se detectaron alteraciones físicas evidentes.";
    return act.forensic_analysis.map(f => 
      `${f.type}: ${f.description} (Afecta a: ${f.affected_party}). Valor inferido: ${f.original_value_inferred ?? 'N/A'} -> Valor final: ${f.final_value_legible}`
    ).join('; ');
  }, [act]);

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generateLegalTemplate(act)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `impugnacion_mesa_${act.mesa}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500/20 p-2 rounded-lg text-primary-500">
              <Scale size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Proyección de Acción Judicial</h3>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Mesa: {act.mesa} | Impugnación de Acta y Urna</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel: Forensic Evidence */}
          <div className="w-full md:w-1/3 border-r border-slate-800 p-6 space-y-6 overflow-y-auto bg-slate-900/50">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <AlertTriangle className="mr-2 text-amber-500" size={16} />
              Sustento Técnico-Legal
            </h4>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Causal de Nulidad (Art. 275 CPACA)</p>
                <div className={`text-sm font-bold flex items-center ${act.is_fraud ? 'text-red-400' : 'text-emerald-400'}`}>
                  {act.is_fraud ? <AlertTriangle size={14} className="mr-1" /> : <ShieldCheck size={14} className="mr-1" />}
                  {act.is_fraud ? 'IMPEDIMENTO POR ALTERACIÓN' : 'SIN CAUSAL DE NULIDAD'}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Impugnación de la Urna (Art. 192 C.E.)</p>
                <p className="text-sm text-slate-200">
                    {act.is_fraud ? 'Requiere apertura de pliegos y reconteo físico por discrepancia insubsanable.' : 'Integridad de la urna verificada bajo estándares estadísticos.'}
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Análisis de Intencionalidad</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                    act.strategic_analysis?.intent === 'PERJUICIO' ? 'bg-red-500/20 text-red-400' :
                    act.strategic_analysis?.intent === 'BENEFICIO' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-slate-700/30 text-slate-500'
                  }`}>
                    {act.strategic_analysis?.intent || 'NEUTRO'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Impacto: {act.strategic_analysis?.impact_score || 0} votos</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Sustento en CPACA (Ley 1437)</p>
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs text-blue-300 leading-relaxed italic">
                  "El acto administrativo de elección será nulo cuando los documentos electorales contengan datos contrarios a la verdad o hayan sido alterados..." (Art. 275.3)
                </div>
              </div>
            </div>

            {act.image_url && (
                <div className="mt-6">
                    <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Captura de Referencia</p>
                    <div className="aspect-[3/4] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative group">
                        <img src={act.image_url} alt="E-14" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 cursor-zoom-in">
                            <Search size={24} className="text-white" />
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Right Panel: Legal Document Preview */}
          <div className="flex-1 p-6 flex flex-col bg-slate-950/30">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <FileText className="mr-2 text-primary-400" size={16} />
                Minuta de Impugnación (Borrador)
              </h4>
              <div className="flex space-x-2">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Print Document">
                  <Printer size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white p-8 rounded-lg shadow-inner overflow-y-auto font-serif text-slate-800 leading-relaxed text-sm select-text whitespace-pre-wrap border-8 border-slate-200">
                {generateLegalTemplate(act)}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-medium transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={handleDownload}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center shadow-lg shadow-primary-900/20 active:scale-95"
              >
                <Download size={18} className="mr-2" />
                Descargar Minuta .TXT
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LegalDocumentModal;

const Search = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
