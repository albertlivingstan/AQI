import mongoose from 'mongoose';

const aqiSchema = new mongoose.Schema({
  location: String,
  lat: Number,
  lon: Number,
  aqi: Number,
  temperature: Number,
  humidity: Number,
  healthAdvice: String,
  solarPrediction: Number,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('AqiData', aqiSchema);
