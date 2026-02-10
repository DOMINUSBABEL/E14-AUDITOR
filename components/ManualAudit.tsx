import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { analyzeElectionAct } from '../services/geminiService';
import { AnalyzedAct } from '../types';

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
            // Remove header "data:image/jpeg;base64,"
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
                        <span>Analyzing with Gemini...</span>
                    </>
                ) : (
                    <>
                        <Camera size={20} />
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
                <p className="text-xs">Upload an image to start the "Node New" process.</p>
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
                {/* Verdict Card */}
                <div className={`p-4 rounded-lg border flex items-center justify-between ${
                    result.is_fraud 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-green-500/10 border-green-500/30'
                }`}>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${
                            result.is_fraud ? 'text-red-400' : 'text-green-400'
                        }`}>Verdict</p>
                        <h2 className={`text-2xl font-bold ${
                            result.is_fraud ? 'text-white' : 'text-white'
                        }`}>
                            {result.is_fraud ? 'POTENTIAL FRAUD DETECTED' : 'VALID ACT'}
                        </h2>
                    </div>
                    <div className={`p-3 rounded-full ${
                        result.is_fraud ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                        {result.is_fraud ? <AlertTriangle size={24} /> : <Check size={24} />}
                    </div>
                </div>

                {/* Metadata */}
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

                {/* Calculations */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase">Math Verification</h4>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Sum of extracted votes:</span>
                        <span className="font-mono text-white">{result.total_calculated}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Total declared on form:</span>
                        <span className="font-mono text-white">{result.total_declared}</span>
                    </div>
                    <div className="h-px bg-slate-800"></div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Difference:</span>
                        <span className={`font-mono font-bold ${
                            (result.total_calculated! - result.total_declared!) !== 0 
                            ? 'text-red-500' 
                            : 'text-green-500'
                        }`}>
                            {result.total_calculated! - result.total_declared!}
                        </span>
                    </div>
                </div>

                {/* Votes Table */}
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