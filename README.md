# ResQAI Platform

ResQAI is an AI-powered Disaster Intelligence & Response Platform that helps citizens, NGOs, and government agencies prepare for, respond to, and recover from natural disasters.

## Features
- **Smart Risk Engine**: AI-driven analysis of flood, heatwave, and wildfire risk scores.
- **Interactive Disaster Map**: Highly optimized live map featuring shelters, SOS requests, and affected areas.
- **AI Emergency Assistant**: Chatbot offering context-aware recommendations for safety and evacuation.
- **Community Preparedness Score**: Dynamic district-level resilience grading.

## Technologies
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Framer Motion, Leaflet
- **Backend**: Node.js, Express, MongoDB Atlas, Redis Cache, BullMQ
- **AI Services**: Python FastAPI, Gemini API
- **Infrastructure**: Docker, AWS EC2

## Architecture

1. **Frontend**: Communicates exclusively with the Node.js API Gateway. Follows strict performance requirements (lazy loading, virtualized lists, skeleton loaders).
2. **Backend**: Handles user authentication, core business logic, real-time socket events, and job queueing.
3. **AI Services**: FastAPI Python microservice focused purely on providing smart risk assessments, predictive modeling, and handling AI chatbot requests via Gemini.
4. **Data Store**: MongoDB (Primary), Redis (Caching & Job Queue).

## How to Run Locally

```bash
docker-compose up --build
```

## Production Deployment

### Phase 1: Provisioning Databases & Cloud Credentials
1. **MongoDB Atlas**: Create a free shared cluster (M0) and copy the connection string (ensure Network Access allows `0.0.0.0/0`).
2. **Upstash Redis**: Create a Serverless Redis Database and copy the Redis connection URL.
3. **Google AI Studio**: Obtain a production-ready `GEMINI_API_KEY`.

### Phase 2: Deploying the AI Service (FastAPI)
1. Deploy the `ai-service` directory to **Render** or **Railway** as a Python Web Service.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Configure the environment variable:
   * `GEMINI_API_KEY` = `your_gemini_api_key`
5. Copy the deployed service URL.

### Phase 3: Deploying the Express Backend
1. Deploy the `backend` directory to **Render** or **Railway** as a Node.js Web Service.
2. Build Command: `npm install && npm run build`
3. Start Command: `node dist/index.js`
4. Configure the environment variables:
   * `MONGODB_URI` = `your_mongodb_atlas_connection_string`
   * `REDIS_URL` = `your_upstash_redis_url`
   * `AI_SERVICE_URL` = `your_deployed_ai_service_url`
5. Copy the deployed backend URL.

### Phase 4: Deploying the React Frontend
1. Deploy the `frontend` directory to **Vercel** or **Netlify** (Vite framework preset).
2. Configure the environment variable:
   * `VITE_API_URL` = `your_deployed_backend_url`
3. Build and launch the live application!
