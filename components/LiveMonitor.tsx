import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';
import { Database, Server, Cpu, MessageSquare, ArrowRight } from 'lucide-react';

interface LiveMonitorProps {
  logs: SystemLog[];
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Architecture Diagram Visualization */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <NodeCard 
          icon={MessageSquare} 
          title="WhatsApp (ClawdBot)" 
          status="Active" 
          color="text-green-500" 
          detail="Ingesting 150 msg/sec"
        />
        <div className="flex items-center justify-center text-slate-600">
            <ArrowRight className="animate-pulse" />
        </div>
        <NodeCard 
          icon={Database} 
          title="Redis Queue" 
          status="Buffering" 
          color="text-red-500" 
          detail="Delay Buffer (300k)"
        />
        <div className="flex items-center justify-center text-slate-600">
             <ArrowRight className="animate-pulse" />
        </div>
        <NodeCard 
          icon={Cpu} 
          title="Ryzen 9 Worker" 
          status="Processing" 
          color="text-blue-500" 
          detail="Gemini Async Tasks"
        />
        <div className="flex items-center justify-center text-slate-600">
             <ArrowRight className="animate-pulse" />
        </div>
        <NodeCard 
          icon={Server} 
          title="PocketBase" 
          status="Syncing" 
          color="text-purple-500" 
          detail="Reactive DB"
        />
      </div>

      {/* Terminal / Log Output */}
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-sm overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-2 border-b border-slate-900 pb-2">
            <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-slate-500 text-xs">system_tail.log</span>
        </div>
        <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-1 pr-2">
            {logs.length === 0 && <p className="text-slate-600 italic">Waiting for incoming signals...</p>}
            {logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 hover:bg-slate-900/50 p-0.5 rounded">
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span className={`shrink-0 font-bold w-24 ${
                        log.source === 'ClawdBot' ? 'text-green-600' :
                        log.source === 'Redis' ? 'text-red-500' :
                        log.source === 'GeminiWorker' ? 'text-blue-400' : 'text-purple-400'
                    }`}>
                        {log.source}:
                    </span>
                    <span className={`${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'
                    }`}>
                        {log.message}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const NodeCard = ({ icon: Icon, title, status, color, detail }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col items-center text-center shadow-lg relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-full h-1 ${color.replace('text', 'bg')}`}></div>
    <div className={`p-3 rounded-full bg-slate-800 mb-2 ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
    </div>
    <h3 className="text-slate-200 font-bold text-sm">{title}</h3>
    <p className="text-xs text-slate-500 mt-1">{status}</p>
    <p className="text-[10px] text-slate-600 font-mono mt-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">{detail}</p>
  </div>
);

export default LiveMonitor;