import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SystemLog } from '../types';
import { Database, Server, Cpu, MessageSquare, ArrowRight, FilterX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LiveMonitorProps {
  logs: SystemLog[];
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, selectedSource]);

  const filteredLogs = useMemo(() => selectedSource
    ? logs.filter(log => log.source === selectedSource)
    : logs, [logs, selectedSource]);

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
          sourceFilter="ClawdBot"
          selectedSource={selectedSource}
          onClick={setSelectedSource}
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
          sourceFilter="Redis"
          selectedSource={selectedSource}
          onClick={setSelectedSource}
        />
        <div className="flex items-center justify-center text-slate-600">
             <ArrowRight className="animate-pulse" />
        </div>
        <NodeCard 
          icon={Cpu} 
          title="Gemini Worker" 
          status="Processing" 
          color="text-blue-500" 
          detail="Gemini Async Tasks"
          sourceFilter="GeminiWorker"
          selectedSource={selectedSource}
          onClick={setSelectedSource}
        />
        <div className="flex items-center justify-center text-slate-600">
             <ArrowRight className="animate-pulse" />
        </div>
        <NodeCard 
          icon={Server} 
          title="Legal Engine" 
          status="Analyzing" 
          color="text-purple-500" 
          detail="Strategic Logic"
          sourceFilter="LegalEngine"
          selectedSource={selectedSource}
          onClick={setSelectedSource}
        />
      </div>

      {/* Terminal / Log Output */}
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-sm overflow-hidden flex flex-col shadow-2xl transition-all">
        <div className="flex items-center justify-between mb-2 border-b border-slate-900 pb-2">
            <div className="flex space-x-2 items-center">
                <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-slate-500 text-xs">
                  {selectedSource ? `filter: source == "${selectedSource}"` : 'tail -f system.log'}
                </span>
            </div>
            {selectedSource && (
              <button 
                onClick={() => setSelectedSource(null)}
                className="text-xs flex items-center text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
              >
                <FilterX size={12} className="mr-1" />
                Clear Filter
              </button>
            )}
        </div>
        <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-1 pr-2 scroll-smooth">
            {filteredLogs.length === 0 && (
              <p className="text-slate-600 italic p-4 text-center opacity-50">
                {selectedSource ? `No logs found for ${selectedSource}` : 'Waiting for incoming signals...'}
              </p>
            )}
            {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 hover:bg-slate-900/50 p-0.5 rounded animate-in fade-in duration-300">
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`shrink-0 font-bold w-28 text-right pr-2 select-none cursor-pointer hover:underline ${
                        log.source === 'ClawdBot' ? 'text-green-600' :
                        log.source === 'Redis' ? 'text-red-500' :
                        log.source === 'GeminiWorker' ? 'text-blue-400' : 
                        log.source === 'LegalEngine' ? 'text-pink-500' : 'text-purple-400'
                    }`} onClick={() => setSelectedSource(log.source)}>
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

interface NodeCardProps {
  icon: LucideIcon;
  title: string;
  status: string;
  color: string;
  detail: string;
  sourceFilter: string;
  selectedSource: string | null;
  onClick: (source: string | null) => void;
}

const NodeCard = ({ icon: Icon, title, status, color, detail, sourceFilter, selectedSource, onClick }: NodeCardProps) => {
  const isSelected = selectedSource === sourceFilter;
  const isInactive = selectedSource && !isSelected;

  return (
    <button 
      onClick={() => onClick(isSelected ? null : sourceFilter)}
      className={`
        bg-slate-900 border p-4 rounded-lg flex flex-col items-center text-center shadow-lg relative overflow-hidden group transition-all duration-300
        ${isSelected ? 'border-primary-500 ring-1 ring-primary-500 scale-105 z-10' : 'border-slate-800 hover:border-slate-700'}
        ${isInactive ? 'opacity-40 grayscale' : 'opacity-100'}
      `}
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${color.replace('text', 'bg')}`}></div>
      <div className={`p-3 rounded-full bg-slate-800 mb-2 ${color} ${isSelected ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
          <Icon size={20} />
      </div>
      <h3 className="text-slate-200 font-bold text-sm">{title}</h3>
      <p className="text-xs text-slate-500 mt-1">{status}</p>
      <p className="text-[10px] text-slate-600 font-mono mt-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">{detail}</p>
      
      {isSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full animate-ping" />
      )}
    </button>
  );
};

export default LiveMonitor;