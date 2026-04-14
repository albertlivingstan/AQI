# SolarAQI Enterprise Platform

SolarAQI is a comprehensive full-stack enterprise web application designed to provide real-time geospatial intelligence, complex air quality monitoring mechanisms, and next-generation solar energy forecasting utilizing real-time API aggregations mapped directly alongside interactive web applications. 

## Features

- **Geo Intelligence Control Panel**: Highly dynamic Leaflet mapping engine featuring real-time user location tracking and global Air Quality Index (AQI) metric heatmap layers.
- **Admin Management Panel**: Administrative dashboard dedicated to ML Pipeline metrics, solar plant exporting functionality, and core backend testing logic.
- **Data Source Engine**: MongoDB-backed data orchestration layer engineered to securely persist endpoints (like NASA POWER and OpenAQ) scaling infinitely.
- **Enterprise Notification Subsystem**: Server-side integrated Twilio messaging protocols hooked up statically to handle SMS logic scaling during geospatial anomalies directly from the browser payload!

## How the SMS System Works

The platform utilizes a backend route pipeline located in `server.js` configured with the official `twilio` dependency explicitly wrapped around an Express `POST` endpoint located at `/api/alert`.

When an administrator clicks the **"Dispatch Test Alert"** inside front-end React environments, an HTTP Payload is requested via `fetch` logic hitting `/api/alert`.

The `server.js` backend engine intercepts this request, queries your securely managed `.env` file containing the explicit internal API Keys (`TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`), connects dynamically to the official Twilio cloud server environment, matches your static configured target receiver number (`+12293038214`), and shoots the customized ping instantly. Using environment variables guarantees these sensitive keys are excluded safely from Source Control `gitignore`.

## Commands to Run

To run the full stack locally on your machine, you must concurrently run both pieces of the architecture:

### 1. Terminal 1: Run the Backend (Node/Express Server with MongoDB)
*Ensure you have MongoDB running locally natively on `localhost:27017`!*
```bash
# This exposes the connection to Twilio and handles all API logic.
node server.js
```

### 2. Terminal 2: Run the Frontend (React UI utilizing Vite)
```bash
# This hosts your web interface proxying data back to the Node Express server.
npm run dev
```

Both need to remain running to seamlessly enable endpoint communication across the network!
