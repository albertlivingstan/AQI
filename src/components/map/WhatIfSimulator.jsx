import { useState } from "react";
import { FlaskConical, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

const baseOutput = 4.82;
const baseAqi = 68;

function predictOutput(aqi) {
  const reduction = Math.max(0, (aqi - 20) * 0.0025);
  return Math.max(0, baseOutput * (1 - reduction));
}

export default function WhatIfSimulator() {
  const [aqi, setAqi] = useState(baseAqi);
  const predicted = predictOutput(aqi);
  const delta = predicted - baseOutput;
  const pct = ((delta / baseOutput) * 100).toFixed(1);
  const gain = delta >= 0;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-white">What-If Simulator</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-slate-400">Adjust AQI</label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              aqi < 50 ? "bg-emerald-500/15 text-emerald-400" :
              aqi < 100 ? "bg-amber-500/15 text-amber-400" :
              aqi < 150 ? "bg-orange-500/15 text-orange-400" :
              "bg-red-500/15 text-red-400"
            }`}>
              {aqi} — {aqi < 50 ? "Good" : aqi < 100 ? "Moderate" : aqi < 150 ? "Unhealthy" : "Hazardous"}
            </span>
          </div>
          <input
            type="range" min={0} max={200} value={aqi}
            onChange={e => setAqi(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>0 (Clean)</span>
            <span>200 (Hazardous)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-center">
            <p className="text-xs text-slate-500 mb-1">Predicted Output</p>
            <motion.p key={predicted.toFixed(2)} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-lg font-bold text-amber-400">
              {predicted.toFixed(2)} <span className="text-xs text-slate-400">MW</span>
            </motion.p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-center">
            <p className="text-xs text-slate-500 mb-1">Efficiency Δ</p>
            <motion.div key={pct} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`flex items-center justify-center gap-1 text-lg font-bold ${gain ? "text-emerald-400" : "text-red-400"}`}>
              {gain ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {gain ? "+" : ""}{pct}%
            </motion.div>
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border text-xs ${gain ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-red-500/5 border-red-500/20 text-red-300"}`}>
          {gain
            ? `Reducing AQI from ${baseAqi} → ${aqi} would add ${Math.abs(delta).toFixed(2)} MW (+${Math.abs(Number(pct))}% efficiency)`
            : `AQI of ${aqi} reduces output by ${Math.abs(delta).toFixed(2)} MW (${Math.abs(Number(pct))}% efficiency loss)`
          }
        </div>
      </div>
    </div>
  );
}