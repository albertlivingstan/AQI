import { useState, useEffect } from "react";
import { forecastData, monthlyData, modelMetrics } from "../data/mockData";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Layers, CheckCircle, Sun, Wind, Search,
  Navigation, Thermometer, Droplets, Gauge, Sparkles, Sliders,
  RefreshCw, Info, AlertTriangle, ShieldAlert, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { calculateIndividualAqi, calculateOverallAqi, getAqiCategory } from "../utils/aqiCalculator";

const statusBadge = {
  primary: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  active: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  baseline: "bg-slate-700 text-slate-300 border-slate-600"
};

export default function Forecast() {
  const [activeTab, setActiveTab] = useState("aqi");
  const [horizon, setHorizon] = useState("24h");
  
  // Geolocation & Search States
  const [citySearch, setCitySearch] = useState("");
  const [locationName, setLocationName] = useState("Bangalore, India");
  const [coordinates, setCoordinates] = useState({ lat: 12.9716, lon: 77.5946 });
  
  // Data Loading States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aqiForecast, setAqiForecast] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);

  // What-If Sliders
  const [windDelta, setWindDelta] = useState(0);
  const [tempDelta, setTempDelta] = useState(0);
  const [emissionDelta, setEmissionDelta] = useState(0);

  const [isDemoMode, setIsDemoMode] = useState(false);

  // Chart state
  const [selectedChartMetric, setSelectedChartMetric] = useState("aqi");

  // Fetch forecasts on coordinates change
  useEffect(() => {
    const fetchForecasts = async () => {
      setLoading(true);
      setError(null);
      try {
        const aqiRes = await fetch(`/api/aqi/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}`);
        if (!aqiRes.ok) throw new Error("Failed to fetch AQI forecast");
        const aqiData = await aqiRes.json();
        setAqiForecast(aqiData);
        setIsDemoMode(!!aqiData.demoMode);

        const weatherRes = await fetch(`/api/weather/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}`);
        if (!weatherRes.ok) throw new Error("Failed to fetch weather forecast");
        const weatherData = await weatherRes.json();
        setWeatherForecast(weatherData);
      } catch (err) {
        console.error("Error loading forecast data:", err);
        setError("Error fetching telemetry for this location. Please check your API configuration.");
      } finally {
        setLoading(false);
      }
    };
    fetchForecasts();
  }, [coordinates]);

  // Geocoding Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!citySearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}`);
      if (!res.ok) throw new Error("Geocoding service unavailable");
      const data = await res.json();
      if (data.length === 0) {
        throw new Error("No location found matching that description. Try again.");
      }
      const topResult = data[0];
      const parsedName = topResult.display_name.split(',').slice(0, 3).join(',').trim();
      setLocationName(parsedName);
      setCoordinates({
        lat: parseFloat(topResult.lat),
        lon: parseFloat(topResult.lon)
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Device location with IP Geolocation Fallback
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoordinates({ lat, lon });
        
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
          const geoData = await geoRes.json();
          if (geoData && geoData.display_name) {
            setLocationName(geoData.display_name.split(',').slice(0, 3).join(',').trim());
          } else {
            setLocationName(`${lat.toFixed(3)}°, ${lon.toFixed(3)}°`);
          }
        } catch (e) {
          setLocationName(`${lat.toFixed(3)}°, ${lon.toFixed(3)}°`);
        }
      },
      async () => {
        console.warn("GPS access denied, fallback to IP location.");
        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();
          if (data.latitude && data.longitude) {
            setCoordinates({ lat: data.latitude, lon: data.longitude });
            setLocationName(`${data.city || 'IP-based location'}, ${data.region || ''}, ${data.country_name || ''}`);
          } else {
            throw new Error("IP Geolocation failed");
          }
        } catch (fallbackErr) {
          setError("Could not retrieve GPS or IP location.");
          setLoading(false);
        }
      }
    );
  };

  // Reset Sliders
  const handleResetSliders = () => {
    setWindDelta(0);
    setTempDelta(0);
    setEmissionDelta(0);
  };

  // Parse current and weather data
  const currentEntry = aqiForecast?.list?.[0];
  const nextHourEntry = aqiForecast?.list?.[1];
  // Day forecast uses ~24 hours ahead
  const nextDayEntry = aqiForecast?.list?.[Math.min(24, aqiForecast.list.length - 1)];

  // Helper to apply physics simulation effects
  const getSimulatedEntry = (entry) => {
    if (!entry) return null;
    
    // Wind factor: dilution under high wind, stagnation under low wind
    const windFactor = Math.max(0.1, 1 / (1 + windDelta * 0.12));

    // Temperature photochemistry factor (Ozone increase)
    const tempFactorO3 = Math.max(0.2, 1 + tempDelta * 0.045);

    // Human Emissions Factor
    const emissionFactor = 1 + emissionDelta / 100;

    const raw = entry.components;
    const simulatedComponents = {
      pm2_5: Math.max(0, raw.pm2_5 * windFactor * emissionFactor),
      pm10: Math.max(0, raw.pm10 * windFactor * emissionFactor),
      no2: Math.max(0, raw.no2 * windFactor * emissionFactor),
      so2: Math.max(0, raw.so2 * windFactor),
      co: Math.max(0, raw.co * windFactor * emissionFactor),
      o3: Math.max(0, raw.o3 * tempFactorO3 * windFactor),
      no: Math.max(0, raw.no * windFactor * emissionFactor),
      nh3: Math.max(0, raw.nh3 * windFactor)
    };

    const overall = calculateOverallAqi(simulatedComponents);
    return {
      components: simulatedComponents,
      ...overall
    };
  };

  // Extract weather details
  const currentWeather = weatherForecast?.list?.[0];
  const weatherDetails = currentWeather ? {
    temperature: currentWeather.main.temp,
    humidity: currentWeather.main.humidity,
    windSpeed: currentWeather.wind.speed,
    windDeg: currentWeather.wind.deg,
    clouds: currentWeather.clouds.all,
    pressure: currentWeather.main.pressure,
    description: currentWeather.weather[0].description
  } : null;

  // Actual values
  const currentAqiInfo = currentEntry ? calculateOverallAqi(currentEntry.components) : null;
  const nextHourAqiInfo = nextHourEntry ? calculateOverallAqi(nextHourEntry.components) : null;
  const nextDayAqiInfo = nextDayEntry ? calculateOverallAqi(nextDayEntry.components) : null;

  const currentCategory = currentAqiInfo ? getAqiCategory(currentAqiInfo.aqi) : null;
  const nextHourCategory = nextHourAqiInfo ? getAqiCategory(nextHourAqiInfo.aqi) : null;
  const nextDayCategory = nextDayAqiInfo ? getAqiCategory(nextDayAqiInfo.aqi) : null;

  // Simulated values
  const simulatedCurrent = getSimulatedEntry(currentEntry);
  const simulatedNextHour = getSimulatedEntry(nextHourEntry);
  const simulatedNextDay = getSimulatedEntry(nextDayEntry);

  const simCurrentCategory = simulatedCurrent ? getAqiCategory(simulatedCurrent.aqi) : null;
  const simNextHourCategory = simulatedNextHour ? getAqiCategory(simulatedNextHour.aqi) : null;
  const simNextDayCategory = simulatedNextDay ? getAqiCategory(simulatedNextDay.aqi) : null;

  const isSimulationActive = windDelta !== 0 || tempDelta !== 0 || emissionDelta !== 0;

  // Helper formatting for pollutant values
  const formatPollutantVal = (val, pollutant) => {
    if (pollutant === "co") {
      return `${(val / 1145).toFixed(2)} ppm`;
    }
    return `${val.toFixed(1)} μg/m³`;
  };

  // Generate qualitative weather advisory based on values
  const generateAqiAdvisory = () => {
    if (!currentAqiInfo) return "";
    const name = locationName.split(',')[0];
    let text = `Based on current meteorological telemetry in ${name}, `;
    
    const windSpeed = weatherDetails ? weatherDetails.windSpeed : 3.0;
    const temp = weatherDetails ? weatherDetails.temperature : 25;
    const dominant = currentAqiInfo.dominant;

    if (windSpeed < 2.0) {
      text += `wind speed is extremely low (${windSpeed.toFixed(1)} m/s), creating stagnant air that traps particulate aerosols. `;
    } else if (windSpeed > 5.0) {
      text += `strong winds of ${windSpeed.toFixed(1)} m/s are assisting in horizontal dispersion, clearing PM concentration. `;
    } else {
      text += `moderate wind speed of ${windSpeed.toFixed(1)} m/s is providing stable atmospheric dispersion. `;
    }

    if (dominant === "pm2_5" || dominant === "pm10") {
      text += `Particulate matter (${dominant === "pm2_5" ? "PM2.5" : "PM10"}) is the dominant pollutant, likely driven by vehicle combustion or local dust. `;
    } else if (dominant === "o3") {
      text += `Ozone (O₃) is the dominant pollutant, promoted by solar radiation and a temperature of ${temp.toFixed(1)}°C. `;
    } else if (dominant !== "N/A") {
      text += `${dominant.toUpperCase()} is the primary driver of the air quality score. `;
    }

    if (currentAqiInfo.aqi <= 50) {
      text += `Enjoy outdoor activities! The atmospheric index is highly pristine.`;
    } else if (currentAqiInfo.aqi <= 100) {
      text += `Air quality is acceptable, but sensitive groups should monitor symptoms if spending extended hours outdoors.`;
    } else if (currentAqiInfo.aqi <= 150) {
      text += `Sensitive groups (e.g. kids, asthma sufferers) should reduce outdoor exertion due to elevated pollutant levels.`;
    } else {
      text += `General public should restrict outdoor activities. Consider running indoor HEPA air purifiers.`;
    }

    return text;
  };

  const chartData = horizon === "24h" ? forecastData : monthlyData;
  const xKey = horizon === "24h" ? "hour" : "date";

  // Build hourly dataset for the AQI charts (24 entries)
  const aqiChartData = aqiForecast?.list?.slice(0, 24).map(item => {
    const date = new Date(item.dt * 1000);
    const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const actualInfo = calculateOverallAqi(item.components);
    const simInfo = getSimulatedEntry(item);
    
    return {
      time: timeLabel,
      aqi: actualInfo.aqi,
      simAqi: simInfo.aqi,
      pm2_5: item.components.pm2_5,
      simPm2_5: simInfo.components.pm2_5,
      pm10: item.components.pm10,
      simPm10: simInfo.components.pm10,
      o3: item.components.o3,
      simO3: simInfo.components.o3,
      no2: item.components.no2,
      co: item.components.co / 1145, // in ppm
      so2: item.components.so2
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-500" />
            ML Predictive Intel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Atmospheric projections, physical simulators and solar generation forecasting</p>
        </div>
        <div className="flex gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("aqi")}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === "aqi" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
          >
            <Wind className="w-4 h-4" /> AQI Predictor & Forecast
          </button>
          <button
            onClick={() => setActiveTab("solar")}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === "solar" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
          >
            <Sun className="w-4 h-4" /> Solar Generation Forecast
          </button>
        </div>
      </div>

      {activeTab === "solar" ? (
        // Solar Forecast Tab View
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-white">Power Output Forecast</h3>
              <p className="text-xs text-slate-400">ML-driven predictions with AQI-integrated models</p>
            </div>
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
              {["24h", "30d"].map(h => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${horizon === h ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Main forecast chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Predicted vs Actual Generation (MW)</h4>
                <p className="text-xs text-slate-400">Ensemble model output with AQI-adjusted corrections</p>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <CheckCircle className="w-3 h-3" /> 94.7% Accuracy
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey={xKey} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} interval={horizon === "24h" ? 3 : 4} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {horizon === "24h" && <ReferenceLine x="14:00" stroke="#f43f5e" strokeDasharray="4 4" label={{ value: "Peak", fill: "#f43f5e", fontSize: 11 }} />}
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#f59e0b" fill="url(#fg1)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" fill="url(#fg2)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AQI impact chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-1">AQI Impact on Generation</h4>
            <p className="text-xs text-slate-400 mb-4">Correlation between air quality index and output reduction</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} interval={3} />
                <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="predicted" name="Output (MW)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="aqi" name="AQI" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Model metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">Model Performance Metrics</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Model", "RMSE", "MAE", "R²", "Status"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs text-slate-400 font-medium uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {modelMetrics.map(m => (
                    <tr key={m.model} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                        {m.status === "primary" && <Layers className="w-3.5 h-3.5 text-amber-400" />}
                        {m.model}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{m.rmse}</td>
                      <td className="py-3 px-3 text-slate-300">{m.mae}</td>
                      <td className="py-3 px-3 text-emerald-400 font-medium">{m.r2}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${statusBadge[m.status]}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // AQI Predictor & Forecast Tab View
        <div className="space-y-6">
          {/* Location Picker & Control Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                <Wind className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Selected Location</p>
                <h4 className="text-sm font-semibold text-white truncate max-w-[250px]">{locationName}</h4>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter city (e.g., London, Chennai)"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-base md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all duration-75"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleUseGPS}
                disabled={loading}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold px-3 py-2 rounded-lg text-xs transition-all duration-75 flex items-center gap-1.5"
                title="Locate via device GPS"
              >
                <Navigation className="w-3.5 h-3.5" />
                GPS
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {isDemoMode && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-lg text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                <span>
                  <strong>Demo Mode Active:</strong> OpenWeather API key is not configured in environment settings. Telemetry is being simulated with realistic meteorological variations.
                </span>
              </div>
              <Badge className="bg-amber-500 text-slate-950 font-bold shrink-0">Demo Mode</Badge>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Synthesizing live geospatial and forecast telemetry...</p>
            </div>
          ) : !aqiForecast ? (
            <div className="text-center py-16 text-xs text-slate-500 border border-slate-850 rounded-xl bg-slate-900/30">
              Please enter a location or click GPS to generate predicting trends.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Three Main Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Current AQI */}
                <div className={`border rounded-xl p-4 bg-slate-900 flex flex-col justify-between gap-3 relative overflow-hidden transition-all ${
                  isSimulationActive ? simCurrentCategory?.borderColor : currentCategory?.borderColor
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current AQI</span>
                    <Badge className={isSimulationActive ? simCurrentCategory?.bgColor + " " + simCurrentCategory?.textColor : currentCategory?.bgColor + " " + currentCategory?.textColor}>
                      {isSimulationActive ? simCurrentCategory?.label : currentCategory?.label}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold tracking-tight ${isSimulationActive ? simCurrentCategory?.textColor : currentCategory?.textColor}`}>
                      {isSimulationActive ? simulatedCurrent?.aqi : currentAqiInfo?.aqi}
                    </span>
                    {isSimulationActive && (
                      <span className="text-xs text-slate-500 line-through">
                        {currentAqiInfo?.aqi} actual
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Dominant: <strong className="text-slate-200">{(isSimulationActive ? simulatedCurrent?.dominant : currentAqiInfo?.dominant)?.toUpperCase()}</strong>
                  </div>
                  <div className={`absolute top-0 right-0 w-24 h-24 translate-x-8 -translate-y-8 rounded-full blur-2xl opacity-10 ${
                    isSimulationActive ? simCurrentCategory?.progressColor : currentCategory?.progressColor
                  }`} />
                </div>

                {/* 2. Next Hour Prediction */}
                <div className={`border rounded-xl p-4 bg-slate-900 flex flex-col justify-between gap-3 relative overflow-hidden transition-all ${
                  isSimulationActive ? simNextHourCategory?.borderColor : nextHourCategory?.borderColor
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next Hour AQI</span>
                    <Badge className={isSimulationActive ? simNextHourCategory?.bgColor + " " + simNextHourCategory?.textColor : nextHourCategory?.bgColor + " " + nextHourCategory?.textColor}>
                      {isSimulationActive ? simNextHourCategory?.label : nextHourCategory?.label}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold tracking-tight ${isSimulationActive ? simNextHourCategory?.textColor : nextHourCategory?.textColor}`}>
                      {isSimulationActive ? simulatedNextHour?.aqi : nextHourAqiInfo?.aqi}
                    </span>
                    {isSimulationActive && (
                      <span className="text-xs text-slate-500 line-through">
                        {nextHourAqiInfo?.aqi} actual
                      </span>
                    )}
                  </div>
                  {/* Performance arrow */}
                  {currentAqiInfo && nextHourAqiInfo && (
                    <div className="text-[11px] flex items-center gap-1">
                      {nextHourAqiInfo.aqi > currentAqiInfo.aqi ? (
                        <span className="text-red-400 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> +{Math.round(((nextHourAqiInfo.aqi - currentAqiInfo.aqi) / currentAqiInfo.aqi) * 100)}% increase</span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-0.5"><ArrowDownRight className="w-3.5 h-3.5" /> -{Math.round(((currentAqiInfo.aqi - nextHourAqiInfo.aqi) / currentAqiInfo.aqi) * 100)}% decrease</span>
                      )}
                      <span className="text-slate-500">from current</span>
                    </div>
                  )}
                  <div className={`absolute top-0 right-0 w-24 h-24 translate-x-8 -translate-y-8 rounded-full blur-2xl opacity-10 ${
                    isSimulationActive ? simNextHourCategory?.progressColor : nextHourCategory?.progressColor
                  }`} />
                </div>

                {/* 3. Next Day Prediction */}
                <div className={`border rounded-xl p-4 bg-slate-900 flex flex-col justify-between gap-3 relative overflow-hidden transition-all ${
                  isSimulationActive ? simNextDayCategory?.borderColor : nextDayCategory?.borderColor
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next Day AQI</span>
                    <Badge className={isSimulationActive ? simNextDayCategory?.bgColor + " " + simNextDayCategory?.textColor : nextDayCategory?.bgColor + " " + nextDayCategory?.textColor}>
                      {isSimulationActive ? simNextDayCategory?.label : nextDayCategory?.label}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold tracking-tight ${isSimulationActive ? simNextDayCategory?.textColor : nextDayCategory?.textColor}`}>
                      {isSimulationActive ? simulatedNextDay?.aqi : nextDayAqiInfo?.aqi}
                    </span>
                    {isSimulationActive && (
                      <span className="text-xs text-slate-500 line-through">
                        {nextDayAqiInfo?.aqi} actual
                      </span>
                    )}
                  </div>
                  {/* Daily Trend */}
                  {currentAqiInfo && nextDayAqiInfo && (
                    <div className="text-[11px] flex items-center gap-1">
                      {nextDayAqiInfo.aqi > currentAqiInfo.aqi ? (
                        <span className="text-red-400 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> Spike expected (+{Math.round(((nextDayAqiInfo.aqi - currentAqiInfo.aqi) / currentAqiInfo.aqi) * 100)}%)</span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-0.5"><ArrowDownRight className="w-3.5 h-3.5" /> Clearing expected (-{Math.round(((currentAqiInfo.aqi - nextDayAqiInfo.aqi) / currentAqiInfo.aqi) * 100)}%)</span>
                      )}
                    </div>
                  )}
                  <div className={`absolute top-0 right-0 w-24 h-24 translate-x-8 -translate-y-8 rounded-full blur-2xl opacity-10 ${
                    isSimulationActive ? simNextDayCategory?.progressColor : nextDayCategory?.progressColor
                  }`} />
                </div>
              </div>

              {/* What-If Simulator Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-500 animate-bounce" />
                    <h4 className="text-sm font-semibold text-white">Meteorological What-If Simulator</h4>
                  </div>
                  {isSimulationActive && (
                    <button
                      onClick={handleResetSliders}
                      className="text-amber-500 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset Variables
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sliders Container */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Slider 1: Wind Speed */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300 flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-blue-400" /> Wind Velocity Adjustment</span>
                        <span className={windDelta === 0 ? "text-slate-400" : windDelta > 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                          {windDelta === 0 ? "None (Current)" : windDelta > 0 ? `+${windDelta.toFixed(1)} m/s (Dispersal)` : `${windDelta.toFixed(1)} m/s (Stagnation)`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-5"
                        max="15"
                        step="0.5"
                        value={windDelta}
                        onChange={(e) => setWindDelta(parseFloat(e.target.value))}
                        className="w-full h-1.5 py-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>-5 m/s (Dead Calm)</span>
                        <span>Baseline</span>
                        <span>+15 m/s (Strong Breeze)</span>
                      </div>
                    </div>

                    {/* Slider 2: Temperature */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300 flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-red-400" /> Ambient Temp Delta (Ozone Reaction)</span>
                        <span className={tempDelta === 0 ? "text-slate-400" : tempDelta > 0 ? "text-red-400 font-semibold" : "text-blue-400 font-semibold"}>
                          {tempDelta === 0 ? "None (Current)" : tempDelta > 0 ? `+${tempDelta.toFixed(1)}°C (Accelerates O₃)` : `${tempDelta.toFixed(1)}°C (Suppresses O₃)`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.5"
                        value={tempDelta}
                        onChange={(e) => setTempDelta(parseFloat(e.target.value))}
                        className="w-full h-1.5 py-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>-10°C (Cool Wave)</span>
                        <span>Baseline</span>
                        <span>+10°C (Heat Dome)</span>
                      </div>
                    </div>

                    {/* Slider 3: Human Emissions */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Emission Source Strength (Traffic/Industry)</span>
                        <span className={emissionDelta === 0 ? "text-slate-400" : emissionDelta < 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                          {emissionDelta === 0 ? "Unchanged" : emissionDelta < 0 ? `${emissionDelta}% reduction` : `+${emissionDelta}% surge`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-80"
                        max="100"
                        step="5"
                        value={emissionDelta}
                        onChange={(e) => setEmissionDelta(parseInt(e.target.value))}
                        className="w-full h-1.5 py-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>-80% (Industrial Lock)</span>
                        <span>Baseline</span>
                        <span>+100% (Grid Overload)</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulation output widget */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-amber-500" /> Simulation Forecast
                      </p>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Current AQI</span>
                          <span className={`font-bold ${isSimulationActive ? simCurrentCategory?.textColor : currentCategory?.textColor}`}>
                            {isSimulationActive ? `${simulatedCurrent?.aqi} (${simCurrentCategory?.label})` : `${currentAqiInfo?.aqi} (${currentCategory?.label})`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Next Hour AQI</span>
                          <span className={`font-bold ${isSimulationActive ? simNextHourCategory?.textColor : nextHourCategory?.textColor}`}>
                            {isSimulationActive ? `${simulatedNextHour?.aqi} (${simNextHourCategory?.label})` : `${nextHourAqiInfo?.aqi} (${nextHourCategory?.label})`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Next Day AQI</span>
                          <span className={`font-bold ${isSimulationActive ? simNextDayCategory?.textColor : nextDayCategory?.textColor}`}>
                            {isSimulationActive ? `${simulatedNextDay?.aqi} (${simNextDayCategory?.label})` : `${nextDayAqiInfo?.aqi} (${nextDayCategory?.label})`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isSimulationActive && (
                      <div className="border-t border-slate-800 pt-2.5 mt-2.5">
                        {simulatedNextDay && nextDayAqiInfo && (
                          <p className="text-[10px] leading-relaxed text-slate-300">
                            {simulatedNextDay.aqi < nextDayAqiInfo.aqi ? (
                              <span className="text-emerald-400 font-medium">✓ Adjustments would lower next-day AQI by {nextDayAqiInfo.aqi - simulatedNextDay.aqi} points compared to baseline.</span>
                            ) : simulatedNextDay.aqi > nextDayAqiInfo.aqi ? (
                              <span className="text-red-400 font-medium">⚠️ Adjustments would worsen next-day AQI by {simulatedNextDay.aqi - nextDayAqiInfo.aqi} points.</span>
                            ) : (
                              <span className="text-slate-400">Adjustments yield net-zero atmospheric modifications.</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main hourly trend chart with simulated lines overlay */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Hourly Predictive Trend</h4>
                    <p className="text-xs text-slate-400">Next 24 hours predicted concentrations & overlay simulations</p>
                  </div>
                  <div className="flex flex-wrap gap-1 bg-slate-950 border border-slate-850 p-1 rounded-lg">
                    {["aqi", "pm2_5", "pm10", "o3"].map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setSelectedChartMetric(metric)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          selectedChartMetric === metric ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {metric === "pm2_5" ? "PM2.5" : metric === "pm10" ? "PM10" : metric === "o3" ? "Ozone" : "AQI"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={aqiChartData}>
                      <defs>
                        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} interval={3} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#fff" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />

                      {selectedChartMetric === "aqi" && (
                        <>
                          <Area type="monotone" dataKey="aqi" name="Predicted AQI (Baseline)" stroke="#d97706" fill="url(#aqiGrad)" strokeWidth={2} dot={false} />
                          {isSimulationActive && (
                            <Area type="monotone" dataKey="simAqi" name="Simulated AQI" stroke="#a78bfa" fill="url(#simGrad)" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                          )}
                        </>
                      )}

                      {selectedChartMetric === "pm2_5" && (
                        <>
                          <Area type="monotone" dataKey="pm2_5" name="PM2.5 (μg/m³)" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2} dot={false} />
                          {isSimulationActive && (
                            <Line type="monotone" dataKey="simPm2_5" name="Simulated PM2.5" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                          )}
                        </>
                      )}

                      {selectedChartMetric === "pm10" && (
                        <>
                          <Area type="monotone" dataKey="pm10" name="PM10 (μg/m³)" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} dot={false} />
                          {isSimulationActive && (
                            <Line type="monotone" dataKey="simPm10" name="Simulated PM10" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                          )}
                        </>
                      )}

                      {selectedChartMetric === "o3" && (
                        <>
                          <Area type="monotone" dataKey="o3" name="Ozone O₃ (μg/m³)" stroke="#ec4899" fill="rgba(236, 72, 153, 0.1)" strokeWidth={2} dot={false} />
                          {isSimulationActive && (
                            <Line type="monotone" dataKey="simO3" name="Simulated Ozone" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                          )}
                        </>
                      )}

                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pollutants Breakdown Grid (8 fundamental pollutants) */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Fundamental Pollutants Array</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {currentEntry && Object.entries(currentEntry.components).map(([pollutant, value]) => {
                    const rawNextHour = nextHourEntry?.components[pollutant] || value;
                    const rawNextDay = nextDayEntry?.components[pollutant] || value;

                    const simVal = simulatedCurrent?.components[pollutant] ?? value;
                    const simHour = simulatedNextHour?.components[pollutant] ?? rawNextHour;
                    const simDay = simulatedNextDay?.components[pollutant] ?? rawNextDay;

                    // Compute individual AQI details if applicable
                    const pollAqi = ["pm2_5", "pm10", "no2", "so2", "co", "o3"].includes(pollutant)
                      ? calculateIndividualAqi(pollutant, value)
                      : null;
                    const simPollAqi = ["pm2_5", "pm10", "no2", "so2", "co", "o3"].includes(pollutant)
                      ? calculateIndividualAqi(pollutant, simVal)
                      : null;

                    // Display thresholds
                    const limit = pollutant === "pm2_5" ? 35 : pollutant === "pm10" ? 150 : pollutant === "no2" ? 100 : 200;

                    return (
                      <div key={pollutant} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                            {pollutant === "pm2_5" ? "PM2.5" : pollutant === "pm10" ? "PM10" : pollutant.toUpperCase()}
                          </span>
                          {pollAqi !== null && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              isSimulationActive ? getAqiCategory(simPollAqi).bgColor + " " + getAqiCategory(simPollAqi).textColor : getAqiCategory(pollAqi).bgColor + " " + getAqiCategory(pollAqi).textColor
                            }`}>
                              Sub-AQI: {isSimulationActive ? simPollAqi : pollAqi}
                            </span>
                          )}
                        </div>

                        {/* Concentration values display */}
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-white">
                              {formatPollutantVal(isSimulationActive ? simVal : value, pollutant)}
                            </span>
                            {isSimulationActive && (
                              <span className="text-[10px] text-slate-500 line-through">
                                {formatPollutantVal(value, pollutant)}
                              </span>
                            )}
                          </div>
                          {/* Mini Progress Bar compared to standard safety thresholds */}
                          <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${Math.min(((isSimulationActive ? simVal : value) / limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Forecast Hour vs Day */}
                        <div className="border-t border-slate-800 pt-2.5 text-[10px] text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Next Hour:</span>
                            <strong className="text-slate-300">
                              {formatPollutantVal(isSimulationActive ? simHour : rawNextHour, pollutant)}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Next Day:</span>
                            <strong className="text-slate-300">
                              {formatPollutantVal(isSimulationActive ? simDay : rawNextDay, pollutant)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom row: weather inputs and descriptive analysis */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Meteorological fundamental variables panel */}
                <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1 text-slate-400">
                    <Info className="w-3.5 h-3.5 text-slate-400" /> Physical Weather Array
                  </h4>
                  {weatherDetails ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex items-center gap-2.5">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Temperature</p>
                          <p className="font-semibold text-white">{weatherDetails.temperature.toFixed(1)} °C</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex items-center gap-2.5">
                        <Wind className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Wind Velocity</p>
                          <p className="font-semibold text-white">{weatherDetails.windSpeed.toFixed(1)} m/s</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex items-center gap-2.5">
                        <Droplets className="w-4 h-4 text-teal-400" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Humidity</p>
                          <p className="font-semibold text-white">{weatherDetails.humidity}%</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex items-center gap-2.5">
                        <Gauge className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Barometer</p>
                          <p className="font-semibold text-white">{weatherDetails.pressure} hPa</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg col-span-2 text-center text-[10px] text-slate-400 font-medium">
                        Weather Overlay: <span className="capitalize text-amber-400 font-semibold">{weatherDetails.description}</span> · Clouds <span className="text-blue-400 font-semibold">{weatherDetails.clouds}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">Weather details unavailable.</p>
                  )}
                </div>

                {/* Qualitative Predictive Advisory */}
                <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 text-slate-400">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Smart Advisory & Diagnostics
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {generateAqiAdvisory()}
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[10px] text-slate-400 flex items-start gap-2 mt-4">
                    <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      Predictions are derived via our meteorological atmospheric models combined with real-time OpenWeather data feeds. Wind speeds and human emission strength remain the most significant parameters regulating local concentrations.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}