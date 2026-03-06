import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Loader2, Microscope, Scale, Link as LinkIcon, Folder, CheckCircle, Globe } from 'lucide-react';
import { analyzeElectionAct } from '../services/geminiService';
import { AnalyzedAct, ForensicDetail } from '../types';
import { POLITICAL_CONFIG } from '../constants';
import RegistraduriaScraper from './RegistraduriaScraper';

interface ManualAuditProps {
  onComplete?: (results: Partial<AnalyzedAct>[]) => void;
}

const ManualAudit: React.FC<ManualAuditProps> = ({ onComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'urls' | 'registraduria'>('upload');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Partial<AnalyzedAct>[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleRegistraduriaImage = (url: string, metadata: string) => {
      setUrls(prev => prev ? `${prev}\n${url}` : url);
      setActiveTab('urls');
      // Optional: auto-start if it's the only one?
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setResults([]);
      setError(null);
      setCurrentIndex(0);
    }
  };

  const getBase64FromUrl = async (url: string): Promise<{ base64: string, mimeType: string }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({
          base64: result.split(',')[1],
          mimeType: blob.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getBase64FromFile = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({
          base64: result.split(',')[1],
          mimeType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    setIsProcessing(true);
    setError(null);
    setResults([]);
    
    let itemsToProcess: Array<{ source: string, getData: () => Promise<{base64: string, mimeType: string}> }> = [];

    if (activeTab === 'upload' && files.length > 0) {
      itemsToProcess = files.map(file => ({
        source: file.name,
        getData: () => getBase64FromFile(file)
      }));
    } else if (activeTab === 'urls' && urls.trim().length > 0) {
      const urlList = urls.split('\n').filter(u => u.trim() !== '');
      itemsToProcess = urlList.map(url => ({
        source: url.trim(),
        getData: () => getBase64FromUrl(url.trim())
      }));
    }

    if (itemsToProcess.length === 0) {
      setError("No files or URLs provided.");
      setIsProcessing(false);
      return;
    }

    const finalResults: Partial<AnalyzedAct>[] = [];

    for (let i = 0; i < itemsToProcess.length; i++) {
      setCurrentIndex(i);
      const item = itemsToProcess[i];
      try {
        const { base64, mimeType } = await item.getData();
        const analysis = await analyzeElectionAct(base64, mimeType, item.source);
        setResults(prev => [...prev, analysis]);
        finalResults.push(analysis);
      } catch (err: any) {
        console.error(`Error processing ${item.source}:`, err);
        const failResult: Partial<AnalyzedAct> = { 
          archivo_analizado: item.source, 
          status: 'failed',
          document_integrity: { 
            estado: 'ERROR_DE_LECTURA', 
            hallazgos: [`Error: ${err.message || 'Error desconocido'}`], 
            nivel_de_confianza: 'Bajo', 
            conclusion: `Falló la extracción: ${err.message || 'Error de la API de Gemini'}` 
          },
          mesa: 'UNKNOWN', zona: 'UNKNOWN', votes: [], total_calculated: 0, total_declared: 0, is_fraud: false, forensic_analysis: []
        };
        setResults(prev => [...prev, failResult]);
        finalResults.push(failResult);
      }
    }

    if (onComplete) onComplete(finalResults);
    setIsProcessing(false);
  };

  const activeResult = results.length > 0 ? results[results.length - 1] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full" data-testid="manual-audit">
      {/* Left Column: Upload & Queue */}
      <div className="space-y-6 flex flex-col">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-800">
            <button 
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              onClick={() => setActiveTab('upload')}
            >
              <Folder size={16} /> Archivos Locales
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'urls' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              onClick={() => setActiveTab('urls')}
            >
              <LinkIcon size={16} /> URLs (Batch)
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'registraduria' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              onClick={() => setActiveTab('registraduria')}
            >
              <Globe size={16} /> Registraduría
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'upload' ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                  <Upload size={24} />
                </div>
                <div>
                  <h3 className="text-white font-medium">Cargar Formularios E-14</h3>
                  <p className="text-slate-500 text-sm mb-4">Selecciona archivos individuales o una carpeta entera</p>
                </div>
                
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileChange} />
                <input ref={folderInputRef} type="file" accept="image/*,application/pdf" {...({ webkitdirectory: "", directory: "" } as any)} className="hidden" onChange={handleFileChange} />
                
                <div className="flex justify-center gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Seleccionar Archivos
                  </button>
                  <button onClick={() => folderInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Seleccionar Carpeta
                  </button>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-950 rounded text-sm text-slate-300 border border-slate-800">
                    <CheckCircle size={16} className="inline mr-2 text-emerald-500" />
                    {files.length} archivos cargados en cola listos para procesar.
                  </div>
                )}
              </div>
            ) : activeTab === 'urls' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-2">Ingresar URLs de E-14</h3>
                  <p className="text-slate-500 text-xs mb-2">Pega los enlaces directos a las imágenes, uno por línea.</p>
                </div>
                <textarea 
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://ejemplo.com/acta1.jpg&#10;https://ejemplo.com/acta2.jpg"
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300 font-mono focus:border-primary-500 focus:outline-none"
                />
              </div>
            ) : (
              <RegistraduriaScraper onImageFound={handleRegistraduriaImage} />
            )}
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-sm text-slate-400">
              {isProcessing && (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-primary-500" />
                  Procesando: {currentIndex + 1} / {(activeTab === 'upload' ? files.length : urls.split('\n').filter(u=>u.trim()!=='').length)}
                </span>
              )}
            </div>
            <button
                onClick={handleAnalyze}
                disabled={isProcessing || (activeTab === 'upload' && files.length === 0) || (activeTab === 'urls' && urls.length === 0)}
                className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-bold text-white transition-all ${
                    isProcessing || (activeTab === 'upload' && files.length === 0) || (activeTab === 'urls' && urls.length === 0)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20'
                }`}
            >
                <Microscope size={20} />
                <span>{isProcessing ? 'Auditando...' : 'Iniciar Flujo de Auditoría'}</span>
            </button>
        </div>

        {/* Mini queue log */}
        {results.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex-1 overflow-y-auto max-h-[300px]">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Historial de Procesamiento</h4>
            <div className="space-y-2">
              {results.map((r, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="truncate w-1/2 text-slate-300" title={r.archivo_analizado}>{r.archivo_analizado}</span>
                  <span className={`px-2 py-1 rounded font-bold ${
                    r.document_integrity?.estado === 'IMPUGNABLE' ? 'bg-red-500/20 text-red-400' :
                    r.document_integrity?.estado === 'ERROR_DE_LECTURA' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {r.document_integrity?.estado || r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Active Results */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto relative">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <FileText className="mr-2 text-primary-500" />
            Resultados del Análisis Forense
        </h3>

        {!activeResult && !isProcessing && !error && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-600 space-y-2 border border-slate-800/50 rounded-lg bg-slate-950/50 p-6 text-center">
                <Scale size={48} className="text-slate-800 mb-4" />
                <p>El motor forense está en espera.</p>
                <p className="text-xs">Carga un lote de archivos locales o ingresa URLs para iniciar la extracción automatizada y validar la impugnabilidad.</p>
            </div>
        )}

        {isProcessing && !activeResult && (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                <div className="h-32 bg-slate-800 rounded w-full"></div>
                <div className="h-8 bg-slate-800 rounded w-1/2"></div>
                <div className="h-20 bg-slate-800 rounded w-full"></div>
            </div>
        )}

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-400 flex items-center">
                <AlertTriangle className="mr-2 flex-shrink-0" />
                {error}
            </div>
        )}

        {activeResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
                
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between items-center text-slate-400">
                  <span>Último archivo: <strong className="text-slate-200">{activeResult.archivo_analizado}</strong></span>
                </div>

                {/* 1. Verdict Card (Estado de Impugnabilidad) */}
                <div className={`p-5 rounded-lg border relative overflow-hidden ${
                    activeResult.document_integrity?.estado === 'IMPUGNABLE'
                    ? 'bg-red-900/20 border-red-500/40' 
                    : activeResult.document_integrity?.estado === 'ERROR_DE_LECTURA'
                    ? 'bg-orange-900/20 border-orange-500/40'
                    : 'bg-emerald-900/20 border-emerald-500/40'
                }`}>
                   <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                                Estado del Documento
                            </span>
                            <Scale size={20} className={
                              activeResult.document_integrity?.estado === 'IMPUGNABLE' ? 'text-red-400' : 
                              activeResult.document_integrity?.estado === 'ERROR_DE_LECTURA' ? 'text-orange-400' : 'text-emerald-400'
                            } />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-1">
                            {activeResult.document_integrity?.estado || "NO IMPUGNABLE"}
                        </h2>
                        <p className="text-sm opacity-90 mb-3">
                            {activeResult.document_integrity?.conclusion || "Documento limpio y legible."}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-xs bg-black/30 px-2 py-1 rounded border border-white/10">
                                Confianza: {activeResult.document_integrity?.nivel_de_confianza || "Alta"}
                            </span>
                        </div>
                   </div>
                </div>

                {/* 2. Hallazgos Estratégicos */}
                {activeResult.document_integrity?.hallazgos && activeResult.document_integrity.hallazgos.length > 0 && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center">
                          <AlertTriangle className="mr-2 text-orange-400" size={16} />
                          Hallazgos Registrados
                      </h4>
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1 ml-4">
                        {activeResult.document_integrity.hallazgos.map((hallazgo, idx) => (
                          <li key={idx}>{hallazgo}</li>
                        ))}
                      </ul>
                  </div>
                )}

                {/* 3. Forensic Details (The "Vision" Part) */}
                {activeResult.forensic_analysis && activeResult.forensic_analysis.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center">
                            <Microscope className="mr-2 text-purple-400" size={16} />
                            Desglose de Anomalías Visuales
                        </h4>
                        <div className="space-y-3">
                            {activeResult.forensic_analysis.map((f: ForensicDetail, idx: number) => (
                                <div key={idx} className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col gap-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-mono text-purple-400 border border-purple-500/30 px-1 rounded bg-purple-500/10">
                                            {f.type}
                                        </span>
                                        <span className="text-xs text-slate-500">{Math.round((f.confidence || 0) * 100)}% Confianza</span>
                                    </div>
                                    <p className="text-sm text-slate-300">{f.description}</p>
                                    
                                    {/* Reconstruction Pre/Post */}
                                    <div className="flex items-center gap-3 text-sm mt-1 bg-black/20 p-2 rounded">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase">Original Ingerido</span>
                                            <span className="font-mono text-slate-400 line-through">{f.original_value_inferred ?? '?'}</span>
                                        </div>
                                        <div className="text-slate-600">→</div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase">Final (Legible)</span>
                                            <span className="font-mono text-white font-bold">{f.final_value_legible}</span>
                                        </div>
                                        <div className="ml-auto text-xs text-right">
                                            <span className="block text-slate-500">Afectado</span>
                                            <span className="text-slate-300">{f.affected_party}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Basic Metadata */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <label className="text-xs text-slate-500 font-mono">MESA ID</label>
                        <p className="text-xl text-white font-mono">{activeResult.mesa || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <label className="text-xs text-slate-500 font-mono">ZONA</label>
                        <p className="text-xl text-white font-mono">{activeResult.zona || 'N/A'}</p>
                    </div>
                </div>

                {/* 5. Extracted Votes */}
                {activeResult.votes && activeResult.votes.length > 0 && (
                  <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Votos Extraídos</h4>
                      <div className="border border-slate-800 rounded-lg overflow-hidden">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-slate-800 text-slate-300">
                                  <tr>
                                      <th className="px-4 py-2">Partido / Candidato</th>
                                      <th className="px-4 py-2 text-right">Conteo</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                                  {activeResult.votes.map((vote, idx) => (
                                      <tr key={idx}>
                                          <td className="px-4 py-2 text-slate-300">{vote.party}</td>
                                          <td className="px-4 py-2 text-right font-mono text-primary-400">{vote.count}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ManualAudit;
