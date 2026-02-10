export interface VoteCount {
  party: string;
  count: number;
}

export interface AnalyzedAct {
  id: string;
  mesa: string;
  zona: string;
  votes: VoteCount[];
  total_calculated: number;
  total_declared: number;
  is_fraud: boolean;
  timestamp: string;
  isoTimestamp: string; // Added for date filtering
  image_url?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  processing_time_ms?: number;
}

export interface SystemMetrics {
  totalProcessed: number;
  fraudDetected: number;
  queueSize: number;
  activeWorkers: number;
  cpuLoad: number; // Simulated Ryzen 9 load
  ramUsage: number; // Simulated RAM usage
}

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface SystemLog {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
  source: 'ClawdBot' | 'Redis' | 'GeminiWorker' | 'PocketBase';
}