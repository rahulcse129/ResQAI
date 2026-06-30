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

## How to Run

```bash
docker-compose up --build
```
