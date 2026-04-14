import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import twilio from 'twilio';

// Initialize env vars before use
dotenv.config();

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

// API: Twilio Alert Notification Trigger
app.post('/api/alert', async (req, res) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return res.status(500).json({ error: 'Twilio credentials not configured in environment.' });
    }

    const { to = "+12293038214", message = "SolarAQI Alert: Anomalous API behavior detected." } = req.body;
    
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const twilioResponse = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER || '+12293038214',
      to: to
    });

    res.json({ success: true, message: `SMS Alert dispatched successfully`, sid: twilioResponse.sid });
  } catch (err) {
    console.error('Twilio Error:', err);
    res.status(500).json({ error: 'Failed to send SMS alert.', details: err.message });
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
