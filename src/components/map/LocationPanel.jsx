import { MapPin, Zap, Wind, Sun, Loader2, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LocationPanel({ location, loading, onClear }) {
  if (!location && !loading) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Location</span>
        </div>
        <div className="text-center py-6">
          <Navigation className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Click anywhere on the map to analyze a location</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Location</span>
        </div>
        {location && (
          <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {["Fetching satellite data...", "Analyzing atmospheric conditions...", "Running ML model..."].map((msg, i) => (
              <div key={i} className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin flex-shrink-0" />
                <span className="text-xs text-slate-400">{msg}</span>
              </div>
            ))}
          </motion.div>
        ) : location && (
          <motion.div key="data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white">{location.name}</p>
              <p className="text-xs text-slate-500">{location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <MetricRow icon={Sun} label="Solar GHI" value={`${location.radiation} W/m²`} color="text-amber-400" />
              <MetricRow icon={Wind} label="AQI" value={`${location.aqi} (${location.aqiLabel})`} color="text-purple-400" />
              <MetricRow icon={Zap} label="Predicted Output" value={`${location.output} MW`} color="text-emerald-400" />
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <p className="text-xs text-slate-300 leading-relaxed">{location.insight}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  );
}