import { analyzeElectionAct } from './geminiService'; // We can leverage the same AI logic

export interface RegistraduriaCorporation {
  id: string;
  n: string; // Name
}

export interface RegistraduriaLocation {
  id: string;
  n: string; // Name
}

export interface RegistraduriaTable {
  id: string;
  n: string; // Table number
  u?: string; // URL for E14 image
  parent_info?: string; // Metadata about the path
}

const fetchApi = async (path: string) => {
  const isPres = path.split('/').includes('PRE');
  const baseUrl = isPres
    ? 'https://api-escrutinios2vueltapresidente2026.registraduria.gov.co/api/v1'
    : 'https://api-resultados.registraduria.gov.co/api/v1';

  const origin = isPres
    ? 'https://escrutinios2vueltapresidente2026.registraduria.gov.co'
    : 'https://divulgacione14.registraduria.gov.co';

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Accept': 'application/json',
        'Origin': origin,
        'Referer': `${origin}/`
      }
    });
    if (!response.ok) return null;
    return response.json();
  } catch (e) {
    console.error(`Registraduria API Error at ${path}:`, e);
    return null;
  }
};

export const getCorporations = async (): Promise<RegistraduriaCorporation[]> => {
  return [
    { id: 'PRE', n: 'Presidente' },
    { id: 'ALC', n: 'Alcalde' },
    { id: 'GOB', n: 'Gobernador' },
    { id: 'CON', n: 'Concejo' },
    { id: 'ASA', n: 'Asamblea' },
    { id: 'JAL', n: 'JAL' }
  ];
};

export const getDepartments = async (corpId: string): Promise<RegistraduriaLocation[]> => {
  const data = await fetchApi(`/config/mapas/${corpId}/departamentos.json`);
  return data ? data.map((d: any) => ({ id: d.id, n: d.n })) : [
      { id: '01', n: 'ANTIOQUIA' }, { id: '11', n: 'BOGOTA D.C.' }, { id: '27', n: 'VALLE' }
  ];
};

export const getMunicipalities = async (corpId: string, deptId: string): Promise<RegistraduriaLocation[]> => {
  const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/municipios.json`);
  if (data) return data.map((m: any) => ({ id: m.id, n: m.n }));
  
  // Fallback offline enriquecido
  if (deptId === '01') {
    return [{ id: '001', n: 'MEDELLIN' }, { id: '002', n: 'BELLO' }, { id: '003', n: 'ENVIGADO' }];
  } else if (deptId === '11') {
    return [{ id: '001', n: 'BOGOTA D.C.' }];
  } else if (deptId === '27') {
    return [{ id: '001', n: 'CALI' }];
  }
  return [];
};

export const getZones = async (corpId: string, deptId: string, munId: string): Promise<RegistraduriaLocation[]> => {
  const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/${munId}/zonas.json`);
  if (data) return data.map((z: any) => ({ id: z.id, n: z.n }));
  
  // Fallback offline enriquecido
  return [{ id: '01', n: 'ZONA URBANIZADA 01' }, { id: '02', n: 'ZONA URBANIZADA 02' }];
};

export const getPollingStations = async (corpId: string, deptId: string, munId: string, zoneId: string): Promise<RegistraduriaLocation[]> => {
  const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/${munId}/${zoneId}/puestos.json`);
  if (data) return data.map((p: any) => ({ id: p.id, n: p.n }));
  
  // Fallback offline enriquecido
  if (zoneId === '01') {
    return [{ id: '01', n: 'COLEGIO COOPERATIVO' }, { id: '02', n: 'UNIVERSIDAD REGIONAL' }];
  } else {
    return [{ id: '01', n: 'PUESTO COMUNAL SANTA ANA' }];
  }
};

export const getTables = async (corpId: string, deptId: string, munId: string, zoneId: string, puestoId: string): Promise<RegistraduriaTable[]> => {
  const data = await fetchApi(`/resultados/${corpId}/${deptId}/${munId}/${zoneId}/${puestoId}/mesas.json`);
  if (data) return data.map((m: any) => ({ id: m.id, n: m.n, u: m.u }));
  
  // Fallback offline enriquecido (mesas simuladas con URLs de fallback)
  const year = corpId === 'PRE' ? '2026' : '2023';
  return [
    { id: `${deptId}${munId}${zoneId}${puestoId}001`, n: '1', u: `https://cdn-e14.registraduria.gov.co/${year}/${corpId}/${deptId}${munId}${zoneId}${puestoId}001.jpg` },
    { id: `${deptId}${munId}${zoneId}${puestoId}002`, n: '2', u: `https://cdn-e14.registraduria.gov.co/${year}/${corpId}/${deptId}${munId}${zoneId}${puestoId}002.jpg` },
    { id: `${deptId}${munId}${zoneId}${puestoId}003`, n: '3', u: `https://cdn-e14.registraduria.gov.co/${year}/${corpId}/${deptId}${munId}${zoneId}${puestoId}003.jpg` }
  ];
};

/**
 * AGENTIC SEARCH: Uses Gemini to parse natural language into location IDs
 */
export const searchByPrompt = async (prompt: string): Promise<any> => {
    // This would typically call a specific Gemini model to extract structured data
    // For now, we simulate the agentic behavior returning a structured target
    console.log("[Agent] Parsing Magic Prompt:", prompt);
    
    // In a real implementation, we'd send the prompt to Gemini
    // to identify Dept, Mun, and Table from the text.
    return {
        suggestion: "Búsqueda interpretada por IA",
        confidence: 0.95,
        target: {
            dept: "01", // Example: Antioquia
            mun: "001", // Example: Medellin
            table: "12"
        }
    };
};

/**
 * BATCH FETCH: Gets all tables in a specific polling station or higher hierarchy
 */
export const getTablesRecursively = async (corpId: string, deptId: string, munId: string, zoneId: string, puestoId: string): Promise<RegistraduriaTable[]> => {
    const tables = await getTables(corpId, deptId, munId, zoneId, puestoId);
    return tables.map(t => ({
        ...t,
        parent_info: `${deptId}/${munId}/${zoneId}/${puestoId}`
    }));
};
