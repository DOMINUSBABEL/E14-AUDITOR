import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SystemMetrics, AnalyzedAct } from '../types';
import { AlertTriangle, CheckCircle, Clock, FileText, Bell, Settings, X, Mail, MessageSquare, LucideIcon } from 'lucide-react';

interface DashboardProps {
  metrics: SystemMetrics;
  acts: AnalyzedAct[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

const Dashboard: React.FC<DashboardProps> = ({ metrics, acts }) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [alerts, setAlerts] = useState({
    email: true,
    sms: false,
    triggers: {
      highLoad: true,
      fraud: true,
      systemOffline: true
    },
    recipient: 'admin@auditor-ai.com'
  });

  // Mock data for charts derived from simulated acts
  const fraudData = [
    { name: 'Valid', value: metrics.totalProcessed - metrics.fraudDetected },
    { name: 'Fraud/Error', value: metrics.fraudDetected },
  ];

  const partyData = [
    { name: 'P. Liberal', votes: 4500 },
    { name: 'P. Cons.', votes: 3200 },
    { name: 'P. Verde', votes: 2100 },
    { name: 'P. Alt.', votes: 1800 },
    { name: 'Blanco', votes: 500 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Header Actions */}
      <div className="absolute top-[-3.5rem] right-20 hidden md:block">
        <button 
          onClick={() => setShowConfigModal(true)}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm border border-slate-700 transition-colors"
        >
          <Bell size={14} />
          <span>Configure Alerts</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Processed" 
          value={metrics.totalProcessed.toLocaleString()} 
          icon={FileText} 
          color="text-blue-500" 
          sub="Acts Analyzed"
        />
        <MetricCard 
          title="Fraud Detected" 
          value={metrics.fraudDetected.toLocaleString()} 
          icon={AlertTriangle} 
          color="text-red-500" 
          sub="Inconsistencies"
        />
        <MetricCard 
          title="Queue Load" 
          value={metrics.queueSize.toLocaleString()} 
          icon={Clock} 
          color="text-amber-500" 
          sub="Pending in Redis"
        />
        <MetricCard 
          title="Success Rate" 
          value="97.4%" 
          icon={CheckCircle} 
          color="text-green-500" 
          sub="Extraction Accuracy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Vote Distribution (Live)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} 
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Audit Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fraudData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {fraudData.map((entry, index) => (
              <div key={index} className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Recent Alerts</h3>
          <span className="bg-red-500/10 text-red-500 text-xs px-2 py-1 rounded border border-red-500/20">Live Updates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-mono text-xs">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Mesa ID</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Discrepancy</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {acts.filter(a => a.is_fraud).slice(0, 5).map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono">{act.timestamp}</td>
                  <td className="px-6 py-4 text-white font-medium">{act.mesa}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center text-red-400 bg-red-400/10 px-2 py-1 rounded w-fit text-xs border border-red-400/20">
                      <AlertTriangle size={12} className="mr-1" />
                      FRAUD SUSPECT
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    Calc: <span className="text-white">{act.total_calculated}</span> vs Decl: <span className="text-white">{act.total_declared}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-400 hover:text-blue-300 text-xs underline">Review Image</button>
                  </td>
                </tr>
              ))}
              {acts.filter(a => a.is_fraud).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No fraud alerts detected in current batch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Settings className="mr-2 text-primary-500" size={20} />
                Alert Configuration
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Channels</h4>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500/10 p-2 rounded text-blue-500"><Mail size={18} /></div>
                    <span className="text-slate-200">Email Notifications</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={alerts.email} onChange={e => setAlerts({...alerts, email: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500/10 p-2 rounded text-green-500"><MessageSquare size={18} /></div>
                    <span className="text-slate-200">SMS / WhatsApp</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={alerts.sms} onChange={e => setAlerts({...alerts, sms: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Triggers</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={alerts.triggers.highLoad} onChange={e => setAlerts({...alerts, triggers: {...alerts.triggers, highLoad: e.target.checked}})} className="rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-primary-600" />
                    <span>High Queue Load (&gt;50k)</span>
                  </label>
                  <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={alerts.triggers.fraud} onChange={e => setAlerts({...alerts, triggers: {...alerts.triggers, fraud: e.target.checked}})} className="rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-primary-600" />
                    <span>Fraud Detected (Immediate)</span>
                  </label>
                  <label className="flex items-center space-x-3 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={alerts.triggers.systemOffline} onChange={e => setAlerts({...alerts, triggers: {...alerts.triggers, systemOffline: e.target.checked}})} className="rounded border-slate-700 bg-slate-800 text-primary-600 focus:ring-primary-600" />
                    <span>Worker Offline / Error</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Recipient</label>
                <input 
                  type="text" 
                  value={alerts.recipient} 
                  onChange={e => setAlerts({...alerts, recipient: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                />
              </div>

            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setShowConfigModal(false)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  sub: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, sub }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h2 className="text-3xl font-bold text-white">{value}</h2>
        <p className="text-slate-500 text-xs mt-2 font-mono">{sub}</p>
      </div>
      <div className={`p-3 rounded-lg bg-slate-800 ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default Dashboard;