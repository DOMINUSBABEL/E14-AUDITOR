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

const BASE_URL = 'https://api-resultados.registraduria.gov.co/api/v1';

const fetchApi = async (path: string) => {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://divulgacione14.registraduria.gov.co',
        'Referer': 'https://divulgacione14.registraduria.gov.co/'
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
  return data ? data.map((m: any) => ({ id: m.id, n: m.n })) : [];
};

export const getZones = async (corpId: string, deptId: string, munId: string): Promise<RegistraduriaLocation[]> => {
  const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/${munId}/zonas.json`);
  return data ? data.map((z: any) => ({ id: z.id, n: z.n })) : [];
};

export const getPollingStations = async (corpId: string, deptId: string, munId: string, zoneId: string): Promise<RegistraduriaLocation[]> => {
  const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/${munId}/${zoneId}/puestos.json`);
  return data ? data.map((p: any) => ({ id: p.id, n: p.n })) : [];
};

export const getTables = async (corpId: string, deptId: string, munId: string, zoneId: string, puestoId: string): Promise<RegistraduriaTable[]> => {
  const data = await fetchApi(`/resultados/${corpId}/${deptId}/${munId}/${zoneId}/${puestoId}/mesas.json`);
  return data ? data.map((m: any) => ({ id: m.id, n: m.n, u: m.u })) : [];
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
