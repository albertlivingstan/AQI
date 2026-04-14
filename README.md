# SolarAQI: Geospatial Intelligence Platform 🌍☀️

SolarAQI is a modern, enterprise-grade full-stack web application designed to synthesize real-time geospatial intelligence, monitor Air Quality Index (AQI) routing, and dynamically compute predicted solar energy optimization patterns. It features deep integration with interactive mapping tools, predictive what-if simulators, and instant Twilio SMS emergency escalation pipelines.

## 🚀 Key Features

- **Interactive Geo-Spatial Map**: Utilizes React-Leaflet to project high-fidelity NASA Terra MODIS arrays and US-EPA AQI mappings layered natively across real-world cartography. 
- **Reverse Geocoding**: Features built-in OpenStreetMap Nominatim reverse geocoding to automatically resolve map clicks and user locations into accurate real-world City strings (e.g., *Chennai, Tamil Nadu*).
- **Twilio SMS Escalation Engine**: Clicking any geographic location automatically proxies spatial data through the Express.js backend and generates a pristine SMS Alert containing AQI telemetry, Solar Radiation analytics, and Location details straight to your dedicated phone!
- **Dynamic Configuration Settings**: Provides an administrative "Settings" page that securely intercepts and overrides `.env` backend variables via Hot-Memory injection without restarting Node.js servers!
- **Fail-proof GPS Fallback**: Organically captures your native device GPS with permission. If your browser proxies or natively denies `https://` secure locations, it leverages `ipapi.co` routing fallbacks to flawlessly pinpoint your origin.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, TailwindCSS (for highly-styled dark node UI), and Framer Motion (for cinematic animations).
- **Mapping**: Leaflet + React-Leaflet.
- **Backend / API**: Node.js & Express.js.
- **Database**: MongoDB (via Mongoose orchestration).
- **Messaging**: Twilio SDK.

---

## ⚙️ How to Run the Application Locally

Because SolarAQI is structured as a fully decoupled Full-Stack layout, you must execute **both** the backend operations framework and the frontend compiler simultaneously to test all API pipelines.

### 1. Database Initialization
Ensure you have MongoDB installed and actively running on its default system port (`mongodb://localhost:27017`). The server handles organic seeding and configuration autonomously!

### 2. Configure Environment Secrets
Create a `.env` file mechanically in the root directory and inject your Twilio variables:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
TWILIO_TARGET_NUMBER=your_target_phone
```

### 3. Launching the Backend (API & Telemetry)
Pop open your Terminal or IDE shell and run:
```bash
node server.js
```
*You should see a successful DB mapping message! `Successfully connected to MongoDB.`*

### 4. Launching the Frontend Interface (React UI)
Open a *secondary* new Terminal tab (while keeping `node server.js` actively running), verify you are in the application root, and run:
```bash
npm run dev
```
*(If you want to view the App simultaneously across your mobile phone, type `npm run dev -- --host` and type your local IP network into your phone browser!)*

Navigate immediately to `http://localhost:5173/` in your browser. 

---

## 🐞 Recent Bug Fixes Included:
1. **Twilio A2P Blocking Re-Routing**: Fixed core `process.env` logic ignoring overrides due to global Mac terminal state interference. 
2. **Reverse Geocoding Handlers**: Successfully mapped exact city strings replacing blank or null data formats within the UI pop-ups.
3. **Splash Screen Velocity Balancing**: Redesigned the mounting boot loop to be completely robust—gracefully fading the simulated UI engine load without flashing excessively fast. 
4. **Target Phone Variable Intercept**: Built secure fallbacks mapping precisely to the Admin configuration logic allowing native override of SMS pipelines!

Enjoy tracking dynamic localized atmosphere states globally!
