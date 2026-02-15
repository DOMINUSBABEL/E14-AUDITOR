import { ChartColumn, Server, Database, BrainCircuit, Scale } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Control Center', icon: ChartColumn },
  { id: 'live', label: 'Architecture & Logs', icon: Server },
  { id: 'audit', label: 'Forensic Audit', icon: BrainCircuit },
  { id: 'data', label: 'Data Lake', icon: Database },
];

export const MOCK_PARTIES = [
  "Pacto Histórico", "Centro Democrático", "Partido Liberal", "Partido Verde", "Cambio Radical"
];

// Business Logic Configuration
export const POLITICAL_CONFIG = {
  CLIENT_NAME: "Pacto Histórico", // The user of the software
  RIVALS: ["Centro Democrático", "Cambio Radical"], // Main rivals for logic calculation
  STRICT_ETHICS: false // If true, report even positive manipulation. If false, SILENT_LOG positive ones.
};

// Mock Database of Lawyers per Party (Tenant System)
export const LAWYERS_DB: Record<string, { name: string; phone: string }> = {
  "Pacto Histórico": { name: "Representative Pacto Histórico", phone: "+57 300 000 0000" },
  "Centro Democrático": { name: "Representative Centro Democrático", phone: "+57 300 000 0000" },
  "Partido Liberal": { name: "Representative Partido Liberal", phone: "+57 300 000 0000" },
  "Partido Verde": { name: "Representative Partido Verde", phone: "+57 300 000 0000" },
  "Cambio Radical": { name: "Representative Cambio Radical", phone: "+57 300 000 0000" },
  "Default": { name: "Equipo Jurídico General", phone: "+57 300 000 0000" }
};

export const INITIAL_METRICS = {
  totalProcessed: 12450,
  fraudDetected: 342,
  queueSize: 28500,
  activeWorkers: 128,
  cpuLoad: 85,
  ramUsage: 45
};
