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
}

const BASE_URL = 'https://api-resultados.registraduria.gov.co/api/v1';

// Note: Registraduría API often requires specific headers or has CORS restrictions.
// In a real browser environment, you might need a proxy or use Pinchtab if available.
const fetchApi = async (path: string) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Accept': 'application/json',
      'Origin': 'https://divulgacione14.registraduria.gov.co',
      'Referer': 'https://divulgacione14.registraduria.gov.co/'
    }
  });
  if (!response.ok) throw new Error(`Error fetching from Registraduria: ${response.statusText}`);
  return response.json();
};

export const getCorporations = async (): Promise<RegistraduriaCorporation[]> => {
  // Mocking the structure based on common Registraduría API
  // Usually it's in a config file or a specific endpoint
  return [
    { id: 'ALC', n: 'Alcalde' },
    { id: 'GOB', n: 'Gobernador' },
    { id: 'CON', n: 'Concejo' },
    { id: 'ASA', n: 'Asamblea' },
    { id: 'JAL', n: 'JAL' }
  ];
};

export const getDepartments = async (corpId: string): Promise<RegistraduriaLocation[]> => {
  // Endpoint: /resultados/{corpId}/00.json (00 is the root for departments)
  // Actually, they often use /config/mapas/{corpId}/departamentos.json
  try {
    const data = await fetchApi(`/config/mapas/${corpId}/departamentos.json`);
    return data.map((d: any) => ({ id: d.id, n: d.n }));
  } catch (e) {
    // Fallback/Mock for development
    return [
      { id: '01', n: 'ANTIOQUIA' },
      { id: '11', n: 'BOGOTA D.C.' },
      { id: '27', n: 'VALLE' }
    ];
  }
};

export const getMunicipalities = async (corpId: string, deptId: string): Promise<RegistraduriaLocation[]> => {
  try {
    const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/municipios.json`);
    return data.map((m: any) => ({ id: m.id, n: m.n }));
  } catch (e) {
    return [
      { id: '001', n: 'MUNICIPIO 1' },
      { id: '002', n: 'MUNICIPIO 2' }
    ];
  }
};

export const getZones = async (corpId: string, deptId: string, munId: string): Promise<RegistraduriaLocation[]> => {
  try {
    const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/${munId}/zonas.json`);
    return data.map((z: any) => ({ id: z.id, n: z.n }));
  } catch (e) {
    return [{ id: '01', n: 'ZONA 01' }];
  }
};

export const getPollingStations = async (corpId: string, deptId: string, munId: string, zoneId: string): Promise<RegistraduriaLocation[]> => {
  try {
    const data = await fetchApi(`/config/mapas/${corpId}/${deptId}/${munId}/${zoneId}/puestos.json`);
    return data.map((p: any) => ({ id: p.id, n: p.n }));
  } catch (e) {
    return [{ id: '01', n: 'PUESTO 01' }];
  }
};

export const getTables = async (corpId: string, deptId: string, munId: string, zoneId: string, puestoId: string): Promise<RegistraduriaTable[]> => {
  try {
    // This is the tricky one, often it's /e14/ or within the results
    const data = await fetchApi(`/resultados/${corpId}/${deptId}/${munId}/${zoneId}/${puestoId}/mesas.json`);
    return data.map((m: any) => ({ id: m.id, n: m.n, u: m.u }));
  } catch (e) {
    return [{ id: '1', n: 'MESA 1', u: 'https://ejemplo.com/e14_mesa1.jpg' }];
  }
};

export const getE14ImageUrl = async (corpId: string, tableId: string): Promise<string> => {
    // Usually the URL is composed of parts
    // https://storage.googleapis.com/e14-imagenes/2023/.../E14_GEN_...jpg
    // But we expect the tables endpoint to provide it or at least the path
    return `https://cdn-e14.registraduria.gov.co/2023/${corpId}/${tableId}.jpg`;
}
