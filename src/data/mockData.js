// Mock data for Solar Power Forecasting with AQI Integration

export const kpiData = {
  currentOutput: { value: 4.82, unit: "MW", change: +3.2 },
  forecastAccuracy: { value: 94.7, unit: "%", change: +1.1 },
  aqiIndex: { value: 68, label: "Moderate", change: -5 },
  dailyYield: { value: 38.4, unit: "MWh", change: +2.8 },
  co2Saved: { value: 27.1, unit: "tons", change: +2.1 },
  efficiency: { value: 87.3, unit: "%", change: -0.4 },
};

export const forecastData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  predicted: i < 6 || i > 20 ? 0 : Math.max(0, Math.sin(((i - 6) * Math.PI) / 14) * 5.2 + Math.random() * 0.4 - 0.2),
  actual: i < 6 || i > 20 ? 0 : Math.max(0, Math.sin(((i - 6) * Math.PI) / 14) * 4.9 + Math.random() * 0.5 - 0.25),
  aqi: 45 + Math.floor(Math.sin(i / 4) * 20 + Math.random() * 10),
}));

export const weeklyData = [
  { day: "Mon", output: 32.1, predicted: 33.0, aqi: 55 },
  { day: "Tue", output: 28.4, predicted: 29.1, aqi: 72 },
  { day: "Wed", output: 35.6, predicted: 34.8, aqi: 43 },
  { day: "Thu", output: 38.4, predicted: 37.9, aqi: 38 },
  { day: "Fri", output: 30.2, predicted: 31.5, aqi: 88 },
  { day: "Sat", output: 36.8, predicted: 36.2, aqi: 51 },
  { day: "Sun", output: 39.1, predicted: 38.7, aqi: 35 },
];

export const monthlyData = Array.from({ length: 30 }, (_, i) => ({
  date: `Apr ${i + 1}`,
  output: 25 + Math.random() * 20,
  predicted: 26 + Math.random() * 18,
  aqi: 30 + Math.random() * 80,
}));

export const aqiBreakdown = [
  { pollutant: "PM2.5", value: 18.4, unit: "μg/m³", impact: "Low" },
  { pollutant: "PM10", value: 35.2, unit: "μg/m³", impact: "Moderate" },
  { pollutant: "NO₂", value: 42.1, unit: "ppb", impact: "Low" },
  { pollutant: "O₃", value: 67.8, unit: "ppb", impact: "Moderate" },
  { pollutant: "SO₂", value: 8.3, unit: "ppb", impact: "Low" },
  { pollutant: "CO", value: 0.6, unit: "ppm", impact: "Low" },
];

export const dataSources = [
  { id: 1, name: "NASA POWER API", type: "Satellite", status: "active", lastSync: "2 min ago", records: 14823 },
  { id: 2, name: "OpenAQ Network", type: "AQI Sensor", status: "active", lastSync: "5 min ago", records: 9341 },
  { id: 3, name: "NOAA Weather API", type: "Weather", status: "active", lastSync: "1 min ago", records: 22190 },
  { id: 4, name: "Local IoT Sensors", type: "IoT", status: "warning", lastSync: "18 min ago", records: 5762 },
  { id: 5, name: "MERRA-2 Reanalysis", type: "Satellite", status: "active", lastSync: "30 min ago", records: 41005 },
  { id: 6, name: "Ground Station #7", type: "IoT", status: "offline", lastSync: "2 hrs ago", records: 3120 },
];

export const modelMetrics = [
  { model: "XGBoost", rmse: 0.31, mae: 0.24, r2: 0.967, status: "active" },
  { model: "LSTM", rmse: 0.29, mae: 0.22, r2: 0.971, status: "active" },
  { model: "Ensemble", rmse: 0.24, mae: 0.19, r2: 0.979, status: "primary" },
  { model: "Linear Baseline", rmse: 0.58, mae: 0.47, r2: 0.912, status: "baseline" },
];

export const solarPlants = [
  { id: 1, name: "Solar Farm Alpha", location: "Phoenix, AZ", capacity: "10 MW", output: 8.4, efficiency: 84, aqi: 42 },
  { id: 2, name: "Desert Array Beta", location: "Las Vegas, NV", capacity: "7.5 MW", output: 6.1, efficiency: 81, aqi: 67 },
  { id: 3, name: "Mountain Ridge", location: "Denver, CO", capacity: "5 MW", output: 4.2, efficiency: 84, aqi: 38 },
  { id: 4, name: "Coastal Plant Delta", location: "San Diego, CA", capacity: "8 MW", output: 5.9, efficiency: 74, aqi: 72 },
];

export const alerts = [
  { id: 1, severity: "warning", message: "AQI spike forecasted for tomorrow 14:00–17:00. Expected output drop: 12%", time: "10 min ago" },
  { id: 2, severity: "info", message: "Model retrained with last 7 days data. Accuracy improved by 0.8%", time: "1 hr ago" },
  { id: 3, severity: "error", message: "Ground Station #7 offline. Manual inspection required.", time: "2 hrs ago" },
  { id: 4, severity: "success", message: "Daily generation target met: 38.4 MWh / 37.0 MWh target", time: "3 hrs ago" },
];