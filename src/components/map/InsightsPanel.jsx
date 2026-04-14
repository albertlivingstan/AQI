import { useState } from "react";
import { BarChart2, Sparkles, TrendingDown } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const mockTimeSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  radiation: 200 + Math.random() * 400,
  aqi: 30 + Math.random() * 80,
}));

const mockScatter = Array.from({ length: 30 }, () => ({
  aqi: 20 + Math.random() * 150,
  output: 5 - (Math.random() * 4),
  z: 10,
}));

const aiInsights = [
  { icon: "🌫️", text: "High PM2.5 caused ~18% reduction in solar efficiency this week", severity: "warning" },
  { icon: "☀️", text: "Optimal solar conditions forecasted for tomorrow 10:00–14:00", severity: "success" },
  { icon: "☁️", text: "Cloud cover impact is higher than AQI today (−23% vs −11%)", severity: "info" },
  { icon: "📈", text: "Aerosol index trending down — expect 8% output gain next 48hrs", severity: "info" },
];

const severityStyle = {
  warning: "border-amber-500/30 bg-amber-500/5",
  success: "border-emerald-500/30 bg-emerald-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
};

export default function InsightsPanel({ location }) {
  const [activeTab, setActiveTab] = useState("timeseries");

  const tabs = [
    { id: "timeseries", label: "Time Series", icon: BarChart2 },
    { id: "scatter", label: "AQI vs Output", icon: TrendingDown },
    { id: "ai", label: "AI Insights", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <p className="text-sm font-semibold text-white mb-3">Analytics</p>
        <div className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === id ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === "timeseries" && (
            <motion.div key="ts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-slate-400 mb-3">Monthly Radiation vs AQI</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={mockTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} />
                  <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="radiation" name="GHI (W/m²)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line yAxisId="r" type="monotone" dataKey="aqi" name="AQI" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {activeTab === "scatter" && (
            <motion.div key="sc" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-slate-400 mb-3">AQI vs Solar Power (negative correlation)</p>
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="aqi" name="AQI" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="output" name="Output (MW)" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <ZAxis dataKey="z" range={[30, 30]} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff", fontSize: 11 }} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={mockScatter} fill="#f59e0b" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 mt-2 text-center">Pearson r = −0.83 · Strong negative correlation</p>
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div key="ai" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-xs text-slate-400 mb-1">AI-powered insights for selected location</p>
              {aiInsights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex gap-3 p-3 rounded-lg border ${severityStyle[ins.severity]}`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{ins.icon}</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{ins.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}