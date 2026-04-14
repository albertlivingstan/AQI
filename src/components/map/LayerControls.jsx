import { useState } from "react";
import { Layers, Sun, Wind, Cloud, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";

const layers = [
  { id: "solar", label: "Solar Radiation", desc: "MODIS/ERA5 GHI layer", color: "#f59e0b", icon: Sun },
  { id: "aerosol", label: "Aerosol Index", desc: "Sentinel-5P UVAI", color: "#a78bfa", icon: Wind },
  { id: "aqi", label: "AQI Heatmap", desc: "PM2.5 / PM10 overlay", color: "#f43f5e", icon: Wind },
  { id: "cloud", label: "Cloud Cover", desc: "MODIS Terra daily", color: "#94a3b8", icon: Cloud },
];

export default function LayerControls({ activeLayers, onToggle, opacities, onOpacity }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Map Layers</span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-800">
          {layers.map(({ id, label, desc, color, icon: Icon }) => {
            const active = activeLayers.includes(id);
            return (
              <div key={id} className="space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div>
                      <p className="text-xs font-medium text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggle(id)}
                    className={`flex-shrink-0 transition-colors ${active ? "text-amber-400" : "text-slate-600 hover:text-slate-400"}`}
                  >
                    {active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                {active && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16">Opacity</span>
                    <input
                      type="range" min={0.1} max={1} step={0.1}
                      value={opacities[id] ?? 0.7}
                      onChange={e => onOpacity(id, parseFloat(e.target.value))}
                      className="flex-1 accent-amber-500 h-1"
                    />
                    <span className="text-xs text-slate-400 w-8 text-right">{Math.round((opacities[id] ?? 0.7) * 100)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}