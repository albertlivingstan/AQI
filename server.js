import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/solaraqi')
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('MongoDB connection error:', err));

const sourceSchema = new mongoose.Schema({
  name: String,
  type: String,
  url: String,
  status: { type: String, default: 'active' },
  lastSync: { type: String, default: 'Just now' },
  records: { type: Number, default: 0 },
});
const Source = mongoose.model('Source', sourceSchema);

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
app.post('/api/alert', (req, res) => {
  res.json({ success: true, message: 'SMS Alert triggered via Twilio Mock' });
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
