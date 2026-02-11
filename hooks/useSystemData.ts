import { useState, useEffect, useRef } from 'react';
import { SystemMetrics, SystemLog, AnalyzedAct } from '../types';
import { INITIAL_METRICS } from '../constants';
import { SystemDataSource } from '../types/integration';
import { MockDataSource } from '../services/integration/MockDataSource';
import { OpenClawDataSource } from '../services/integration/OpenClawDataSource';

// Configuration: Switch between Mock and Real Data Source
// In a real app, this would be controlled by an environment variable.
const USE_MOCK = true;

export const useSystemData = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_METRICS);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [acts, setActs] = useState<AnalyzedAct[]>([]);

  const dataSourceRef = useRef<SystemDataSource | null>(null);

  useEffect(() => {
    // Initialize Data Source
    const DataSourceClass = USE_MOCK ? MockDataSource : OpenClawDataSource;
    const dataSource = new DataSourceClass();
    dataSourceRef.current = dataSource;

    // Set up listeners
    dataSource.onMetricsUpdate((newMetrics) => {
      setMetrics(prev => ({ ...prev, ...newMetrics }));
    });

    dataSource.onLogReceived((newLog) => {
      setLogs(prev => {
        // Keep only the last 20 logs
        const updatedLogs = [...prev, newLog];
        return updatedLogs.slice(-20);
      });
    });

    dataSource.onActReceived((newAct) => {
      setActs(prev => {
        // Keep only the last 100 acts
        const updatedActs = [newAct, ...prev];
        return updatedActs.slice(0, 100);
      });
    });

    // Connect
    dataSource.connect({ sourceName: USE_MOCK ? 'Simulation' : 'OpenClaw' });

    // Cleanup
    return () => {
      dataSource.disconnect();
    };
  }, []);

  return { metrics, logs, acts };
};
