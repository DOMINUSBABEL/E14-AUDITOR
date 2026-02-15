import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LiveMonitor from './components/LiveMonitor';
import ManualAudit from './components/ManualAudit';
import DataLake from './components/DataLake';
import { SystemMetrics, SystemLog, AnalyzedAct } from './types';
import { INITIAL_METRICS, POLITICAL_CONFIG } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_METRICS);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [acts, setActs] = useState<AnalyzedAct[]>([]);

  // Initialize with some mock data so the table isn't empty
  useEffect(() => {
    const initialActs: AnalyzedAct[] = Array.from({ length: 50 }).map((_, i) => {
      const isFraud = Math.random() > 0.8;
      const date = new Date();
      date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 10000));
      
      return {
        id: crypto.randomUUID(),
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
      };
    });
    setActs(initialActs);
  }, []);

  // Simulation Logic for Real-time Data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate fluctuation
      setMetrics(prev => ({
        ...prev,
        queueSize: Math.max(0, prev.queueSize + Math.floor(Math.random() * 200) - 150), // Influx vs Processed
        totalProcessed: prev.totalProcessed + Math.floor(Math.random() * 10),
        fraudDetected: prev.fraudDetected + (Math.random() > 0.95 ? 1 : 0),
        cpuLoad: 70 + Math.random() * 25,
      }));

      // Generate random log
      const logTypes: {source: SystemLog['source'], msg: string, type: SystemLog['type']}[] = [
        { source: 'ClawdBot', msg: 'Recibido IMG-20231029-WA00.jpg', type: 'info' },
        { source: 'Redis', msg: 'Enqueued task: 3ae2-11f2', type: 'info' },
        { source: 'GeminiWorker', msg: 'Vision Analysis: No Tachones found', type: 'info' },
        { source: 'LegalEngine', msg: 'Strategic Analysis: No Action Required', type: 'success' },
        { source: 'PocketBase', msg: 'Record synced', type: 'success' },
      ];

      if (Math.random() > 0.6) {
        const randomLog = logTypes[Math.floor(Math.random() * logTypes.length)];
        const newLog: SystemLog = {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString(),
          message: randomLog.msg,
          type: randomLog.type,
          source: randomLog.source
        };
        setLogs(prev => [...prev.slice(-19), newLog]); // Keep last 20
      }

      // Occasionally add a fake act to the list
      if (Math.random() > 0.95) {
        const isFraud = Math.random() > 0.9;
        const now = new Date();
        const newAct: AnalyzedAct = {
          id: crypto.randomUUID(),
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
        // Keep a larger buffer for the data lake (100 items)
        setActs(prev => [newAct, ...prev].slice(0, 100)); 
      }

    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary-500/30 selection:text-white overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto relative">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'dashboard' && 'Control Center'}
              {activeTab === 'live' && 'Architecture & Live Logs'}
              {activeTab === 'audit' && 'Manual Forensic Audit'}
              {activeTab === 'data' && 'Data Lake (PocketBase)'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === 'dashboard' && 'Real-time monitoring of E-14 ingestion process.'}
              {activeTab === 'live' && 'Visualizing ClawdBot -> Redis -> Ryzen -> PocketBase pipeline.'}
              {activeTab === 'audit' && 'Upload specific acts for deep-dive forensic analysis.'}
              {activeTab === 'data' && 'Historical records, export tools, and long-term storage view.'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-500 font-mono">SERVER TIME</p>
              <p className="text-sm font-mono text-primary-400">{new Date().toLocaleTimeString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">
              AD
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard metrics={metrics} acts={acts} />}
        {activeTab === 'live' && <LiveMonitor logs={logs} />}
        {activeTab === 'audit' && <ManualAudit />}
        {activeTab === 'data' && <DataLake acts={acts} />}
      </main>
    </div>
  );
};

export default App;