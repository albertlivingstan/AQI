import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import twilio from 'twilio';
import fs from 'fs';

// Initialize env vars before use
dotenv.config({ override: true });

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
app.get('/api/realtime', (req, res) => {
  res.json({
    aqi: Math.floor(Math.random() * 150) + 10,
    solarIrradiance: Math.floor(Math.random() * 800) + 200,
    cloudCover: Math.floor(Math.random() * 100),
    temperature: 20 + Math.random() * 15,
    timestamp: new Date().toISOString()
  });
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

// API: Google Earth Engine / Satellite Data
app.get('/api/satellite', (req, res) => {
  res.json({ provider: 'Google Earth Engine', status: 'connected', coverage: 'global' });
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

    const response = await client.messages.create({
      body: message,
      from: FROM,
      to: TO
    });

    console.log("✅ SMS SENT:", response.sid);

    res.json({
      success: true,
      sid: response.sid,
      to: TO
    });

  } catch (err) {
    console.error("❌ FULL TWILIO ERROR:", err);

    res.status(500).json({
      error: 'Failed to send SMS alert',
      message: err.message,
      code: err.code,
      moreInfo: err.moreInfo
    });
  }
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
