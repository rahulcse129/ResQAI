# ResQAI Production Deployment Guide

This guide outlines the step-by-step process for deploying the ResQAI platform to production. The platform consists of three main services:
1. **AI Service** (Python FastAPI)
2. **Backend API Gateway** (Node.js Express)
3. **Frontend Dashboard** (React Vite)

---

## Architecture Overview

```mermaid
graph TD
    Client[React Frontend - Vercel] -->|HTTP / WebSockets| Express[Node.js Backend - Render/Railway]
    Express -->|Caching| Redis[Redis Cloud / Upstash]
    Express -->|Data Persistence| Mongo[MongoDB Atlas]
    Express -->|HTTP POST| FastAPI[AI Service - Render/Railway]
    FastAPI -->|LLM Inference| Gemini[Google Gemini API]
```

---

## Phase 1: Provisioning Databases & Cloud Credentials

Before deploying the services, set up your cloud databases and third-party API accounts:

### 1. MongoDB Atlas (Database)
1. Sign up/log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0).
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) to ensure your cloud servers can connect.
5. Copy the connection string (format: `mongodb+srv://<username>:<password>@cluster.xxxx.mongodb.net/resqai?retryWrites=true&w=majority`).

### 2. Upstash Redis (Caching & Job Queue)
1. Sign up/log in to [Upstash](https://upstash.com/).
2. Create a new Serverless Redis Database.
3. Copy the **Redis URL** from the database dashboard (format: `redis://default:xxxx@xxxx.upstash.io:6379`).

### 3. Google AI Studio (Gemini Key)
* Ensure you have your production-ready `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/).

---

## Phase 2: Deploying the AI Service (FastAPI)

Deploy the Python service first, as the Node.js backend needs its URL to communicate.

### Recommended Platform: [Render](https://render.com/) or [Railway](https://railway.app/)

#### Deployment via Render:
1. Log in to Render and click **New > Web Service**.
2. Connect your Git repository.
3. Choose the directory: `ai-service`.
4. Configure settings:
   * **Runtime:** `Python`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add the following **Environment Variables**:
   * `GEMINI_API_KEY` = `your_gemini_api_key`
6. Click **Deploy Web Service**.
7. Once deployed, copy your service's URL (e.g., `https://resqai-ai-service.onrender.com`).

---

## Phase 3: Deploying the Express Backend

Next, deploy the Node.js API Gateway.

### Recommended Platform: [Render](https://render.com/) or [Railway](https://railway.app/)

#### Deployment via Render:
1. Log in to Render and click **New > Web Service**.
2. Connect your Git repository.
3. Choose the directory: `backend`.
4. Configure settings:
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build` (Ensure TypeScript compiling is configured)
   * **Start Command:** `node dist/index.js`
5. Add the following **Environment Variables**:
   * `PORT` = `80` (or leave default to allow Render to bind dynamically)
   * `MONGODB_URI` = `your_mongodb_atlas_connection_string`
   * `REDIS_URL` = `your_upstash_redis_url`
   * `AI_SERVICE_URL` = `your_deployed_ai_service_url_from_phase_2`
6. Click **Deploy Web Service**.
7. Once deployed, copy the backend service's URL (e.g., `https://resqai-backend.onrender.com`).

---

## Phase 4: Deploying the React Frontend (Vite)

Finally, build and deploy your static React frontend.

### Recommended Platform: [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/)

#### Deployment via Vercel:
1. Log in to Vercel and click **Add New > Project**.
2. Import your Git repository.
3. Configure project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `frontend`
4. Expand **Environment Variables** and add:
   * `VITE_API_URL` = `your_deployed_backend_url_from_phase_3` (e.g., `https://resqai-backend.onrender.com`)
5. Click **Deploy**.
6. Open your live deployment URL!

---

## Phase 5: Verification & Testing

Verify that all components are connected correctly:

1. **Dashboard Check:** Visit your deployed frontend URL. Verify that layout panels load without error indicators.
2. **Live Map Check:** Go to the Live Map tab. It should fetch active disaster data from the backend (relayed from NASA's API). Click on a marker to confirm geocoding completes.
3. **AI Chat Check:** Open the AI Assistant page. Type a message to verify you get a rapid response from the Python AI Service.
