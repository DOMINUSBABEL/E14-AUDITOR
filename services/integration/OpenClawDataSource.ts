import { SystemDataSource, DataSourceConfig } from '../../types/integration';
import { SystemMetrics, SystemLog, AnalyzedAct } from '../../types';

export class OpenClawDataSource implements SystemDataSource {
  private socket: WebSocket | null = null;
  private metricsCallback: ((metrics: Partial<SystemMetrics>) => void) | null = null;
  private logCallback: ((log: SystemLog) => void) | null = null;
  private actCallback: ((act: AnalyzedAct) => void) | null = null;
  private reconnectInterval: ReturnType<typeof setInterval> | null = null;

  async connect(config?: DataSourceConfig): Promise<void> {
    const endpoint = config?.endpoint || 'ws://localhost:8080/ws/auditor';
    console.log(`Connecting to OpenClaw at ${endpoint}...`);

    this.connectWebSocket(endpoint);
  }

  private connectWebSocket(endpoint: string) {
    this.socket = new WebSocket(endpoint);

    this.socket.onopen = () => {
      console.log('Connected to OpenClaw WebSocket');
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        this.handleMessage(payload);
      } catch (e) {
        console.error('Error parsing OpenClaw message:', e);
      }
    };

    this.socket.onclose = () => {
      console.log('OpenClaw WebSocket closed. Reconnecting in 5s...');
      this.socket = null;
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => {
            console.log('Attempting reconnect...');
            this.connectWebSocket(endpoint);
        }, 5000);
      }
    };

    this.socket.onerror = (error) => {
      console.error('OpenClaw WebSocket error:', error);
    };
  }

  private handleMessage(payload: any) {
    // Expected payload structure from OpenClaw adapter
    // { type: 'log' | 'metrics' | 'act', data: ... }

    switch (payload.type) {
      case 'metrics':
        if (this.metricsCallback) this.metricsCallback(payload.data);
        break;
      case 'log':
        if (this.logCallback) this.logCallback(payload.data);
        break;
      case 'act':
        if (this.actCallback) this.actCallback(payload.data);
        break;
      default:
        console.warn('Unknown message type from OpenClaw:', payload.type);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    console.log('Disconnected from OpenClawDataSource');
  }

  onMetricsUpdate(callback: (metrics: Partial<SystemMetrics>) => void): void {
    this.metricsCallback = callback;
  }

  onLogReceived(callback: (log: SystemLog) => void): void {
    this.logCallback = callback;
  }

  onActReceived(callback: (act: AnalyzedAct) => void): void {
    this.actCallback = callback;
  }
}
