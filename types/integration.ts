import { SystemMetrics, SystemLog, AnalyzedAct } from '../types';

export interface DataSourceConfig {
  sourceName: string;
  endpoint?: string;
  apiKey?: string;
  refreshInterval?: number;
}

export type DataSourceEvent =
  | { type: 'metrics', data: Partial<SystemMetrics> }
  | { type: 'log', data: SystemLog }
  | { type: 'act', data: AnalyzedAct };

export interface SystemDataSource {
  connect(config?: DataSourceConfig): Promise<void>;
  disconnect(): void;
  onMetricsUpdate(callback: (metrics: Partial<SystemMetrics>) => void): void;
  onLogReceived(callback: (log: SystemLog) => void): void;
  onActReceived(callback: (act: AnalyzedAct) => void): void;
}
