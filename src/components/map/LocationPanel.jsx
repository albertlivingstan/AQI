import { MapPin, Zap, Wind, Sun, Loader2, Navigation, Download, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function LocationPanel({ location, loading, onClear }) {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  const handleDownloadReport = () => {
    if (!location) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Location Analytics Report", 20, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Location: ${location.name}`, 20, 40);
    doc.text(`Coordinates: ${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°`, 20, 50);
    
    doc.setFont("helvetica", "bold");
    doc.text("Metrics:", 20, 70);
    doc.setFont("helvetica", "normal");
    doc.text(`- Solar GHI: ${location.radiation} W/m²`, 25, 80);
    doc.text(`- AQI Level: ${location.aqi} (${location.aqiLabel})`, 25, 90);
    doc.text(`- Predicted Output: ${location.output} MW`, 25, 100);
    
    doc.setFont("helvetica", "bold");
    doc.text("AI Insight:", 20, 120);
    doc.setFont("helvetica", "italic");
    const splitText = doc.splitTextToSize(location.insight, 170);
    doc.text(splitText, 20, 130);

    doc.save(`solar_aqi_report_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}.pdf`);
    toast({ title: "Report Exported", description: "PDF report has been downloaded successfully." });
  };

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Location Removed" : "Location Saved",
      description: isSaved ? "Removed from saved locations." : `${location?.name} saved to your favorites.`
    });
  };

  if (!location && !loading) {
    return (
      <div className="relative bg-slate-950/80 backdrop-blur-2xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 p-5 min-h-[200px] flex flex-col items-center justify-center text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-700 to-slate-500 opacity-80" />
        <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-3 border border-slate-700/50 shadow-inner">
          <Navigation className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-300 mb-1">No Location Selected</p>
        <p className="text-xs text-slate-500 max-w-[200px]">Click anywhere on the global map to instantly analyze atmospheric conditions.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-950/80 backdrop-blur-2xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 opacity-80" />
      
      <div className="px-5 py-4 border-b border-slate-800/80 flex-shrink-0 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
              Live Location
            </h3>
          </div>
          {location && (
            <div className="flex gap-2">
              <button onClick={toggleSave} className={`p-1.5 rounded-md transition-colors ${isSaved ? "bg-amber-500/20 text-amber-400" : "bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}>
                <Star className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-400" : ""}`} />
              </button>
              <button onClick={onClear} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 bg-slate-800/50 px-2 py-1 rounded-md transition-colors">Clear</button>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-4">
              {["Fetching satellite data...", "Analyzing atmospheric conditions...", "Running ML predictions..."].map((msg, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                    <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                  </div>
                  <span className="text-xs font-medium text-slate-400">{msg}</span>
                </div>
              ))}
            </motion.div>
          ) : location && (
            <motion.div key="data" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div>
                <p className="text-base font-bold text-slate-200">{location.name}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5">
                <MetricRow icon={Sun} label="Solar GHI" value={`${location.radiation} W/m²`} color="text-amber-400" bg="bg-amber-500/5" border="border-amber-500/10" />
                <MetricRow icon={Wind} label="Air Quality" value={`${location.aqi} (${location.aqiLabel})`} color="text-purple-400" bg="bg-purple-500/5" border="border-purple-500/10" />
                <MetricRow icon={Zap} label="Estimated Yield" value={`${location.output} MW`} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/10" />
              </div>
              
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/50 shadow-inner relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl opacity-50" />
                <p className="text-[13px] text-slate-300 leading-relaxed pl-2">{location.insight}</p>
              </div>

              <button onClick={handleDownloadReport} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl transition-all text-xs font-semibold text-slate-200 group">
                <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                Download PDF Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, color, bg, border }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-xl border ${bg} ${border} shadow-inner`}>
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-slate-950/50 shadow-sm">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <span className={`text-sm font-bold ${color} tracking-tight`}>{value}</span>
    </div>
  );
}