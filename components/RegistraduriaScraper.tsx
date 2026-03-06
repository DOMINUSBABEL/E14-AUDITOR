import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Layers, Grid, FileText, Loader2, AlertCircle, Download, Microscope } from 'lucide-react';
import * as registraduria from '../services/registraduriaService';

interface RegistraduriaScraperProps {
  onImageFound: (url: string, metadata: string) => void;
}

const RegistraduriaScraper: React.FC<RegistraduriaScraperProps> = ({ onImageFound }) => {
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

  // Fetch initial corporations
  useEffect(() => {
    const init = async () => {
      try {
        const data = await registraduria.getCorporations();
        setCorps(data);
        if (data.length > 0) setSelectedCorp(data[0].id);
      } catch (e: any) {
        setError("Error loading corporations");
      }
    };
    init();
  }, []);

  // Fetch departments when corp changes
  useEffect(() => {
    if (selectedCorp) {
      setLoading(true);
      registraduria.getDepartments(selectedCorp)
        .then(setDepts)
        .catch(() => setError("Error loading departments"))
        .finally(() => setLoading(false));
    }
  }, [selectedCorp]);

  // Fetch municipalities when dept changes
  useEffect(() => {
    if (selectedDept) {
      setLoading(true);
      registraduria.getMunicipalities(selectedCorp, selectedDept)
        .then(setMuns)
        .catch(() => setError("Error loading municipalities"))
        .finally(() => setLoading(false));
    } else {
        setMuns([]);
    }
  }, [selectedDept, selectedCorp]);

  // Fetch zones when mun changes
  useEffect(() => {
    if (selectedMun) {
        setLoading(true);
        registraduria.getZones(selectedCorp, selectedDept, selectedMun)
            .then(setZones)
            .catch(() => setError("Error loading zones"))
            .finally(() => setLoading(false));
    } else {
        setZones([]);
    }
  }, [selectedMun, selectedCorp, selectedDept]);

  // Fetch puestos when zone changes
  useEffect(() => {
    if (selectedZone) {
        setLoading(true);
        registraduria.getPollingStations(selectedCorp, selectedDept, selectedMun, selectedZone)
            .then(setPuestos)
            .catch(() => setError("Error loading polling stations"))
            .finally(() => setLoading(false));
    } else {
        setPuestos([]);
    }
  }, [selectedZone, selectedCorp, selectedDept, selectedMun]);

  // Fetch tables when puesto changes
  useEffect(() => {
    if (selectedPuesto) {
        setLoading(true);
        registraduria.getTables(selectedCorp, selectedDept, selectedMun, selectedZone, selectedPuesto)
            .then(setTables)
            .catch(() => setError("Error loading tables"))
            .finally(() => setLoading(false));
    } else {
        setTables([]);
    }
  }, [selectedPuesto, selectedCorp, selectedDept, selectedMun, selectedZone]);

  const handleFetchE14 = () => {
    const table = tables.find(t => t.id === selectedTable);
    if (table && table.u) {
        onImageFound(table.u, `Mesa ${table.n} - ${selectedMun} (${selectedDept})`);
    } else if (selectedTable) {
        // Fallback composition if URL not in object
        onImageFound(`https://cdn-e14.registraduria.gov.co/2023/${selectedCorp}/${selectedTable}.jpg`, `Mesa ${selectedTable}`);
    }
  };

  const SelectGroup = ({ label, icon: Icon, value, options, onChange, disabled }: any) => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
        <Icon size={12} /> {label}
      </label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || options.length === 0}
        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:border-primary-500 focus:outline-none disabled:opacity-50"
      >
        <option value="">Seleccionar...</option>
        {options.map((opt: any) => (
          <option key={opt.id} value={opt.id}>{opt.n}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectGroup label="Corporación" icon={Building2} value={selectedCorp} options={corps} onChange={setSelectedCorp} />
        <SelectGroup label="Departamento" icon={MapPin} value={selectedDept} options={depts} onChange={setSelectedDept} />
        <SelectGroup label="Municipio" icon={MapPin} value={selectedMun} options={muns} onChange={setSelectedMun} disabled={!selectedDept} />
        <SelectGroup label="Zona" icon={Layers} value={selectedZone} options={zones} onChange={setSelectedZone} disabled={!selectedMun} />
        <SelectGroup label="Puesto" icon={Grid} value={selectedPuesto} options={puestos} onChange={setSelectedPuesto} disabled={!selectedZone} />
        <SelectGroup label="Mesa" icon={FileText} value={selectedTable} options={tables} onChange={setSelectedTable} disabled={!selectedPuesto} />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-primary-500 text-sm py-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Cargando datos de la Registraduría...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <button
        onClick={handleFetchE14}
        disabled={!selectedTable || loading}
        className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-bold text-white transition-all ${
          !selectedTable || loading
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
        }`}
      >
        <Download size={20} />
        <span>Importar E-14 desde Registraduría</span>
      </button>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
          <p className="text-[11px] text-blue-400 leading-relaxed">
            <strong>Nota Técnica:</strong> Esta funcionalidad utiliza la API de Divulgación de la Registraduría. Debido a restricciones de CORS, esta herramienta funciona mejor en entornos locales o con un proxy configurado. Si la descarga falla, el visor oficial puede requerir interacción manual.
          </p>
      </div>
    </div>
  );
};

export default RegistraduriaScraper;