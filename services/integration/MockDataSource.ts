import { SystemDataSource, DataSourceConfig } from '../../types/integration';
import { SystemMetrics, SystemLog, AnalyzedAct } from '../../types';
import { POLITICAL_CONFIG, INITIAL_METRICS } from '../../constants';

export class MockDataSource implements SystemDataSource {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private metricsCallback: ((metrics: Partial<SystemMetrics>) => void) | null = null;
  private logCallback: ((log: SystemLog) => void) | null = null;
  private actCallback: ((act: AnalyzedAct) => void) | null = null;

  private currentMetrics: SystemMetrics = INITIAL_METRICS;

  async connect(config?: DataSourceConfig): Promise<void> {
    console.log(`Connected to MockDataSource: ${config?.sourceName || 'Default'}`);
    this.startSimulation();
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Disconnected from MockDataSource');
  }

  onMetricsUpdate(callback: (metrics: Partial<SystemMetrics>) => void): void {
    this.metricsCallback = callback;
  }

  onLogReceived(callback: (log: SystemLog) => void): void {
    this.logCallback = callback;
  }

  onActReceived(callback: (act: AnalyzedAct) => void): void {
    this.actCallback = callback;
    // Emit initial acts immediately upon subscription
    this.emitInitialActs(callback);
  }

  private emitInitialActs(callback: (act: AnalyzedAct) => void) {
      const initialActs: AnalyzedAct[] = Array.from({ length: 50 }).map((_, i) => {
      const isFraud = Math.random() > 0.8;
      const date = new Date();
      date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 10000));

      const intent: 'PERJUICIO' | 'BENEFICIO' | 'NEUTRO' = isFraud ? 'PERJUICIO' : 'NEUTRO';

      return {
        id: Math.random().toString(36).substr(2, 9),
        mesa: `MESA-${Math.floor(1000 + Math.random() * 9000)}`,
        zona: `ZONA-${Math.floor(1 + Math.random() * 20).toString().padStart(2, '0')}`,
        votes: [],
        total_calculated: 100,
        total_declared: isFraud ? 120 : 100,
        is_fraud: isFraud,
        is_legible: true,
        forensic_analysis: isFraud ? [{
          type: 'TACHON',
          description: 'Detected erasure on cell 4',
          affected_party: POLITICAL_CONFIG.CLIENT_NAME,
          original_value_inferred: 50,
          final_value_legible: 20,
          confidence: 0.95
        }] : [],
        strategic_analysis: isFraud ? {
          intent: 'PERJUICIO',
          impact_score: -30,
          recommendation: 'IMPUGNAR',
          legal_grounding: 'Art 192. Modificación ilegal.'
        } : undefined,
        timestamp: date.toLocaleTimeString(),
        isoTimestamp: date.toISOString(),
        status: 'completed'
      } as AnalyzedAct; // Type assertion to ensure it matches
    });

    initialActs.forEach(act => callback(act));
  }

  private startSimulation() {
    this.intervalId = setInterval(() => {
      // 1. Update Metrics
      this.currentMetrics = {
        ...this.currentMetrics,
        queueSize: Math.max(0, this.currentMetrics.queueSize + Math.floor(Math.random() * 200) - 150),
        totalProcessed: this.currentMetrics.totalProcessed + Math.floor(Math.random() * 10),
        fraudDetected: this.currentMetrics.fraudDetected + (Math.random() > 0.95 ? 1 : 0),
        cpuLoad: 70 + Math.random() * 25,
      };

      if (this.metricsCallback) {
        this.metricsCallback(this.currentMetrics);
      }

      // 2. Generate Random Log
      const logTypes: {source: SystemLog['source'], msg: string, type: SystemLog['type']}[] = [
        { source: 'ClawdBot', msg: 'Recibido IMG-20231029-WA00.jpg', type: 'info' },
        { source: 'Redis', msg: 'Enqueued task: 3ae2-11f2', type: 'info' },
        { source: 'GeminiWorker', msg: 'Vision Analysis: No Tachones found', type: 'info' },
        { source: 'LegalEngine', msg: 'Strategic Analysis: No Action Required', type: 'success' },
        { source: 'PocketBase', msg: 'Record synced', type: 'success' },
      ];

      if (Math.random() > 0.6 && this.logCallback) {
        const randomLog = logTypes[Math.floor(Math.random() * logTypes.length)];
        const newLog: SystemLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          message: randomLog.msg,
          type: randomLog.type,
          source: randomLog.source
        };
        this.logCallback(newLog);
      }

      // 3. Occasionally add a fake act
      if (Math.random() > 0.95 && this.actCallback) {
        const isFraud = Math.random() > 0.9;
        const now = new Date();
        const newAct: AnalyzedAct = {
          id: Math.random().toString(36).substr(2, 9),
          mesa: `MESA-${Math.floor(1000 + Math.random() * 9000)}`,
          zona: `ZONA-${Math.floor(1 + Math.random() * 20).toString().padStart(2, '0')}`,
          votes: [],
          total_calculated: 100,
          total_declared: isFraud ? 120 : 100,
          is_fraud: isFraud,
          is_legible: true,
          forensic_analysis: isFraud ? [{
             type: 'ENMENDADURA',
             description: 'Value changed from 10 to 80',
             affected_party: 'Centro Democrático',
             original_value_inferred: 10,
             final_value_legible: 80,
             confidence: 0.88
          }] : [],
          strategic_analysis: isFraud ? {
             intent: 'PERJUICIO', // Rival gained votes
             impact_score: -70,
             recommendation: 'IMPUGNAR',
             legal_grounding: 'Fraude aritmético evidente.'
          } : undefined,
          timestamp: now.toLocaleTimeString(),
          isoTimestamp: now.toISOString(),
          status: 'completed'
        };
        this.actCallback(newAct);
      }

    }, 800);
  }
}
