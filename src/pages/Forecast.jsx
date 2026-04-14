import { useState } from "react";
import { forecastData, monthlyData, modelMetrics } from "../data/mockData";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Layers, CheckCircle } from "lucide-react";

const statusBadge = { primary: "bg-amber-500/20 text-amber-300 border-amber-500/30", active: "bg-blue-500/20 text-blue-300 border-blue-500/30", baseline: "bg-slate-700 text-slate-300 border-slate-600" };

export default function Forecast() {
  const [horizon, setHorizon] = useState("24h");

  const data = horizon === "24h" ? forecastData : monthlyData;
  const xKey = horizon === "24h" ? "hour" : "date";

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Power Output Forecast</h2>
          <p className="text-xs text-slate-400 mt-0.5">ML-driven predictions with AQI-integrated models</p>
        </div>
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {["24h", "30d"].map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${horizon === h ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Main forecast chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Predicted vs Actual Generation (MW)</h3>
            <p className="text-xs text-slate-400">Ensemble model output with AQI-adjusted corrections</p>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <CheckCircle className="w-3 h-3" /> 94.7% Accuracy
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xKey} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} interval={horizon === "24h" ? 3 : 4} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {horizon === "24h" && <ReferenceLine x="14:00" stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "Peak", fill: "#f43f5e", fontSize: 11 }} />}
            <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#f59e0b" fill="url(#fg1)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" fill="url(#fg2)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* AQI impact chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-1">AQI Impact on Generation</h3>
        <p className="text-xs text-slate-400 mb-4">Correlation between air quality index and output reduction</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} interval={3} />
            <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="predicted" name="Output (MW)" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="aqi" name="AQI" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Model Performance Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Model", "RMSE", "MAE", "R²", "Status"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {modelMetrics.map(m => (
                <tr key={m.model} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                    {m.status === "primary" && <Layers className="w-3.5 h-3.5 text-amber-400" />}
                    {m.model}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{m.rmse}</td>
                  <td className="py-3 px-3 text-slate-300">{m.mae}</td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">{m.r2}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${statusBadge[m.status]}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}