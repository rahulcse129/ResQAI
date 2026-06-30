# ResQAI Architecture & Design

## 1. Folder Structure

```
ResQAI/
├── frontend/                 # React 19 + Vite + Tailwind UI
│   ├── src/
│   │   ├── pages/            # Lazy-loaded page components (Dashboard, LiveMap, Assistant, Landing)
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks (e.g., useDashboardData)
│   │   ├── lib/              # Utility functions and API clients
│   │   ├── App.tsx           # Main Router and lazy-loading setup
│   │   └── main.tsx          # React Query Provider and root render
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/                  # Node.js + Express API Gateway
│   ├── src/
│   │   ├── index.ts          # Express server, MongoDB connection, Socket.io, proxy routes
│   │   ├── models/           # Mongoose schemas
│   │   └── controllers/      # API logic
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── ai-service/               # Python FastAPI Microservice
│   ├── main.py               # Risk Engine and Gemini API integration
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml        # Orchestrates Frontend, Backend, AI-Service, MongoDB, Redis
└── README.md                 # Project Overview
```

## 2. Database Design & MongoDB Schemas

**Database**: MongoDB Atlas
**Caching**: Redis

### Schemas

**Report Schema** (Citizens reporting incidents)
```javascript
const reportSchema = new mongoose.Schema({
  type: { type: String, enum: ['Flood', 'Fire', 'Waterlogging', 'Road Blockage'] },
  location: { lat: Number, lng: Number },
  description: String,
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
  reporterId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});
```

**User Schema** (For Authentication)
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['Citizen', 'NGO', 'Government'] },
  district: String,
  createdAt: { type: Date, default: Date.now }
});
```

**SOS Request Schema**
```javascript
const sosSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  requestType: { type: String, enum: ['Rescue', 'Medical', 'Food', 'Shelter'] },
  location: { lat: Number, lng: Number },
  status: { type: String, enum: ['Pending', 'Assigned', 'Resolved'] },
  assignedVolunteerId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});
```

## 3. API Documentation

### Backend (API Gateway)

- `GET /api/health`: Check platform health.
- `GET /api/reports`: Get latest 100 incident reports.
- `POST /api/reports`: Create a new report (Broadcasts to all connected clients via Socket.io).
- `POST /api/ai/chat`: Proxies chat request to Python AI Service.
- `POST /api/ai/risk-score`: Proxies risk calculation to Python AI Service.

### AI Service (FastAPI)

- `POST /api/chat`
  - Body: `{ "message": string, "location": string, "language": string }`
  - Returns: `{ "reply": string }` (Gemini AI response)
- `POST /api/risk-score`
  - Body: `{ "rainfall": float, "temperature": float, "humidity": float, "wind_speed": float, "wildfire_activity": float, "historical_disasters": int }`
  - Returns: Risk scores for flood, heatwave, wildfire, and overall index.

## 4. Authentication Flow

1. **User Role Identification**: Users sign up as Citizen, NGO, or Government.
2. **JWT Issuance**: Node.js backend verifies credentials and issues a JWT (JSON Web Token).
3. **Frontend Storage**: JWT is stored in an HTTP-only cookie or memory (not localStorage for security).
4. **API Requests**: All requests from Frontend to Backend include the JWT in the Authorization header.
5. **Gateway Verification**: The Express API Gateway verifies the JWT before fulfilling requests or proxying them to the AI microservice. No external API is exposed directly to the frontend.

## 5. Deployment Setup

The platform is containerized and ready for deployment on AWS EC2 or similar cloud providers.

1. **Local Development**: `docker-compose up --build`
2. **Production Deployment**:
   - Push Docker images to AWS ECR.
   - Run containers on an EC2 instance or AWS ECS.
   - Set up AWS Application Load Balancer to terminate SSL and route traffic to the Frontend and Backend containers.
   - Use managed MongoDB Atlas instead of the local mongo container.
   - Use AWS ElastiCache for Redis.
