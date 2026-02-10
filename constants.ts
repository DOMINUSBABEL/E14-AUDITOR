import { ChartColumn, Server, Database, BrainCircuit } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Control Center', icon: ChartColumn },
  { id: 'live', label: 'Architecture View', icon: Server },
  { id: 'audit', label: 'Manual Audit', icon: BrainCircuit },
  { id: 'data', label: 'Data Lake', icon: Database },
];

export const MOCK_PARTIES = [
  "Partido A", "Partido B", "Partido C", "Voto en Blanco", "Nulos"
];

// Mock data generation for initial state
export const INITIAL_METRICS = {
  totalProcessed: 12450,
  fraudDetected: 342,
  queueSize: 28500, // Representing the "300.000" load
  activeWorkers: 128, // High concurrency on Ryzen
  cpuLoad: 85,
  ramUsage: 14.2, // GB
};