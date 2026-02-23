import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Loader2, Microscope, Scale } from 'lucide-react';
import { analyzeElectionAct } from '../services/geminiService';
import { AnalyzedAct, ForensicDetail } from '../types';
import { POLITICAL_CONFIG } from '../constants';

const ManualAudit: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Partial<AnalyzedAct> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64Content = base64data.split(',')[1];
            
            try {
                const analysis = await analyzeElectionAct(base64Content, file.type);
                setResult(analysis);
            } catch (err) {
                setError("Failed to analyze image. Please check API Key or image format.");
            } finally {
                setLoading(false);
            }
        };
    } catch (err) {
        setError("Error processing file.");
        setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Column: Upload */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[400px] border-dashed relative">
          {preview ? (
            <div className="relative w-full h-full flex items-center justify-center">
                <img 
                    src={preview} 
                    alt="Act Preview" 
                    className="max-h-[400px] max-w-full rounded shadow-lg object-contain"
                />
                <button 
                    onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setResult(null);
                    }}
                    className="absolute top-2 right-2 bg-slate-950/80 text-white p-2 rounded-full hover:bg-red-500/80 transition-colors"
                >
                    ✕
                </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                <Upload size={32} />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">Upload E-14 Form</h3>
                <p className="text-slate-500 text-sm">Drag & drop or click to upload</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Select Image
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
            <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-bold text-white transition-all ${
                    !file || loading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20'
                }`}
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" />
                        <span>Running Forensic Vision...</span>
                    </>
                ) : (
                    <>
                        <Microscope size={20} />
                        <span>Run Audit</span>
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Right Column: Results */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <FileText className="mr-2 text-primary-500" />
            Analysis Results
        </h3>

        {!result && !loading && !error && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-600 space-y-2 border border-slate-800/50 rounded-lg bg-slate-950/50">
                <p>No data extracted yet.</p>
                <p className="text-xs">Upload an E-14 image to begin forensic analysis.</p>
            </div>
        )}

        {loading && (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                <div className="h-32 bg-slate-800 rounded w-full"></div>
                <div className="h-8 bg-slate-800 rounded w-1/2"></div>
                <div className="h-20 bg-slate-800 rounded w-full"></div>
            </div>
        )}

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-400 flex items-center">
                <AlertTriangle className="mr-2" />
                {error}
            </div>
        )}

        {result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Verdict Card with Strategic Recommendation */}
                <div className={`p-5 rounded-lg border relative overflow-hidden ${
                    result.strategic_analysis?.intent === 'PERJUICIO'
                    ? 'bg-red-900/20 border-red-500/40' 
                    : result.strategic_analysis?.intent === 'BENEFICIO'
                    ? 'bg-emerald-900/20 border-emerald-500/40'
                    : 'bg-slate-800/50 border-slate-700'
                }`}>
                   <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                                Legal Strategy Engine
                            </span>
                            <Scale size={20} className={result.strategic_analysis?.intent === 'PERJUICIO' ? 'text-red-400' : 'text-emerald-400'} />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-1">
                            {result.strategic_analysis?.recommendation || "VALIDAR"}
                        </h2>
                        <p className="text-sm opacity-90 mb-3">
                            {result.strategic_analysis?.legal_grounding || "No action required."}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-xs bg-black/30 px-2 py-1 rounded border border-white/10">
                                Impact: {result.strategic_analysis?.intent}
                            </span>
                            <span className="text-xs bg-black/30 px-2 py-1 rounded border border-white/10">
                                Client: {POLITICAL_CONFIG.CLIENT_NAME}
                            </span>
                        </div>
                   </div>
                </div>

                {/* 2. Forensic Details (The "Vision" Part) */}
                {result.forensic_analysis && result.forensic_analysis.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center">
                            <Microscope className="mr-2 text-purple-400" size={16} />
                            Forensic Evidence Found
                        </h4>
                        <div className="space-y-3">
                            {result.forensic_analysis.map((f: ForensicDetail, idx: number) => (
                                <div key={idx} className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col gap-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-mono text-purple-400 border border-purple-500/30 px-1 rounded bg-purple-500/10">
                                            {f.type}
                                        </span>
                                        <span className="text-xs text-slate-500">{Math.round(f.confidence * 100)}% Confidence</span>
                                    </div>
                                    <p className="text-sm text-slate-300">{f.description}</p>
                                    
                                    {/* Reconstruction Pre/Post */}
                                    <div className="flex items-center gap-3 text-sm mt-1 bg-black/20 p-2 rounded">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase">Original (Inferred)</span>
                                            <span className="font-mono text-slate-400 line-through">{f.original_value_inferred ?? '?'}</span>
                                        </div>
                                        <div className="text-slate-600">→</div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase">Final (Legible)</span>
                                            <span className="font-mono text-white font-bold">{f.final_value_legible}</span>
                                        </div>
                                        <div className="ml-auto text-xs text-right">
                                            <span className="block text-slate-500">Affected Party</span>
                                            <span className="text-slate-300">{f.affected_party}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Basic Metadata */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <label className="text-xs text-slate-500 font-mono">MESA ID</label>
                        <p className="text-xl text-white font-mono">{result.mesa}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <label className="text-xs text-slate-500 font-mono">ZONA</label>
                        <p className="text-xl text-white font-mono">{result.zona}</p>
                    </div>
                </div>

                {/* 4. Extracted Votes */}
                <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Extracted Votes</h4>
                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800 text-slate-300">
                                <tr>
                                    <th className="px-4 py-2">Party / Candidate</th>
                                    <th className="px-4 py-2 text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                                {result.votes?.map((vote, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 text-slate-300">{vote.party}</td>
                                        <td className="px-4 py-2 text-right font-mono text-primary-400">{vote.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ManualAudit;