import { kpiData, forecastData, weeklyData, alerts, solarPlants } from "../data/mockData";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Zap, Wind, Leaf, Target, Activity, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";

const KpiCard = ({ title, value, unit, change, icon: Icon, color }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{title}</span>
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
    <div>
      <span className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</span>
      <span className="text-sm text-slate-400 ml-1">{unit}</span>
    </div>
    <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
      {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {change >= 0 ? "+" : ""}{change}% vs yesterday
    </div>
  </div>
);

const alertIcons = { warning: AlertTriangle, info: Info, error: XCircle, success: CheckCircle2 };
const alertColors = { warning: "text-amber-400", info: "text-blue-400", error: "text-red-400", success: "text-emerald-400" };

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Current Output" value={kpiData.currentOutput.value} unit={kpiData.currentOutput.unit} change={kpiData.currentOutput.change} icon={Zap} color="bg-amber-500" />
        <KpiCard title="Forecast Accuracy" value={kpiData.forecastAccuracy.value} unit={kpiData.forecastAccuracy.unit} change={kpiData.forecastAccuracy.change} icon={Target} color="bg-blue-500" />
        <KpiCard title="AQI Index" value={kpiData.aqiIndex.value} unit={kpiData.aqiIndex.label} change={kpiData.aqiIndex.change} icon={Wind} color="bg-purple-500" />
        <KpiCard title="Daily Yield" value={kpiData.dailyYield.value} unit={kpiData.dailyYield.unit} change={kpiData.dailyYield.change} icon={Activity} color="bg-emerald-500" />
        <KpiCard title="CO₂ Saved" value={kpiData.co2Saved.value} unit={kpiData.co2Saved.unit} change={kpiData.co2Saved.change} icon={Leaf} color="bg-teal-500" />
        <KpiCard title="Efficiency" value={kpiData.efficiency.value} unit={kpiData.efficiency.unit} change={kpiData.efficiency.change} icon={TrendingUp} color="bg-orange-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Intraday forecast */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Today's Output vs Forecast</h2>
            <p className="text-xs text-slate-400">Actual vs predicted solar generation (MW) with AQI overlay</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} interval={3} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#f59e0b" fill="url(#predGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" fill="url(#actGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">7-Day Generation</h2>
            <p className="text-xs text-slate-400">Daily output vs prediction (MWh)</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="output" name="Actual" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="predicted" name="Predicted" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Plant status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Solar Plant Status</h2>
          <div className="space-y-3">
            {solarPlants.map(plant => (
              <div key={plant.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{plant.name}</p>
                  <p className="text-xs text-slate-400">{plant.location} · {plant.capacity}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-400">{plant.output} MW</p>
                    <p className="text-xs text-slate-400">AQI {plant.aqi}</p>
                  </div>
                  <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${plant.efficiency}%` }} />
                  </div>
                  <span className="text-xs text-slate-300 w-8">{plant.efficiency}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => {
              const Icon = alertIcons[alert.severity];
              return (
                <div key={alert.id} className="flex gap-3 p-3 rounded-lg bg-slate-800/50">
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alertColors[alert.severity]}`} />
                  <div>
                    <p className="text-xs text-slate-200 leading-relaxed">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}