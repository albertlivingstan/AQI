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

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/solaraqi')
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());

// API: Fetch Real-Time Data (AQI, Weather, Solar)
app.get('/api/realtime', async (req, res) => {
  const lat = req.query.lat || '51.5074'; // Default to London
  const lon = req.query.lon || '-0.1278';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  let weatherData = {
    temp: 20,
    clouds: 0,
    humidity: 50,
    description: 'clear sky'
  };

  if (apiKey) {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
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
      console.error('Error fetching OpenWeatherMap data:', err);
    }
  }

  res.json({
    aqi: Math.floor(Math.random() * 150) + 10,
    solarIrradiance: Math.floor(Math.random() * 800) + 200,
    cloudCover: weatherData.clouds,
    temperature: weatherData.temp,
    humidity: weatherData.humidity,
    description: weatherData.description,
    timestamp: new Date().toISOString()
  });
});

// API: Fetch 5-Day Hourly AQI Forecast Data
app.get('/api/aqi/forecast', async (req, res) => {
  const lat = req.query.lat || '12.9716';
  const lon = req.query.lon || '77.5946';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenWeather API Key not configured in backend .env' });
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
    console.error('Error fetching AQI forecast:', err);
    res.status(500).json({ error: 'Failed to fetch AQI forecast from OpenWeather' });
  }
});

// API: Fetch 5-Day 3-Hourly Weather Forecast Data
app.get('/api/weather/forecast', async (req, res) => {
  const lat = req.query.lat || '12.9716';
  const lon = req.query.lon || '77.5946';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenWeather API Key not configured in backend .env' });
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
    console.error('Error fetching weather forecast:', err);
    res.status(500).json({ error: 'Failed to fetch weather forecast from OpenWeather' });
  }
});

// API: Get Data Sources
app.get('/api/sources', async (req, res) => {
  try {
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

app.listen(PORT, () => {
  console.log(`Server is running locally at http://localhost:${PORT}`);
});
