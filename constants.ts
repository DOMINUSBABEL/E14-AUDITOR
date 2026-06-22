import { ChartColumn, Server, Database, BrainCircuit, Scale } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'audit', label: 'Forensic Audit', icon: BrainCircuit },
  { id: 'dashboard', label: 'Control Center', icon: ChartColumn },
  { id: 'live', label: 'Architecture & Logs', icon: Server },
  { id: 'data', label: 'Data Lake', icon: Database },
];

// AI Configuration
export const AI_CONFIG = {
  MODEL_NAME: typeof process !== 'undefined' && process.env.GEMINI_MODEL
    ? process.env.GEMINI_MODEL
    : 'gemini-2.5-flash-latest'
};

export const MOCK_PARTIES = [
  "Iván Cepeda Castro (Pacto Histórico)", 
  "Abelardo de la Espriella (Defensores de la Patria)", 
  "Voto en Blanco", 
  "Votos Nulos", 
  "Votos no Marcados"
];

// Business Logic Configuration
export const POLITICAL_CONFIG = {
  CLIENT_NAME: "Iván Cepeda Castro (Pacto Histórico)", // The user of the software (Iván Cepeda)
  RIVALS: ["Abelardo de la Espriella (Defensores de la Patria)"], // Main rival (Abelardo de la Espriella)
  STRICT_ETHICS: false // If true, report even positive manipulation. If false, SILENT_LOG positive ones.
};

// Mock Database of Lawyers per Party (Tenant System)
export const LAWYERS_DB: Record<string, { name: string; phone: string }> = {
  "Iván Cepeda Castro (Pacto Histórico)": { name: "Dr. Gustavo Bolívar", phone: "+57 300 111 2233" },
  "Abelardo de la Espriella (Defensores de la Patria)": { name: "Dr. Hernando Herrera", phone: "+57 310 444 5566" },
  "Voto en Blanco": { name: "Equipo Jurídico General", phone: "+57 320 777 8899" },
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
