import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Layers, Grid, FileText, Loader2, AlertCircle, Download, Microscope, Sparkles, FolderTree, FileJson, Archive } from 'lucide-react';
import * as registraduria from '../services/registraduriaService';
import JSZip from 'jszip';

interface RegistraduriaScraperProps {
  onImageFound: (url: string, metadata: string) => void;
}

const RegistraduriaScraper: React.FC<RegistraduriaScraperProps> = ({ onImageFound }) => {
  const [activeMode, setActiveMode] = useState<'magic' | 'manual' | 'export'>('magic');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isAgenticLoading, setIsAgenticLoading] = useState(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [corps, setCorps] = useState<registraduria.RegistraduriaCorporation[]>([]);
  const [depts, setDepts] = useState<registraduria.RegistraduriaLocation[]>([]);
  const [muns, setMuns] = useState<registraduria.RegistraduriaLocation[]>([]);
  const [zones, setZones] = useState<registraduria.RegistraduriaLocation[]>([]);
  const [puestos, setPuestos] = useState<registraduria.RegistraduriaLocation[]>([]);
  const [tables, setTables] = useState<registraduria.RegistraduriaTable[]>([]);

  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMun, setSelectedMun] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedPuesto, setSelectedPuesto] = useState('');
  const [selectedTable, setSelectedTable] = useState('');

  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Initial Data
  useEffect(() => {
    registraduria.getCorporations().then(data => {
        setCorps(data);
        if (data.length > 0) setSelectedCorp(data[0].id);
    });
  }, []);

  // Cascading effects (simplified for brevity)
  useEffect(() => { if (selectedCorp) registraduria.getDepartments(selectedCorp).then(setDepts); }, [selectedCorp]);
  useEffect(() => { if (selectedDept) registraduria.getMunicipalities(selectedCorp, selectedDept).then(setMuns); }, [selectedDept, selectedCorp]);
  useEffect(() => { if (selectedMun) registraduria.getZones(selectedCorp, selectedDept, selectedMun).then(setZones); }, [selectedMun, selectedCorp, selectedDept]);
  useEffect(() => { if (selectedZone) registraduria.getPollingStations(selectedCorp, selectedDept, selectedMun, selectedZone).then(setPuestos); }, [selectedZone]);
  useEffect(() => { if (selectedPuesto) registraduria.getTables(selectedCorp, selectedDept, selectedMun, selectedZone, selectedPuesto).then(setTables); }, [selectedPuesto]);

  const handleMagicSearch = async () => {
    if (!magicPrompt.trim()) return;
    setIsAgenticLoading(true);
    try {
        const result = await registraduria.searchByPrompt(magicPrompt);
        // Simulate finding the data
        setSelectedDept(result.target.dept);
        setSelectedMun(result.target.mun);
        // We'd continue the chain here to auto-select
        setActiveMode('manual');
    } catch (e) {
        setError("AI Agent could not resolve the prompt. Try manual selection.");
    } finally {
        setIsAgenticLoading(false);
    }
  };

  const handleBatchExport = async () => {
    if (!selectedPuesto) return;
    setIsExporting(true);
    setExportProgress(0);
    const zip = new JSZip();
    
    try {
        const targetTables = tables.length > 0 ? tables : await registraduria.getTables(selectedCorp, selectedDept, selectedMun, selectedZone, selectedPuesto);
        const folderPath = `${selectedDept}/${selectedMun}/${selectedPuesto}`;
        const folder = zip.folder(folderPath);

        for (let i = 0; i < targetTables.length; i++) {
            const t = targetTables[i];
            const url = t.u || `https://cdn-e14.registraduria.gov.co/2023/${selectedCorp}/${t.id}.jpg`;
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                folder?.file(`Mesa_${t.n}.jpg`, blob);
            } catch (err) {
                console.warn(`Could not download table ${t.n}`);
            }
            setExportProgress(Math.round(((i + 1) / targetTables.length) * 100));
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `E14_Export_${selectedMun}_Puesto_${selectedPuesto}.zip`;
        link.click();
    } catch (e) {
        setError("Export failed due to connection issues.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button 
          onClick={() => setActiveMode('magic')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeMode === 'magic' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Sparkles size={14} /> Magic Prompt
        </button>
        <button 
          onClick={() => setActiveMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeMode === 'manual' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Search size={14} /> Búsqueda Manual
        </button>
        <button 
          onClick={() => setActiveMode('export')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${activeMode === 'export' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Archive size={14} /> Exportación Masiva
        </button>
      </div>

      {activeMode === 'magic' && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
           <div className="relative">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" size={20} />
              <input 
                type="text" 
                value={magicPrompt}
                onChange={(e) => setMagicPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleMagicSearch()}
                placeholder="Ej: 'Alcaldía de Medellín, Comuna 4, Mesa 12'..."
                className="w-full bg-slate-950 border-2 border-primary-900/30 focus:border-primary-500 rounded-xl pl-12 pr-4 py-4 text-white font-medium placeholder:text-slate-600 outline-none transition-all shadow-2xl shadow-primary-900/10"
              />
              <button 
                onClick={handleMagicSearch}
                disabled={isAgenticLoading || !magicPrompt.trim()}
                className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-500 text-white px-6 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
              >
                {isAgenticLoading ? <Loader2 className="animate-spin" size={18} /> : 'Resolver'}
              </button>
           </div>
           <p className="text-[10px] text-slate-500 px-2 italic">
             Lógica Agéntica: El sistema interpretará tu ubicación y configurará los filtros automáticamente.
           </p>
        </div>
      )}

      {(activeMode === 'manual' || activeMode === 'export') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
            <SelectGroup label="Corporación" icon={Building2} value={selectedCorp} options={corps} onChange={setSelectedCorp} />
            <SelectGroup label="Departamento" icon={MapPin} value={selectedDept} options={depts} onChange={setSelectedDept} />
            <SelectGroup label="Municipio" icon={MapPin} value={selectedMun} options={muns} onChange={setSelectedMun} disabled={!selectedDept} />
            <SelectGroup label="Zona" icon={Layers} value={selectedZone} options={zones} onChange={setSelectedZone} disabled={!selectedMun} />
            <SelectGroup label="Puesto" icon={Grid} value={selectedPuesto} options={puestos} onChange={setSelectedPuesto} disabled={!selectedZone} />
            {activeMode === 'manual' && (
                <SelectGroup label="Mesa" icon={FileText} value={selectedTable} options={tables} onChange={setSelectedTable} disabled={!selectedPuesto} />
            )}
        </div>
      )}

      {activeMode === 'manual' && (
        <button
          onClick={() => {
              const table = tables.find(t => t.id === selectedTable);
              if (table) onImageFound(table.u || `https://cdn-e14.registraduria.gov.co/2023/${selectedCorp}/${selectedTable}.jpg`, `Mesa ${table.n}`);
          }}
          disabled={!selectedTable}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
        >
          Importar Acta para Auditoría
        </button>
      )}

      {activeMode === 'export' && (
        <div className="space-y-4">
            <button
                onClick={handleBatchExport}
                disabled={isExporting || !selectedPuesto}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
                {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Archive size={20} />}
                <span>{isExporting ? `Exportando... ${exportProgress}%` : 'Generar Exportación Jerárquica (ZIP)'}</span>
            </button>
            
            {isExporting && (
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-primary-500 h-full transition-all duration-300" style={{ width: `${exportProgress}%` }}></div>
                </div>
            )}
            
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex gap-4 items-start">
                <FolderTree className="text-primary-500 shrink-0" size={20} />
                <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white uppercase">Estructura del Archivo</h5>
                    <p className="text-[10px] text-slate-500 font-mono">
                        / {selectedDept || 'DEP'} <br/>
                        &nbsp; / {selectedMun || 'MUN'} <br/>
                        &nbsp; &nbsp; / {selectedPuesto || 'PUESTO'} <br/>
                        &nbsp; &nbsp; &nbsp; - Mesa_1.jpg <br/>
                        &nbsp; &nbsp; &nbsp; - Mesa_2.jpg
                    </p>
                </div>
            </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
};

const SelectGroup = ({ label, icon: Icon, value, options, onChange, disabled }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
      <Icon size={12} /> {label}
    </label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:border-primary-500 focus:outline-none disabled:opacity-50"
    >
      <option value="">Seleccionar...</option>
      {options.map((opt: any) => (
        <option key={opt.id} value={opt.id}>{opt.n}</option>
      ))}
    </select>
  </div>
);

export default RegistraduriaScraper;
