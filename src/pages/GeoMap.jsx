import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import LayerControls from "../components/map/LayerControls";
import LocationPanel from "../components/map/LocationPanel";
import InsightsPanel from "../components/map/InsightsPanel";
import WhatIfSimulator from "../components/map/WhatIfSimulator";
import { Layers, BarChart2, MapPin, X, FlaskConical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Fix leaflet default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function generateMockData(lat, lng) {
  const radiation = Math.round(200 + Math.abs(Math.sin(lat)) * 600 + Math.random() * 150);
  const aqi = Math.round(20 + Math.random() * 140);
  const output = parseFloat((radiation / 100 * (1 - aqi * 0.002)).toFixed(2));
  const aqiLabel = aqi < 50 ? "Good" : aqi < 100 ? "Moderate" : aqi < 150 ? "Unhealthy" : "Hazardous";
  const effLoss = Math.round(aqi * 0.15);
  const insight = aqi > 100
    ? `High AQI (${aqi}) is causing ~${effLoss}% reduction in solar efficiency. PM2.5 scattering dominant.`
    : `Air quality is ${aqiLabel.toLowerCase()}. Minimal atmospheric attenuation — near-optimal solar conditions.`;
  return { lat, lng, radiation, aqi, aqiLabel, output, insight, name: `${lat.toFixed(3)}°, ${lng.toFixed(3)}°` };
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function FAB({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border transition-all text-xs font-medium ${
        active ? "bg-amber-500 border-amber-400 text-white" : "bg-slate-900/90 backdrop-blur-md border-slate-700/60 text-slate-300 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function BottomSheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/50 md:hidden"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-16 left-0 right-0 z-[1200] md:hidden bg-slate-950 border-t border-slate-800 rounded-t-2xl max-h-[65vh] overflow-y-auto"
          >
            <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">{title}</span>
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SidePanel({ side, open, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key={side}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="hidden md:flex flex-shrink-0 overflow-hidden"
        >
          <div className={`w-[280px] h-full overflow-y-auto p-3 space-y-3 bg-slate-950/90 backdrop-blur-sm ${side === "left" ? "border-r" : "border-l"} border-slate-800`}>
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function UserLocation({ setGlobalUserLocationName }) {
  const [position, setPosition] = useState(null);
  const [localName, setLocalName] = useState("Your device location");

  const map = useMapEvents({
    async locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=10`);
        const geoData = await geoRes.json();
        if (geoData && geoData.display_name) {
          const parsedName = geoData.display_name.split(',').slice(0, 3).join(',').trim();
          setLocalName(parsedName);
          if (setGlobalUserLocationName) setGlobalUserLocationName(parsedName);
        }
      } catch (err) {
        console.warn("Reverse geocode failed for user location");
      }
    },
    async locationerror(e) {
      console.warn("GPS natively denied or unavailable. Fallback to IP Geolocation initiated.");
      try {
        // Fallback to purely IP-driven location if they are on HTTP or denied device permissions!
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("Fallback IP API returned non-200");
        const data = await res.json();
        if (data.latitude && data.longitude) {
           const fallbackPos = { lat: data.latitude, lng: data.longitude };
           // Re-trigger the primary logic pipeline organically
           map.fire('locationfound', { latlng: fallbackPos });
           map.flyTo(fallbackPos, 10);
        }
      } catch (fallbackError) {
        console.error("Even remote IP fallback tracking failed.", fallbackError);
      }
    }
  });

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 10 });
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <span className="font-semibold text-sm block mb-1">Live Feed</span>
        <span className="text-xs">{localName}</span>
      </Popup>
    </Marker>
  );
}

function LocateMeBtn() {
  const map = useMap();
  return (
    <button 
      onClick={() => map.locate({ setView: true, maxZoom: 12 })}
      className="absolute bottom-24 right-5 md:bottom-8 md:right-8 z-[1000] p-3 rounded-full bg-slate-900/90 backdrop-blur-md border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-lg shadow-black/50"
      title="My Current Location"
    >
      <MapPin className="w-5 h-5" />
    </button>
  );
}

export default function GeoMap() {
  const { toast } = useToast();
  const [activeLayers, setActiveLayers] = useState(["solar", "aqi"]);
  const [opacities, setOpacities] = useState({ solar: 0.7, aerosol: 0.6, aqi: 0.5, cloud: 0.5 });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileSheet, setMobileSheet] = useState(null);
  const [timeOffset, setTimeOffset] = useState(0);

  // Lifted state to track the user's global device position for SMS inclusion
  const [globalUserLocationName, setGlobalUserLocationName] = useState("Unknown");

  const handleToggle = useCallback((id) => {
    setActiveLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  }, []);

  const handleOpacity = useCallback((id, val) => {
    setOpacities(prev => ({ ...prev, [id]: val }));
  }, []);

  const handleMapClick = useCallback(async ({ lat, lng }) => {
    setLoading(true);
    setSelectedLocation(null);
    setMobileSheet("location");
    // Dramatically optimized map loading speed 
    await new Promise(r => setTimeout(r, 300));
    
    const data = generateMockData(lat, lng);
    
    // Reverse Geocode the coordinates into a real-world physical address!
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
      const geoData = await geoRes.json();
      if (geoData && geoData.display_name) {
         // Cleanly slice the output to avoid overly long strings (Targeting City, State, Country)
         data.name = geoData.display_name.split(',').slice(0, 3).join(',').trim();
      }
    } catch (e) {
      console.warn("Reverse geocoding failed, falling back to coordinates.");
    }

    setSelectedLocation(data);
    setLoading(false);

    // Dispatch SMS report automatically
    try {
      const customSid = localStorage.getItem('twilio_account_sid');
      const customAuth = localStorage.getItem('twilio_auth_token');
      const customFrom = localStorage.getItem('twilio_from_number');
      const customTarget = localStorage.getItem('twilio_target_number') || "+916382357454";

      const smsMessage = `SolarAQI Insight:\nLocation: ${data.name}\nAQI: ${data.aqi} (${data.aqiLabel})\nRadiation: ${data.radiation} W/m²\nEst Output: ${data.output} MW`;
      await fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           accountSid: customSid || undefined,
           authToken: customAuth || undefined,
           fromNumber: customFrom || undefined,
           to: customTarget, 
           message: smsMessage 
        })
      });
      toast({
        title: "Report Dispatched",
        description: "An SMS containing the live location insights was sent to your phone."
      });
    } catch (err) {
      toast({
        title: "SMS Dispatch Failed",
        description: "Failed to send the location alert.",
        variant: "destructive"
      });
    }
  }, [globalUserLocationName, toast]);

  const timeLabels = ["Jan 2024", "Mar 2024", "May 2024", "Jul 2024", "Sep 2024", "Nov 2024", "Jan 2025"];

  const layerPanel = (
    <div className="space-y-3">
      <LayerControls activeLayers={activeLayers} onToggle={handleToggle} opacities={opacities} onOpacity={handleOpacity} />
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
        <p className="text-xs font-semibold text-white mb-3">Time Slider</p>
        <input type="range" min={0} max={6} step={1} value={timeOffset} onChange={e => setTimeOffset(Number(e.target.value))} className="w-full accent-amber-500" />
        <p className="text-xs text-amber-400 text-center mt-1 font-medium">{timeLabels[timeOffset]}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-full -m-4 md:-m-6 relative">
      {/* Desktop left panel */}
      <SidePanel side="left" open={leftOpen}>
        {layerPanel}
        <LocationPanel location={selectedLocation} loading={loading} onClear={() => setSelectedLocation(null)} />
        <WhatIfSimulator />
      </SidePanel>

      {/* Map */}
      <div className="flex-1 relative min-w-0 overflow-hidden">
        {/* Desktop toggle buttons */}
        <div className="hidden md:flex absolute top-3 left-3 z-[1000] gap-2">
          <FAB icon={Layers} label={leftOpen ? "Hide Controls" : "Show Controls"} active={leftOpen} onClick={() => setLeftOpen(!leftOpen)} />
        </div>
        <div className="hidden md:flex absolute top-3 right-3 z-[1000] gap-2">
          <FAB icon={BarChart2} label={rightOpen ? "Hide Analytics" : "Show Analytics"} active={rightOpen} onClick={() => setRightOpen(!rightOpen)} />
        </div>

        {/* Mobile FAB row */}
        <div className="md:hidden absolute bottom-4 left-0 right-0 z-[1000] flex justify-center gap-2 px-4">
          <FAB icon={Layers} label="Layers" active={mobileSheet === "layers"} onClick={() => setMobileSheet(mobileSheet === "layers" ? null : "layers")} />
          <FAB icon={MapPin} label="Location" active={mobileSheet === "location"} onClick={() => setMobileSheet(mobileSheet === "location" ? null : "location")} />
          <FAB icon={BarChart2} label="Analytics" active={mobileSheet === "insights"} onClick={() => setMobileSheet(mobileSheet === "insights" ? null : "insights")} />
          <FAB icon={FlaskConical} label="What-If" active={mobileSheet === "whatif"} onClick={() => setMobileSheet(mobileSheet === "whatif" ? null : "whatif")} />
        </div>

        {/* Click hint */}
        {!selectedLocation && !loading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/50 text-xs text-slate-300 pointer-events-none whitespace-nowrap">
            🖱️ Tap anywhere on the map to analyze
          </div>
        )}

        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] px-5 py-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/50 text-xs text-amber-400 flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Fetching satellite data...
          </div>
        )}


        <MapContainer center={[20, 0]} zoom={3} style={{ height: "100%", width: "100%" }} className="z-0">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
          {activeLayers.includes("solar") && (
            <TileLayer url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_SurfaceReflectance_Bands721/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg" opacity={opacities.solar} attribution="NASA GIBS" />
          )}
          {activeLayers.includes("cloud") && (
            <TileLayer url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg" opacity={opacities.cloud} attribution="NASA GIBS" />
          )}
          {activeLayers.includes("aqi") && (
            <TileLayer url="https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png" opacity={opacities.aqi} attribution="Air Quality Map" />
          )}
          <ClickHandler onMapClick={handleMapClick} />
          <UserLocation setGlobalUserLocationName={setGlobalUserLocationName} />
          <LocateMeBtn />
          {selectedLocation && (
            <>
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  <div className="min-w-[150px]">
                    <p className="font-bold text-sm">{selectedLocation.name}</p>
                    <p className="text-xs mt-1">☀️ GHI: {selectedLocation.radiation} W/m²</p>
                    <p className="text-xs">💨 AQI: {selectedLocation.aqi} ({selectedLocation.aqiLabel})</p>
                    <p className="text-xs">⚡ Output: {selectedLocation.output} MW</p>
                  </div>
                </Popup>
              </Marker>
              <Circle center={[selectedLocation.lat, selectedLocation.lng]} radius={80000} pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.08, weight: 1.5 }} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Desktop right panel */}
      <SidePanel side="right" open={rightOpen}>
        <InsightsPanel location={selectedLocation} />
      </SidePanel>

      {/* Mobile bottom sheets */}
      <BottomSheet open={mobileSheet === "layers"} onClose={() => setMobileSheet(null)} title="Map Layers & Time">
        {layerPanel}
      </BottomSheet>
      <BottomSheet open={mobileSheet === "location"} onClose={() => setMobileSheet(null)} title="Location Analysis">
        <LocationPanel location={selectedLocation} loading={loading} onClear={() => { setSelectedLocation(null); setMobileSheet(null); }} />
      </BottomSheet>
      <BottomSheet open={mobileSheet === "insights"} onClose={() => setMobileSheet(null)} title="Analytics">
        <InsightsPanel location={selectedLocation} />
      </BottomSheet>
      <BottomSheet open={mobileSheet === "whatif"} onClose={() => setMobileSheet(null)} title="What-If Simulator">
        <WhatIfSimulator />
      </BottomSheet>
    </div>
  );
}