import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LiveMonitor from './components/LiveMonitor';
import ManualAudit from './components/ManualAudit';
import DataLake from './components/DataLake';
import { useSystemData } from './hooks/useSystemData';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { metrics, logs, acts } = useSystemData();

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
