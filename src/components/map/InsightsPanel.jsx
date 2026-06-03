import { useState, useEffect } from "react";
import { BarChart2, Sparkles, TrendingDown, Activity, Info, AlertTriangle, CloudRain, SunMedium } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const mockTimeSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  radiation: Math.round(200 + Math.random() * 400),
  aqi: Math.round(30 + Math.random() * 80),
}));

const mockScatter = Array.from({ length: 30 }, () => ({
  aqi: Math.round(20 + Math.random() * 150),
  output: parseFloat((5 - (Math.random() * 4)).toFixed(2)),
  z: 10,
}));

const aiInsights = [
  { icon: AlertTriangle, text: "High PM2.5 caused ~18% reduction in solar efficiency this week.", severity: "warning" },
  { icon: SunMedium, text: "Optimal solar conditions forecasted for tomorrow 10:00–14:00.", severity: "success" },
  { icon: CloudRain, text: "Cloud cover impact is higher than AQI today (−23% vs −11%).", severity: "info" },
  { icon: Activity, text: "Aerosol index trending down — expect 8% output gain next 48hrs.", severity: "info" },
];

const severityConfig = {
  warning: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400", icon: "text-amber-500", glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]" },
  success: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", icon: "text-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]" },
  info: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-400", icon: "text-blue-500", glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-3 rounded-xl shadow-2xl shadow-black/50">
        <p className="text-slate-200 font-semibold mb-2 text-sm">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="text-slate-100 font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function InsightsPanel({ location }) {
  const [activeTab, setActiveTab] = useState("timeseries");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tabs = [
    { id: "timeseries", label: "Overview", icon: BarChart2 },
    { id: "scatter", label: "Correlation", icon: TrendingDown },
    { id: "ai", label: "AI Analysis", icon: Sparkles },
  ];

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-2xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 relative">
      {/* Premium Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-purple-500 opacity-80" />

      <div className="px-5 py-4 border-b border-slate-800/80 flex-shrink-0 bg-slate-900/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-tight">
            Data Analytics
          </h3>
          {location && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Live Feed
            </div>
          )}
        </div>
        
        <div className="flex gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800/60 shadow-inner">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                activeTab === id ? "text-slate-950" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {activeTab === "timeseries" && (
            <motion.div key="ts" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-300">Radiation vs AQI Trends</p>
                <Info className="w-4 h-4 text-slate-500 cursor-help" />
              </div>
              <div className="h-[220px] w-full p-2 bg-slate-900/40 rounded-xl border border-slate-800/50 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTimeSeries} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area yAxisId="l" type="monotone" dataKey="radiation" name="GHI (W/m²)" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRad)" />
                    <Area yAxisId="r" type="monotone" dataKey="aqi" name="AQI" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorAqi)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === "scatter" && (
            <motion.div key="sc" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
               <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-300">Performance Degradation Matrix</p>
                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">r = -0.83</div>
              </div>
              <div className="h-[220px] w-full p-2 bg-slate-900/40 rounded-xl border border-slate-800/50 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="aqi" type="number" name="AQI" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="output" type="number" name="Output (MW)" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <ZAxis dataKey="z" range={[40, 80]} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: '#475569' }} />
                    <Scatter data={mockScatter} fill="#3b82f6" fillOpacity={0.6} stroke="#60a5fa" strokeWidth={1} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">Demonstrates inverse relationship between particulate matter and PV yield.</p>
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-medium text-slate-300">Predictive Engine Insights</p>
              </div>
              {aiInsights.map((ins, i) => {
                const conf = severityConfig[ins.severity];
                const Icon = ins.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800/80 ${conf.border} ${conf.glow}`}
                  >
                    <div className={`p-2 rounded-lg bg-slate-950/50 shadow-inner ${conf.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-[13px] text-slate-300 leading-relaxed pt-0.5">{ins.text}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}