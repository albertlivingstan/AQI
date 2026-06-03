import Earth3DMap from "@/components/map/Earth3DMap";

export default function GlobalMapPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white font-outfit">Global Map</h1>
        <p className="text-slate-400 text-sm mt-1">Interactive 3D geospatial visualization of planetary air quality.</p>
      </div>
      
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800/60 shadow-2xl relative bg-black">
        {/* We mount the Earth3DMap client component which handles WebGL/Three.js */}
        <Earth3DMap />
      </div>
    </div>
  );
}
