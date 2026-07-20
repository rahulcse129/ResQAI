# ResQAI: Project Progress & Architecture Summary

## 📌 Executive Overview
**ResQAI** is a next-generation, AI-driven disaster intelligence and emergency response platform designed to assist citizens, rescue teams, and authorities during natural crises. By synthesizing real-time global telemetry (NASA EONET) with low-latency Generative AI (**Gemini 2.5 Flash Lite**), ResQAI turns complex disaster metrics into immediate, localized, and life-saving directions.

---

## ❤️ Personal Mission & Motivation
The vision for ResQAI is rooted in real-life lived experience during the **2006 Surat Flood** in Gujarat, India. Having witnessed the confusion, panic, and struggle families face when cut off from localized information, ResQAI was created to ensure that no child or parent has to experience that fear and isolation during a crisis.

---

## 🚀 Key Features Completed & Implemented

### 1. Interactive Live Crisis Map (`frontend/src/pages/LiveMap.tsx`)
* **Live NASA Telemetry:** Connects to NASA's EONET v3 API (`/api/disasters/nasa`) to plot active wildfires, severe storms, cyclones, and volcanic events globally.
* **Reverse-Geocoding:** Integrated OpenStreetMap's Nominatim API to translate raw latitude/longitude coordinates into human-readable locations (Area, City, State, Country).
* **Production Status & NASA Sync:** Added a UI banner alerting users to live feed status and providing a **"Sync NASA"** manual refetch control.

### 2. Location-Aware AI Emergency Assistant (`ai-service/main.py`)
* **Gemini 2.5 Flash Lite Engine:** Configured the backend AI service to leverage the fast, stable `gemini-2.5-flash-lite` model.
* **Efficient Prompts:** Optimized prompts to yield short, bulleted, action-oriented safety guidance while injecting location-specific emergency helplines (Ambulance & Disaster Response).

### 3. Predictive AI Risk Engine (`/api/risk-score`)
* Evaluates disaster types alongside real-time weather metrics (temperature, humidity, wind speed) to generate:
  - 1-100 Risk Scores
  - Severity Categories (Low, Medium, High, Critical)
  - 2-sentence risk explanations and actionable preparation checklists.

### 4. Zero-Downtime Resilient Architecture (`backend/src/index.ts`)
* **Database Fallback:** If MongoDB is offline, the backend automatically defaults to a local JSON database (`backend/reports_db.json`) without crashing.
* **Cache Bypass:** If Redis is offline, the backend bypasses cache layers and queries external APIs directly.
* **Bot-Blocker Bypasses:** Configured Axios requests with standard browser `User-Agent` headers and a 10-second timeout to prevent cloud providers (e.g., Render) from being blocked by NASA endpoints.
* **Automatic URL Normalization (`frontend/src/config.ts`):** Added URL sanitization to ensure environment variables format automatically to `https://resqai-2.onrender.com/api` without double slashes (`//`) or missing subpaths.

### 5. Volunteer Workplace & Relief Directory (`frontend/src/pages/VolunteerWorkplace.tsx`)
* **Two-Sided Directory & Request System:** Enables individuals and NGOs to list emergency capabilities (shelter, medical aid, food/water, rescue manpower, transport, logistics).
* **Interactive Relief Map & Grid Search:** Requesters can search providers by category, availability, or city, toggling between a responsive card grid and an interactive Leaflet provider map.
* **Provider Workspace:** Allows registered providers to manage incoming service requests (Accept / Decline / Complete), update capacity, and toggle live availability (`available`, `busy`, `unavailable`).
* **Dual Persistence Layer:** Reuses the Mongoose-with-JSON-fallback model (`volunteers_db.json` & `requests_db.json`), ensuring zero-downtime service registration even when MongoDB is offline.

### 6. Secure Authentication & Role-Based Volunteer Workplace Flow (`frontend/src/context/AuthContext.tsx`, `pages/Login.tsx`, `pages/Signup.tsx`)
* **User Data Model & JSON Fallback:** Mongoose schema for `User` with password hashing via `bcryptjs` and dual persistence in `users_db.json`.
* **JWT Middleware:** `requireAuth` Express middleware validating Bearer tokens with automatic token expiration handling.
* **Role-Based Workflows (Individual vs NGO):** Signup screen toggles between Individual Volunteers and NGOs (with NGO Darpan / NITI Aayog ID verification input).
* **Post-Login Smart Navigation:** Automatically routes users to service registration if no provider listing exists, or directly to their relief management portal if registered.
* **Contact Exposure & Anti-Scraping Protection:** Masks provider phone numbers and emails on public browsing cards (`Protected (Submit request to connect)`), disclosing full contact info only when a service request is accepted or marked critical.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Leaflet, Framer Motion |
| **Backend API Gateway** | Node.js, Express, Axios, `jsonwebtoken`, `bcryptjs` |
| **AI Microservice** | Python 3.11+, FastAPI, Uvicorn, Google GenAI SDK (`gemini-2.5-flash-lite`) |
| **Database & Cache (Optional)** | MongoDB Atlas (Fallback: `users_db.json`, `volunteers_db.json`, `requests_db.json`), Redis (Fallback: Direct Bypass) |
| **Security & DevOps** | Root `.gitignore`, Monorepo Architecture, Render & Vercel Deployment Configurations |

---

## 📑 Project Files Created
* `PROJECT_SUMMARY.md` - Complete progress report.
* `DEPLOYMENT.md` - Step-by-step guide for database-less and full-stack cloud deployment.
* `.gitignore` - Centralized monorepo ignore configuration guarding API keys and environment files.

---

## 🎯 Next Steps & Future Roadmap
1. **Peer-to-Peer Mesh Networking:** Implementing Bluetooth/Wi-Fi Direct P2P protocols for offline alert broadcasting when cell towers fail.
2. **Government Shelter Integration:** Connecting municipal GIS systems for real-time shelter capacity metrics.
3. **On-Device LLMs:** Quantizing lightweight models (e.g., Gemma) for local offline mobile execution.
