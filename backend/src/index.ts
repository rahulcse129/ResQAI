import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
// Load local backend .env first, fallback to root .env
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resqai';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Redis client gracefully
let isRedisConnected = false;
const redis = new Redis(REDIS_URL, {
  retryStrategy(times) {
    // Retry every 5 seconds instead of spamming
    return 5000;
  },
  maxRetriesPerRequest: 1,
});

redis.on('error', (err) => {
  if (isRedisConnected) {
    console.error('Redis connection lost. Switching to bypass mode.');
    isRedisConnected = false;
  }
});

redis.on('connect', () => {
  console.log('Connected to Redis');
  isRedisConnected = true;
});
// File-based database backup for development when MongoDB is offline
const DB_FILE_PATH = path.join(__dirname, '../reports_db.json');

interface IReport {
  _id: string;
  type?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  description?: string;
  severity?: string;
  createdAt: string;
}

function loadReportsFromFile(): IReport[] {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read from reports_db.json:', error);
  }
  return [];
}

function saveReportToFile(report: IReport) {
  try {
    const reports = loadReportsFromFile();
    reports.push(report);
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(reports, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to write to reports_db.json:', error);
  }
}

// Connect to MongoDB with connection event handlers and timeout
let isMongoConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
})
  .then(() => {
    console.log('Connected to MongoDB');
    isMongoConnected = true;
  })
  .catch((err: any) => {
    console.warn('MongoDB connection error: Defaulting to local file-based database. Error details:', err.message);
    isMongoConnected = false;
  });

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
  isMongoConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error event:', err.message);
  isMongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Switching to local file-based database.');
  isMongoConnected = false;
});

// Socket.io for Real-time alerts
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Platform API Running' });
});

// NASA EONET Live Disaster Events
app.get('/api/disasters/nasa', async (req, res) => {
  try {
    const cacheKey = 'nasa_eonet_events';

    // Check cache only if Redis is active
    if (isRedisConnected) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          return res.json(JSON.parse(cachedData));
        }
      } catch (cacheErr) {
        console.warn('Redis get failed:', cacheErr);
      }
    }

    // Fetch from NASA EONET v3 API
    // We filter for active events only
    const response = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events?status=open');
    const events = response.data.events;

    // Transform data for the frontend Map
    const markers = events.map((event: any) => {
      // Safely extract coordinates (NASA uses [lng, lat])
      let lat = 0;
      let lng = 0;
      if (event.geometry && event.geometry.length > 0) {
        const geom = event.geometry[0];
        if (geom.type === 'Point') {
          lng = geom.coordinates[0];
          lat = geom.coordinates[1];
        } else if (geom.type === 'Polygon') {
          lng = geom.coordinates[0][0][0];
          lat = geom.coordinates[0][0][1];
        }
      }

      // Determine type based on NASA categories
      let type = 'alert';
      const categoryId = event.categories[0]?.id;
      if (categoryId === 'wildfires') type = 'fire';
      else if (categoryId === 'severeStorms') type = 'storm';
      else if (categoryId === 'volcanoes') type = 'volcano';

      return {
        id: event.id,
        title: event.title,
        type: type, // frontend maps this
        position: [lat, lng],
        date: event.geometry[0]?.date || null
      };
    }).filter((m: any) => m.position[0] !== 0 && m.position[1] !== 0); // Only return valid coordinates

    // Cache the transformed data only if Redis is connected
    if (isRedisConnected) {
      try {
        await redis.setex(cacheKey, 600, JSON.stringify(markers));
      } catch (cacheErr) {
        console.warn('Redis set failed:', cacheErr);
      }
    }

    res.json(markers);
  } catch (error: any) {
    console.warn('NASA API Error:', error.message, '- Falling back to local mock disaster events.');
    const mockEvents = [
      {
        id: "mock-fire-california",
        title: "California Wildfire - Sierra Foothills",
        type: "fire",
        position: [37.8, -120.4],
        date: new Date().toISOString()
      },
      {
        id: "mock-storm-pacific",
        title: "Tropical Storm Kristy - Pacific Ocean",
        type: "storm",
        position: [15.2, -112.5],
        date: new Date().toISOString()
      },
      {
        id: "mock-volcano-etna",
        title: "Mount Etna Eruption - Sicily, Italy",
        type: "volcano",
        position: [37.75, 15.0],
        date: new Date().toISOString()
      },
      {
        id: "mock-storm-bayofbengal",
        title: "Cyclone Remal - Bay of Bengal",
        type: "storm",
        position: [20.5, 89.2],
        date: new Date().toISOString()
      },
      {
        id: "mock-fire-australia",
        title: "Bushfire - New South Wales",
        type: "fire",
        position: [-33.8, 150.1],
        date: new Date().toISOString()
      },
      {
        id: "mock-earthquake-japan",
        title: "Seismic Activity Alert - Sendai, Japan",
        type: "alert",
        position: [38.2, 141.0],
        date: new Date().toISOString()
      }
    ];
    res.json(mockEvents);
  }
});

// Open-Meteo Live Weather & Forecast
app.get('/api/weather', async (req, res) => {
  try {
    const lat = req.query.lat || 28.6139; // Default New Delhi
    const lng = req.query.lng || 77.2090;
    const cacheKey = `weather_${lat}_${lng}`;

    if (isRedisConnected) {
      try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return res.json(JSON.parse(cachedData));
      } catch (e) { console.warn('Redis read failed'); }
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=2`;
    const response = await axios.get(url);
    const data = response.data;

    // Helper to map WMO codes
    const getCondition = (code: number) => {
      if (code === 0) return 'Clear';
      if (code <= 3) return 'Cloudy';
      if (code <= 48) return 'Fog';
      if (code <= 67) return 'Rain';
      if (code <= 77) return 'Snow';
      if (code <= 82) return 'Showers';
      if (code <= 86) return 'Snow Showers';
      if (code >= 95) return 'Thunderstorm';
      return 'Unknown';
    };

    const current = {
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      condition: getCondition(data.current.weather_code),
      wind: data.current.wind_speed_10m
    };

    // Grab next 24 hours of forecast
    // Current time approximation (Open-Meteo returns hourly data)
    const currentIso = new Date().toISOString().substring(0, 14) + "00";
    let startIndex = data.hourly.time.findIndex((t: string) => t >= currentIso);
    if (startIndex === -1) startIndex = 0;

    const hourly = [];
    for (let i = startIndex; i < startIndex + 24; i++) {
      if (data.hourly.time[i]) {
        hourly.push({
          time: data.hourly.time[i],
          temp: data.hourly.temperature_2m[i],
          condition: getCondition(data.hourly.weather_code[i])
        });
      }
    }

    const payload = { current, hourly };

    if (isRedisConnected) {
      try {
        await redis.setex(cacheKey, 1800, JSON.stringify(payload)); // Cache for 30 mins
      } catch (e) { console.warn('Redis write failed'); }
    }

    res.json(payload);
  } catch (error: any) {
    console.error('Weather API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Proxy route to AI Service
app.post('/api/ai/chat', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/chat`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.warn('AI Chat Service offline/error:', error.message, '- Falling back to local responder.');
    res.json({
      reply: `I am currently operating in backup mode (the Python AI Service is offline). Here are some initial emergency guidelines:
1. Stay tuned to local news and official warning broadcasts.
2. Evacuate if ordered by emergency services.
3. Prepare a disaster supply kit (water, non-perishable food, flashlight, first-aid).`
    });
  }
});

// Proxy route to Risk Engine
app.post('/api/ai/risk-score', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/risk-score`, req.body, { timeout: 10000 });
    res.json(response.data);
  } catch (error: any) {
    console.warn('AI Risk Service offline/error:', error.message, '- Falling back to local risk assessment.');
    
    // Calculate a dynamic risk score for demo based on event title/type
    const eventType = req.body.event_type || 'alert';
    let riskScore = 65;
    let severity = 'High';
    if (eventType === 'fire') {
      riskScore = 88;
      severity = 'Critical';
    } else if (eventType === 'storm') {
      riskScore = 75;
      severity = 'High';
    } else if (eventType === 'volcano') {
      riskScore = 95;
      severity = 'Critical';
    }
    
    res.json({
      riskScore: riskScore,
      severity: severity,
      analysis: `Fallback Assessment: This active ${eventType} event (Lat: ${req.body.latitude || 0}, Lng: ${req.body.longitude || 0}) is being monitored. High wind and local conditions increase propagation risks.`,
      recommendations: [
        "Alert local emergency response coordination units",
        "Initiate buffer zones and evacuation preparedness checklists",
        "Monitor local temperature and humidity indicators"
      ]
    });
  }
});

// Simple schema and model for Reports
const reportSchema = new mongoose.Schema({
  type: String,
  location: {
    lat: Number,
    lng: Number
  },
  description: String,
  severity: String,
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

app.post('/api/reports', async (req, res) => {
  try {
    if (isMongoConnected) {
      const report = new Report(req.body);
      await report.save();
      io.emit('new_report', report); // Broadcast to all clients
      res.status(201).json(report);
    } else {
      const report = {
        _id: new mongoose.Types.ObjectId().toString(),
        type: req.body.type,
        location: req.body.location,
        description: req.body.description,
        severity: req.body.severity,
        createdAt: new Date().toISOString()
      };
      saveReportToFile(report);
      io.emit('new_report', report);
      res.status(201).json(report);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    if (isMongoConnected) {
      const reports = await Report.find().sort({ createdAt: -1 }).limit(100);
      res.json(reports);
    } else {
      const reports = loadReportsFromFile();
      const sortedReports = reports
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);
      res.json(sortedReports);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
