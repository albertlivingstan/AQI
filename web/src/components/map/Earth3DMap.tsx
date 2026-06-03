"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Dynamically import Globe to avoid SSR window errors
const Globe = dynamic(() => import('react-globe.gl'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/60">
      <div className="flex flex-col items-center gap-4 text-emerald-400">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm font-medium font-outfit tracking-wider animate-pulse">INITIALIZING 3D ENVIRONMENT...</p>
      </div>
    </div>
  )
});

// Mock AQI data points for the globe (Will be replaced by Prisma/API data)
const mockAqiData = [
  { lat: 40.7128, lng: -74.0060, aqi: 45, city: 'New York' },
  { lat: 34.0522, lng: -118.2437, aqi: 85, city: 'Los Angeles' },
  { lat: 28.6139, lng: 77.2090, aqi: 320, city: 'New Delhi' },
  { lat: 39.9042, lng: 116.4074, aqi: 150, city: 'Beijing' },
  { lat: 51.5074, lng: -0.1278, aqi: 35, city: 'London' },
  { lat: -33.8688, lng: 151.2093, aqi: 22, city: 'Sydney' },
  { lat: 35.6762, lng: 139.6503, aqi: 55, city: 'Tokyo' },
  { lat: 1.3521, lng: 103.8198, aqi: 40, city: 'Singapore' }
];

export default function Earth3DMap() {
  const globeEl = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-resize globe based on container
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Auto-rotate globe slowly
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Determine color based on AQI value
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#10b981'; // Emerald (Good)
    if (aqi <= 100) return '#f59e0b'; // Amber (Moderate)
    if (aqi <= 150) return '#f97316'; // Orange (Unhealthy for sensitive)
    if (aqi <= 200) return '#ef4444'; // Red (Unhealthy)
    if (aqi <= 300) return '#8b5cf6'; // Purple (Very Unhealthy)
    return '#881337'; // Maroon (Hazardous)
  };

  const pointsData = useMemo(() => {
    return mockAqiData.map(point => ({
      lat: point.lat,
      lng: point.lng,
      size: Math.max(0.1, point.aqi / 100),
      color: getAqiColor(point.aqi),
      label: `${point.city} (AQI: ${point.aqi})`
    }));
  }, []);

  return (
    <div className="w-full h-full relative group" ref={containerRef}>
      {/* HUD Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <Card className="bg-black/40 backdrop-blur-md border-slate-800/60 p-4">
          <h2 className="text-sm font-bold text-white font-outfit uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Global AQI Network
          </h2>
          <p className="text-xs text-slate-400 mt-1">Real-time geospatial monitoring</p>
        </Card>
      </div>

      <div className="absolute bottom-6 right-6 z-10 pointer-events-none">
         <Card className="bg-black/40 backdrop-blur-md border-slate-800/60 p-4 flex flex-col gap-2">
           <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Index Key</div>
           {[
             { label: 'Good (0-50)', color: 'bg-emerald-500' },
             { label: 'Moderate (51-100)', color: 'bg-amber-500' },
             { label: 'Unhealthy (101-200)', color: 'bg-red-500' },
             { label: 'Hazardous (300+)', color: 'bg-rose-900' }
           ].map(k => (
             <div key={k.label} className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${k.color}`} />
               <span className="text-xs text-slate-300">{k.label}</span>
             </div>
           ))}
         </Card>
      </div>

      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="size"
        pointRadius={0.5}
        pointColor="color"
        pointLabel="label"
        // Heatmap/Hex polygon settings could be added here for research-grade visualization
      />
    </div>
  );
}
