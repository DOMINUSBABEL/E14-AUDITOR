import React from 'react';
import { NAV_ITEMS } from '../constants';
import { ShieldCheck, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full fixed left-0 top-0 z-10" data-testid="sidebar">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-primary-600 p-2 rounded-lg">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">AUDITOR<span className="text-primary-500">.AI</span></h1>
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
              <span>CPU (Ryzen 9)</span>
              <span>84%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[84%]"></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>RAM (16GB)</span>
              <span>14.8GB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-[92%]"></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;