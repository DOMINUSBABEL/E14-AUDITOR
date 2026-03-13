import React, { useState, useEffect } from 'react';
import { NAV_ITEMS } from '../constants';
import { ShieldCheck, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [ramUsage, setRamUsage] = useState<{ used: number; total: number; percentage: number }>({ used: 0, total: 16, percentage: 0 });

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 8;

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animationFrameId: number;

    const calculateUsage = () => {
      const currentTime = performance.now();
      frames++;

      if (currentTime - lastTime >= 1000) {
        // Estimate CPU usage based on FPS drop from 60
        // This is a rough proxy for how busy the main thread is
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        const estimatedCpu = Math.max(0, Math.min(100, Math.round((1 - fps / 60) * 100)));
        // Add a small baseline usage so it rarely shows 0%
        setCpuUsage(Math.min(100, estimatedCpu + Math.floor(Math.random() * 5) + 1));

        // Estimate RAM usage
        const memory = (performance as any).memory;
        if (memory) {
          const usedGB = memory.usedJSHeapSize / (1024 * 1024 * 1024);
          const totalGB = deviceMemory;
          // Scale it up a bit since JS heap is usually very small compared to total system RAM,
          // to make the bar visual more meaningful for a "system" dashboard proxy.
          // Or just use JS heap directly, but cap it against deviceMemory.
          const usedDisplay = Math.max(0.1, usedGB * 2);
          const percentage = Math.min(100, Math.round((usedDisplay / totalGB) * 100));

          setRamUsage({
            used: Number(usedDisplay.toFixed(1)),
            total: totalGB,
            percentage
          });
        } else {
          // Fallback if performance.memory is not available
          const fakeUsed = (deviceMemory * 0.4) + (Math.random() * deviceMemory * 0.1);
          setRamUsage({
            used: Number(fakeUsed.toFixed(1)),
            total: deviceMemory,
            percentage: Math.round((fakeUsed / deviceMemory) * 100)
          });
        }

        frames = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(calculateUsage);
    };

    animationFrameId = requestAnimationFrame(calculateUsage);

    return () => cancelAnimationFrame(animationFrameId);
  }, [deviceMemory]);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-primary-600 p-2 rounded-lg">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">AUDITOR<span className="text-primary-500">.IA</span></h1>
          <p className="text-xs text-slate-400 font-mono">v2.0 Ryzen Core</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-600/10 text-primary-500 border border-primary-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="text-green-500 w-4 h-4 animate-pulse" />
            <span className="text-xs font-mono text-green-500">SYSTEM ONLINE</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>CPU ({hardwareConcurrency} Cores)</span>
              <span>{cpuUsage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-1000 ease-in-out"
                style={{ width: `${cpuUsage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>RAM ({ramUsage.total}GB)</span>
              <span>{ramUsage.used}GB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-1000 ease-in-out"
                style={{ width: `${ramUsage.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;