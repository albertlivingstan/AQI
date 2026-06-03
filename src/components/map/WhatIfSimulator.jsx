import { useState } from "react";
import { FlaskConical, TrendingDown, TrendingUp, Zap, Cloud } from "lucide-react";
import { motion } from "framer-motion";

const baseOutput = 4.82;
const baseAqi = 68;
const baseCloud = 15;

function predictOutput(aqi, cloud) {
  const aqiReduction = Math.max(0, (aqi - 20) * 0.0025);
  const cloudReduction = Math.max(0, cloud * 0.006); // 0.6% drop per 1% cloud cover
  return Math.max(0, baseOutput * (1 - aqiReduction - cloudReduction));
}

export default function WhatIfSimulator() {
  const [aqi, setAqi] = useState(baseAqi);
  const [cloud, setCloud] = useState(baseCloud);
  
  const predicted = predictOutput(aqi, cloud);
  const delta = predicted - baseOutput;
  const pct = ((delta / baseOutput) * 100).toFixed(1);
  const gain = delta >= 0;

  return (
    <div className="relative bg-slate-950/80 backdrop-blur-2xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-80" />
      
      <div className="px-5 py-4 border-b border-slate-800/80 flex-shrink-0 bg-slate-900/30">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400 tracking-tight">
            Scenario Simulator
          </h3>
        </div>
        <p className="text-xs text-slate-500">Test hypothetical atmospheric conditions</p>
      </div>

      <div className="p-5 space-y-5">
        {/* AQI Slider */}
        <div className="space-y-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 shadow-inner">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-purple-400"/> AQI Level</label>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
              aqi < 50 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              aqi < 100 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
              aqi < 150 ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
              "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {aqi} — {aqi < 50 ? "Good" : aqi < 100 ? "Moderate" : aqi < 150 ? "Unhealthy" : "Hazardous"}
            </span>
          </div>
          <input
            type="range" min={0} max={300} value={aqi}
            onChange={e => setAqi(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Cloud Slider */}
        <div className="space-y-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 shadow-inner">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5 text-blue-400"/> Cloud Cover</label>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400">
              {cloud}%
            </span>
          </div>
          <input
            type="range" min={0} max={100} value={cloud}
            onChange={e => setCloud(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Predicted Yield</p>
            <motion.p key={predicted.toFixed(2)} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-black text-amber-400 tracking-tight">
              {predicted.toFixed(2)}<span className="text-xs text-slate-500 ml-1">MW</span>
            </motion.p>
          </div>
          
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-center relative overflow-hidden group">
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${gain ? 'from-emerald-500/5' : 'from-red-500/5'}`} />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Efficiency Δ</p>
            <motion.div key={pct} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex items-center justify-center gap-1 text-2xl font-black tracking-tight ${gain ? "text-emerald-400" : "text-red-400"}`}>
              {gain ? <TrendingUp className="w-5 h-5 mb-0.5" /> : <TrendingDown className="w-5 h-5 mb-0.5" />}
              {gain ? "+" : ""}{pct}%
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}