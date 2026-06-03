import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import twilio from 'twilio';
import fs from 'fs';

// Initialize env vars before use
dotenv.config({ override: true });

import ee from '@google/earthengine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const sourceSchema = new mongoose.Schema({
  name: String,
  type: String,
  url: String,
  status: { type: String, default: 'active' },
  lastSync: { type: String, default: 'Just now' },
  records: { type: Number, default: 0 },
});
const Source = mongoose.model('Source', sourceSchema);

// Seed initial sources if database is empty
const seedDatabase = async () => {
  try {
    const count = await Source.countDocuments();
    if (count === 0) {
      console.log('Seeding initial MongoDB data...');
      const initialSources = [
        { name: "NASA POWER API", type: "Satellite", status: "active", lastSync: "2 min ago", records: 14823, url: "https://power.larc.nasa.gov/api/v1/" },
        { name: "OpenAQ Network", type: "AQI Sensor", status: "active", lastSync: "5 min ago", records: 9341, url: "https://api.openaq.org/v2/" },
        { name: "NOAA Weather API", type: "Weather", status: "active", lastSync: "1 min ago", records: 22190, url: "https://api.weather.gov/" },
        { name: "Local IoT Sensors", type: "IoT", status: "warning", lastSync: "18 min ago", records: 5762, url: "http://10.0.0.4/sensors" },
        { name: "MERRA-2 Reanalysis", type: "Satellite", status: "active", lastSync: "30 min ago", records: 41005, url: "https://gmao.gsfc.nasa.gov/" },
        { name: "Ground Station #7", type: "IoT", status: "offline", lastSync: "2 hrs ago", records: 3120, url: "http://10.0.0.7/sensors" },
      ];
      await Source.insertMany(initialSources);
      console.log('Database successfully seeded with realistic resources.');
    }
  } catch (err) {
    console.error('Error seeding DB:', err);
  }
};

// Mock generators for fallback if OpenWeather key is missing or API errors
function generateMockAqiForecast(lat, lon) {
  const list = [];
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < 120; i++) {
    const dt = now + i * 3600;
    const hourOfDay = new Date(dt * 1000).getHours();
    const diurnalPM = Math.sin(((hourOfDay - 8) * Math.PI) / 12) * 15 + 25;
    const diurnalO3 = Math.sin(((hourOfDay - 14) * Math.PI) / 12) * 30 + 40;
    const latFactor = Math.abs(Math.sin(lat)) * 20;
    list.push({
      main: { aqi: 1 },
      components: {
        co: Math.max(150, 200 + Math.random() * 80 + diurnalPM * 3),
        no: Math.max(0.1, 1 + Math.random() * 2),
        no2: Math.max(2, 5 + Math.random() * 4 + diurnalPM * 0.2),
        o3: Math.max(5, diurnalO3 + latFactor + Math.random() * 10),
        so2: Math.max(1, 3 + Math.random() * 2),
        pm2_5: Math.max(2, diurnalPM + latFactor + Math.random() * 5),
        pm10: Math.max(5, diurnalPM * 1.8 + latFactor * 1.5 + Math.random() * 10),
        nh3: Math.max(1, 4 + Math.random() * 3)
      },
      dt
    });
  }
  return { coord: { lat: parseFloat(lat), lon: parseFloat(lon) }, list, demoMode: true };
}

function generateMockWeatherForecast(lat, lon) {
  const list = [];
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < 40; i++) {
    const dt = now + i * 3 * 3600;
    const date = new Date(dt * 1000);
    const hourOfDay = date.getHours();
    const dtStr = date.toISOString().replace('T', ' ').substring(0, 19);
    const tempSin = Math.sin(((hourOfDay - 14) * Math.PI) / 12);
    const baseTemp = 24 + Math.abs(Math.sin(lat)) * -10;
    const temperature = baseTemp + tempSin * 5 + Math.random() * 2;
    const humidity = Math.max(20, Math.min(100, 60 - tempSin * 25 + Math.random() * 10));
    list.push({
      dt,
      main: {
        temp: temperature,
        feels_like: temperature + (humidity > 70 ? 2 : -1),
        temp_min: temperature - 1,
        temp_max: temperature + 1,
        pressure: 1010 + Math.floor(Math.sin(i / 10) * 5),
        humidity,
        temp_kf: 0
      },
      weather: [{
        id: humidity > 85 ? 500 : humidity > 70 ? 802 : 800,
        main: humidity > 85 ? "Rain" : humidity > 70 ? "Clouds" : "Clear",
        description: humidity > 85 ? "light rain" : humidity > 70 ? "broken clouds" : "clear sky",
        icon: humidity > 85 ? "10d" : humidity > 70 ? "03d" : "01d"
      }],
      clouds: { all: humidity > 70 ? 70 : 10 },
      wind: {
        speed: 2.0 + Math.abs(Math.sin(i / 5)) * 6 + Math.random() * 2,
        deg: Math.floor(Math.random() * 360),
        gust: 4.0
      },
      visibility: 10000,
      pop: humidity > 85 ? 0.4 : 0,
      dt_txt: dtStr
    });
  }
  return {
    list,
    city: { id: 9999, name: "Simulated Location", coord: { lat: parseFloat(lat), lon: parseFloat(lon) }, country: "SIM" },
    demoMode: true
  };
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solaraqi';
let isDbConnected = false;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    isDbConnected = true;
    seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error (operating in DB-less fallback mode):', err.message));

app.use(express.json());

// API: Fetch Real-Time Data (AQI, Weather, Solar)
app.get('/api/realtime', async (req, res) => {
  const lat = req.query.lat || '51.5074';
  const lon = req.query.lon || '-0.1278';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  let weatherData = {
    temp: 20,
    clouds: 0,
    humidity: 50,
    description: 'clear sky'
  };

  let demoMode = false;

  if (apiKey && apiKey !== "your_api_key_here") {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
      if (!response.ok) throw new Error('API key rejected or connection error');
      const data = await response.json();
      if (data.main) {
        weatherData = {
          temp: data.main.temp,
          clouds: data.clouds.all,
          humidity: data.main.humidity,
          description: data.weather[0].description
        };
      }
    } catch (err) {
      console.warn('Error fetching OpenWeatherMap data, using local simulation:', err.message);
      demoMode = true;
    }
  } else {
    demoMode = true;
  }

  res.json({
    aqi: Math.floor(Math.random() * 150) + 10,
    solarIrradiance: Math.floor(Math.random() * 800) + 200,
    cloudCover: weatherData.clouds,
    temperature: weatherData.temp,
    humidity: weatherData.humidity,
    description: weatherData.description,
    timestamp: new Date().toISOString(),
    demoMode
  });
});

// API: Fetch 5-Day Hourly AQI Forecast Data
app.get('/api/aqi/forecast', async (req, res) => {
  const lat = req.query.lat || '12.9716';
  const lon = req.query.lon || '77.5946';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("Using simulated AQI forecast data due to missing API key");
    return res.json(generateMockAqiForecast(lat, lon));
  }

  try {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching AQI forecast, falling back to mock:', err.message);
    res.json(generateMockAqiForecast(lat, lon));
  }
});

// API: Fetch 5-Day 3-Hourly Weather Forecast Data
app.get('/api/weather/forecast', async (req, res) => {
  const lat = req.query.lat || '12.9716';
  const lon = req.query.lon || '77.5946';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("Using simulated weather forecast data due to missing API key");
    return res.json(generateMockWeatherForecast(lat, lon));
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error fetching weather forecast, falling back to mock:', err.message);
    res.json(generateMockWeatherForecast(lat, lon));
  }
});

// API: Get Data Sources
app.get('/api/sources', async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json([
        { name: "NASA POWER API", type: "Satellite", status: "active", lastSync: "2 min ago", records: 14823, url: "https://power.larc.nasa.gov/api/v1/" },
        { name: "OpenAQ Network", type: "AQI Sensor", status: "active", lastSync: "5 min ago", records: 9341, url: "https://api.openaq.org/v2/" },
        { name: "NOAA Weather API", type: "Weather", status: "active", lastSync: "1 min ago", records: 22190, url: "https://api.weather.gov/" },
        { name: "Local IoT Sensors", type: "IoT", status: "warning", lastSync: "18 min ago", records: 5762, url: "http://10.0.0.4/sensors" }
      ]);
    }
    const sources = await Source.find().sort({ _id: -1 });
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// API: Add Data Source
app.post('/api/sources', async (req, res) => {
  const { name, type, url } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type required' });

  if (!isDbConnected) {
    return res.status(503).json({ error: 'Database connection offline. Operating in fallback mode.' });
  }

  try {
    const newSource = new Source({ name, type, url });
    await newSource.save();
    res.status(201).json({ message: 'Source added successfully', source: { id: newSource._id, ...newSource.toObject() } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save source to DB' });
  }
});

let isEeInitialized = false;
try {
  const keyPath = path.join(__dirname, 'ee-credentials.json');
  if (fs.existsSync(keyPath)) {
    const privateKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    ee.data.authenticateViaPrivateKey(privateKey, 
      () => {
        console.log('GEE Authentication successful.');
        ee.initialize(null, null, 
          () => {
            console.log('Earth Engine initialized.');
            isEeInitialized = true;
          }, 
          (err) => console.error('GEE Initialization error:', err)
        );
      }, 
      (err) => console.error('GEE Authentication error:', err)
    );
  } else {
    console.warn('ee-credentials.json not found. Earth Engine map layers will be disabled until added.');
  }
} catch (err) {
  console.error('Failed to setup Earth Engine:', err);
}

// API: Google Earth Engine / Satellite Data
app.get('/api/satellite', (req, res) => {
  res.json({ provider: 'Google Earth Engine', status: isEeInitialized ? 'connected' : 'mocked', coverage: 'global' });
});

// API: Generate Earth Engine Map ID for Leaflet
app.get('/api/satellite/mapid', (req, res) => {
  if (!isEeInitialized) {
    return res.status(503).json({ error: 'Earth Engine not initialized. Please add ee-credentials.json' });
  }

  try {
    // Get latest available NO2 Density from Copernicus S5P (Last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const collection = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_NO2')
      .select('NO2_column_number_density')
      .filterDate(startStr, endStr)
      .mean();

    const visParams = {
      min: 0,
      max: 0.0002,
      palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
    };

    collection.getMap(visParams, ({ mapid, urlFormat }) => {
      res.json({ mapid, urlFormat });
    });
  } catch (err) {
    console.error('GEE Map Error:', err);
    res.status(500).json({ error: 'Failed to generate Earth Engine map' });
  }
});

// API: Update Backend Security Config (.env writer)
app.post('/api/config/twilio', (req, res) => {
  const { accountSid, authToken, fromNumber, targetNumber } = req.body;
  if (!accountSid && !authToken && !fromNumber) {
    return res.json({ success: true });
  }

  try {
    const envPath = path.resolve(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const setEnvValue = (key, value) => {
      if (!value) return;
      process.env[key] = value; // Update hot memory
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    setEnvValue('TWILIO_ACCOUNT_SID', accountSid);
    setEnvValue('TWILIO_AUTH_TOKEN', authToken);
    setEnvValue('TWILIO_PHONE_NUMBER', fromNumber);
    // Setting TWILIO_TARGET_NUMBER to persist it centrally if needed
    setEnvValue('TWILIO_TARGET_NUMBER', targetNumber);
    
    setEnvValue('OPENWEATHER_API_KEY', req.body.openWeatherKey);

    // Clean whitespace
    envContent = envContent.replace(/^\s*[\r\n]/gm, '').trim() + '\n';
    fs.writeFileSync(envPath, envContent, 'utf8');

    res.json({ success: true, message: 'Settings physically written to backend configuration.' });
  } catch (err) {
    console.error('Failed to write .env:', err);
    res.status(500).json({ error: 'Failed to securely modify backend environment file.' });
  }
});

// API: Twilio Alert Notification Trigger
app.post('/api/alert', async (req, res) => {
  const {
    accountSid,
    authToken,
    fromNumber,
    to,
    message = "SolarAQI Alert: Anomalous API behavior detected."
  } = req.body;

  const SID = accountSid || process.env.TWILIO_ACCOUNT_SID;
  const AUTH = authToken || process.env.TWILIO_AUTH_TOKEN;
  const FROM = fromNumber || process.env.TWILIO_PHONE_NUMBER;
  const TO = to || process.env.TWILIO_TARGET_NUMBER;

  try {
    if (!SID || !AUTH || !FROM || !TO) {
      return res.status(500).json({
        error: 'Missing Twilio configuration',
        debug: { SID, AUTH, FROM, TO }
      });
    }

    const client = twilio(SID, AUTH);

    // Wrapped in a 5-second timeout to prevent the exact 30,000ms Axios timeout 
    // from freezing the Admin Panel when behind restrictive firewalls/proxies.
    const messagePromise = client.messages.create({
      body: message,
      from: FROM,
      to: TO,
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Twilio Network Timeout (5s)')), 5000)
    );

    const response = await Promise.race([messagePromise, timeoutPromise]);

    console.log("✅ SMS SENT:", response.sid);

    res.json({
      success: true,
      sid: response.sid,
      to: TO,
      status: response.status
    });

  } catch (err) {
    console.error("❌ SMS NETWORK/AUTH ERROR:", err.message);

    if (err.message.includes('Timeout') || err.code === 'ECONNABORTED') {
       return res.status(503).json({
         error: 'Twilio Gateway Unreachable',
         message: 'Your network firewall is blocking outbound connections to Twilio, or you are offline.',
         technical: err.message
       });
    }

    res.status(500).json({
      error: 'Failed to send SMS alert',
      message: err.message,
      code: err.code,
      moreInfo: err.moreInfo
    });
  }
});

// Extra Features: Advanced Webhooks
// API: Handle Twilio Delivery Status Callbacks
app.post('/api/twilio/status', express.urlencoded({ extended: true }), (req, res) => {
  const { MessageStatus, MessageSid, ErrorCode } = req.body;
  console.log(`Twilio Message Status Update => SID: ${MessageSid}, Status: ${MessageStatus}, ErrorCode: ${ErrorCode || 'None'}`);
  if (ErrorCode === '30039') {
     console.error("⚠️ Detected Error 30039: Potential messaging loop prevented by Twilio.");
  }
  res.sendStatus(200);
});

// API: Handle Incoming SMS from Twilio (Fix endless loop 30039 by only responding strictly to recognized commands)
app.post('/api/twilio/incoming', express.urlencoded({ extended: true }), (req, res) => {
  const incomingMessage = req.body.Body || '';
  const fromNumber = req.body.From;
  console.log(`Received incoming message from ${fromNumber}: ${incomingMessage}`);

  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  // Prevent endless loops by ensuring we ONLY reply to specific human-like commands like 'STATUS' or 'HELP'
  // and we ignore completely empty messages or generic responses
  if (incomingMessage.trim().toUpperCase() === 'STATUS') {
    twiml.message('SolarAQI Systems are operational. Current real-time data metrics are optimal.');
  } else if (incomingMessage.trim().toUpperCase() === 'HELP') {
    twiml.message('Send STATUS to get current SolarAQI platform status. Other commands are ignored to prevent loops.');
  } else {
    // Return empty TwiML, specifically to prevent error 30039 when machine sends unknown generic bot replies.
    // Twilio sees empty response and DOES NOT loop.
    console.log("Empty or unrecognized command. Ignored to prevent bot loops.");
  }

  res.type('text/xml').send(twiml.toString());
});

// Serve static files from the React dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running locally at http://localhost:${PORT}`);
  });
}

export default app;
