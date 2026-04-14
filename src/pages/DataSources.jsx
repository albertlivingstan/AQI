import { useState, useEffect } from "react";
import { dataSources as initialSources } from "../data/mockData";
import { Database, Wifi, WifiOff, AlertTriangle, RefreshCw, Plus, Satellite, Thermometer, Cpu, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const typeIcon = { Satellite: Satellite, "AQI Sensor": Wifi, Weather: Thermometer, IoT: Cpu };
const statusConfig = {
  active: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", label: "Active" },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400", label: "Warning" },
  offline: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400", label: "Offline" },
};

export default function DataSources() {
  const { toast } = useToast();
  const [sources, setSources] = useState(initialSources);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "API", url: "" });

  useEffect(() => {
    fetch('/api/sources')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSources(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleAddSource = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to add source');
      
      // Update local state with the new source
      setSources(prev => [{
        id: data.source.id,
        name: data.source.name,
        type: data.source.type,
        status: "active",
        lastSync: "Just now",
        records: 0
      }, ...prev]);
      
      toast({
        title: "Success",
        description: data.message || 'Source added successfully',
      });
      setIsModalOpen(false);
      setFormData({ name: "", type: "API", url: "" }); // Reset form
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Data Sources</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage and monitor all connected data feeds</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Source
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active", count: sources.filter(d => d.status === "active").length, color: "text-emerald-400", icon: Wifi },
          { label: "Warning", count: sources.filter(d => d.status === "warning").length, color: "text-amber-400", icon: AlertTriangle },
          { label: "Offline", count: sources.filter(d => d.status === "offline").length, color: "text-red-400", icon: WifiOff },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            </div>
            <p className="text-xs text-slate-400">{s.label} sources</p>
          </div>
        ))}
      </div>

      {/* Source list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Connected Sources</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {sources.map(source => {
            const cfg = statusConfig[source.status] || statusConfig.offline;
            const Icon = typeIcon[source.type] || Database;
            return (
              <div key={source.id} className="flex items-center justify-between px-4 py-4 hover:bg-slate-800/40 transition-colors gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{source.name}</p>
                    <p className="text-xs text-slate-400">{source.type} · {source.records.toLocaleString()} records</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-400">Last sync</p>
                    <p className="text-xs text-slate-300">{source.lastSync}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border font-medium ${cfg.bg} ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${source.status === "active" ? "animate-pulse" : ""}`} />
                    {cfg.label}
                  </span>
                  <button className="text-slate-500 hover:text-slate-300 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Add New Data Source</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSource} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Source Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. AWS Weather Station"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Source Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Satellite">Satellite Data</option>
                  <option value="AQI Sensor">AQI Sensor Network</option>
                  <option value="Weather">Weather API</option>
                  <option value="IoT">IoT Ground Station</option>
                  <option value="API">Custom API REST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Endpoint URL (Optional)</label>
                <input 
                  type="text" 
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="https://api.example.com/v1/data"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Connect Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}