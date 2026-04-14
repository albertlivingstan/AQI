import { monthlyData, weeklyData, aqiBreakdown, solarPlants } from "../data/mockData";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

const impactColor = { Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", Moderate: "text-amber-400 bg-amber-500/10 border-amber-500/20", High: "text-red-400 bg-red-500/10 border-red-500/20" };

export default function Analytics() {
  const radarData = solarPlants.map(p => ({
    plant: p.name.split(" ").slice(-1)[0],
    efficiency: p.efficiency,
    output: (p.output / 10) * 100,
    aqiScore: 100 - p.aqi,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Analytics Engine</h2>
        <p className="text-xs text-slate-400 mt-0.5">Deep-dive correlation and trend analysis across all data sources</p>
      </div>

      {/* Monthly output with AQI trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-1">30-Day Output & AQI Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Daily generation correlated with air quality index</p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} interval={4} />
            <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="output" name="Output (MWh)" fill="#f59e0b" opacity={0.8} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="aqi" name="AQI" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* AQI Pollutant Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">AQI Pollutant Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Individual pollutant contributions and solar impact</p>
          <div className="space-y-3">
            {aqiBreakdown.map(p => (
              <div key={p.pollutant} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-slate-200 w-12">{p.pollutant}</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden min-w-16">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${Math.min((p.value / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{p.value} {p.unit}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs border font-medium ${impactColor[p.impact]}`}>
                    {p.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plant radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">Plant Performance Radar</h3>
          <p className="text-xs text-slate-400 mb-4">Efficiency, output, and AQI score by plant</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="plant" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Radar name="Efficiency %" dataKey="efficiency" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              <Radar name="AQI Score" dataKey="aqiScore" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly comparison table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Weekly Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Day", "Actual (MWh)", "Predicted (MWh)", "Variance", "AQI", "Accuracy"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {weeklyData.map(d => {
                const variance = d.output - d.predicted;
                const accuracy = (1 - Math.abs(variance) / d.predicted) * 100;
                return (
                  <tr key={d.day} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white">{d.day}</td>
                    <td className="py-2.5 px-3 text-amber-400">{d.output.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-blue-400">{d.predicted.toFixed(1)}</td>
                    <td className={`py-2.5 px-3 font-medium ${variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {variance >= 0 ? "+" : ""}{variance.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{d.aqi}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{accuracy.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}