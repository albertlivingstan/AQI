import { useState } from "react";
import { modelMetrics, solarPlants } from "../data/mockData";
import { ShieldCheck, Users, RefreshCw, Download, Sliders, Activity, Brain, Server, MessageCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminPanel() {
  const { toast } = useToast();
  const [isRetraining, setIsRetraining] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  const handleRetrainAll = () => {
    setIsRetraining(true);
    toast({
      title: "Model Retraining Initiated",
      description: "Triggered deep-learning batch retrain for all active predictor models.",
    });
    
    // Simulate API delay
    setTimeout(() => {
      setIsRetraining(false);
      toast({
        title: "Retraining Complete",
        description: "All models have been successfully updated with the latest aggregated geospatial data.",
      });
    }, 2500);
  };

  const handleExport = () => {
    // Generate mock CSV data
    const headers = "Plant Name,Location,Capacity,Current Output,Efficiency\n";
    const rows = solarPlants.map(p => `${p.name},"${p.location}",${p.capacity},${p.output},${p.efficiency}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "solaraqi_plant_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Plant registry downloaded as solaraqi_plant_export.csv",
    });
  };

  const handleTestSMS = async () => {
    setIsSendingSMS(true);
    try {
      const response = await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: "+916382357454", message: "SolarAQI Test: Admin panel connectivity verified!" })
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Backend server is unreachable. Please ensure 'node server.js' is running.");
      }

      if (!response.ok) throw new Error(data.error || 'Trigger failed');
      
      toast({
        title: "SMS Triggered",
        description: data.message,
      });
    } catch (err) {
      toast({
        title: "SMS Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSendingSMS(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
        <p className="text-xs text-slate-400 mt-0.5">System management, model controls, and platform configuration</p>
      </div>

      {/* System health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "API Uptime", value: "99.97%", icon: Server, color: "text-emerald-400" },
          { label: "Active Users", value: "12", icon: Users, color: "text-blue-400" },
          { label: "Models Running", value: "3", icon: Brain, color: "text-amber-400" },
          { label: "Avg Latency", value: "142ms", icon: Activity, color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ML Model management */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">ML Model Management</h3>
            </div>
            <button 
              onClick={handleRetrainAll}
              disabled={isRetraining}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetraining ? 'animate-spin' : ''}`} /> {isRetraining ? 'Retraining...' : 'Retrain All'}
            </button>
          </div>
          <div className="space-y-3">
            {modelMetrics.map(m => (
              <div key={m.model} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{m.model}</p>
                  <p className="text-xs text-slate-400">R² {m.r2} · RMSE {m.rmse}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    m.status === "primary" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                    m.status === "active" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                    "bg-slate-700 text-slate-300 border-slate-600"
                  }`}>{m.status}</span>
                  <button className="text-slate-500 hover:text-slate-300">
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plant management */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Plant Management</h3>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
          <div className="space-y-3">
            {solarPlants.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.location} · {p.capacity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-amber-400 font-medium">{p.output} MW</p>
                    <p className="text-xs text-slate-400">{p.efficiency}% eff.</p>
                  </div>
                  <button className="text-slate-500 hover:text-slate-300">
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* API & Security */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">API Keys & Access Control</h3>
          <div className="space-y-3">
            {[
              { name: "NASA POWER API Key", key: "nasa_••••••••••••••••f3a2", scope: "Read-only", status: "Active" },
              { name: "OpenAQ API Key", key: "oaq_••••••••••••••••9c1b", scope: "Read-only", status: "Active" },
              { name: "Internal Admin Token", key: "admin_••••••••••••••••7e4f", scope: "Full access", status: "Active" },
            ].map(k => (
              <div key={k.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{k.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{k.key}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{k.scope}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{k.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Twilio Output Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">SMS Escalation Pipeline</h3>
            </div>
          </div>
          
          <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-200">Twilio Integration Active</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  The notification layer is connected to the core pipeline. Security anomalies and harsh climate variance warnings will broadcast SMS to registered administrators.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
               <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800">
                 <span className="text-slate-400">Target Device (Verified)</span>
                 <span className="text-slate-200 font-mono">+91 6382357454</span>
               </div>
               <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800">
                 <span className="text-slate-400">Account SID</span>
                 <span className="text-slate-200 font-mono line-through opacity-70">AC7fc64...</span>
               </div>
               <div className="flex items-center justify-between text-xs py-1.5">
                 <span className="text-slate-400">Service Status</span>
                 <span className="text-emerald-400 font-medium">Listening</span>
               </div>
            </div>

            <button 
              onClick={handleTestSMS}
              disabled={isSendingSMS}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSendingSMS ? 'animate-spin' : ''}`} /> {isSendingSMS ? 'Dispatching...' : 'Dispatch Test Alert'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}