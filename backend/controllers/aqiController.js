import AqiData from '../models/AqiData.js';

function getHealthAdvice(aqi) {
  if (aqi <= 50) return { category: 'Good', advice: 'Air quality is satisfactory.', color: 'text-emerald-400 bg-emerald-500/10' };
  if (aqi <= 100) return { category: 'Moderate', advice: 'Acceptable quality.', color: 'text-yellow-400 bg-yellow-500/10' };
  if (aqi <= 200) return { category: 'Unhealthy', advice: 'Mask recommended outdoors.', color: 'text-orange-400 bg-orange-500/10' };
  return { category: 'Hazardous', advice: 'Stay indoors.', color: 'text-red-400 bg-red-500/10' };
}

export const getAqiData = async (req, res) => {
  try {
    let { lat, lon, city } = req.query;
    let locationName = city || 'Custom Coordinates';
    const apiKey = process.env.OPENWEATHER_API_KEY || '6130f48eacdd44dbb997851fa22f83fe';

    // 1. Geocoding if city is provided
    if (city) {
      const geoRes = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0) return res.status(404).json({ error: 'City not found' });
      lat = geoData[0].lat;
      lon = geoData[0].lon;
      locationName = geoData[0].name;
    }

    if (!lat || !lon) return res.status(400).json({ error: 'Provide lat/lon or city query parameter' });

    // 2. Fetch OpenWeather Air Pollution
    const aqiRes = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const aqiJson = await aqiRes.json();
    
    // OpenWeather API returns AQI on a scale of 1-5. Map to EPA scale estimation.
    let simulatedEpaAqi = 40; // Default fallback good
    if (aqiJson && aqiJson.list && aqiJson.list.length > 0) {
       const rawAqi = aqiJson.list[0].main.aqi; 
       simulatedEpaAqi = rawAqi * 40; // 1->40(Good), 2->80, 3->120, 4->160, 5->200+(Hazardous)
    }

    // 3. Fetch Weather Config
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const weatherData = await weatherRes.json();
    const temp = weatherData.main ? weatherData.main.temp : 25;
    const humidity = weatherData.main ? weatherData.main.humidity : 50;

    // 4. ML Solar Prediction (Simple Regression mapping)
    // Solar Model base = 1000 W/m2. Penalties for high humidity, deviation from 25°C baseline, and smog (AQI)
    let solarPrediction = 1000 - (humidity * 3) - (Math.abs(temp - 25) * 5) - (simulatedEpaAqi * 2);
    if (solarPrediction < 0) solarPrediction = 0;

    // 5. Health Advice Logic
    const health = getHealthAdvice(simulatedEpaAqi);

    // 6. DB History Save
    const record = new AqiData({
      location: locationName,
      lat, lon,
      aqi: simulatedEpaAqi,
      temperature: temp,
      humidity: humidity,
      healthAdvice: health.category,
      solarPrediction: solarPrediction
    });
    await record.save();

    res.json({
      location: locationName,
      coordinates: { lat, lon },
      aqi: simulatedEpaAqi,
      temperature: temp,
      humidity: humidity,
      solarPrediction: solarPrediction.toFixed(2),
      health: health
    });
  } catch (err) {
    console.error("AQI OpenWeather Fetch Error: ", err);
    res.status(500).json({ error: 'Failed to process AQI data', details: err.message });
  }
};

export const getHistoricalAqi = async (req, res) => {
  try {
    const data = await AqiData.find().sort({ timestamp: -1 }).limit(10);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Database history fetch error' });
  }
};
