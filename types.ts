export interface VoteCount {
  party: string;
  count: number;
}

export interface ForensicDetail {
  type: 'TACHON' | 'ENMENDADURA' | 'CALIGRAFIA' | 'NONE';
  description: string;
  affected_party: string;
  original_value_inferred: number | null; // The "Before"
  final_value_legible: number; // The "After"
  confidence: number; // 0-1
}

export interface StrategicAnalysis {
  intent: 'BENEFICIO' | 'PERJUICIO' | 'NEUTRO';
  impact_score: number; // Positive (votes gained) or Negative (votes lost) relative to Client
  recommendation: 'IMPUGNAR' | 'RECONTEO' | 'SILENT_LOG' | 'VALIDAR';
  legal_grounding?: string; // e.g. "Alteración documento público Art X"
}

export interface AssignedLawyer {
  name: string;
  phone: string;
  team: string; // Party they represent
}

export interface AnalyzedAct {
  id: string;
  mesa: string;
  zona: string;
  votes: VoteCount[];
  total_calculated: number;
  total_declared: number;
  
  // Vision Analysis
  is_legible: boolean;
  is_fraud: boolean;
  
  // Advanced Forensic & Logic
  forensic_analysis: ForensicDetail[];
  strategic_analysis?: StrategicAnalysis;
  
  // Dynamic Assignment
  winning_party?: string;
  assigned_lawyer?: AssignedLawyer;

  timestamp: string;
  isoTimestamp: string;
  image_url?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  processing_time_ms?: number;
}

export interface SystemMetrics {
  totalProcessed: number;
  fraudDetected: number;
  queueSize: number;
  activeWorkers: number;
  cpuLoad: number;
  ramUsage: number;
}

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface SystemLog {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
  source: 'ClawdBot' | 'Redis' | 'GeminiWorker' | 'PocketBase' | 'LegalEngine';
}