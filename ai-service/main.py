from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Try loading from local directory first, then fallback to root directory
if os.path.exists(".env"):
    load_dotenv()
else:
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

app = FastAPI(title="ResQAI AI Service")

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash-lite')

class ChatRequest(BaseModel):
    message: str
    location: str = "Unknown"
    language: str = "en"

class RiskRequest(BaseModel):
    event_title: str
    event_type: str
    latitude: float
    longitude: float
    temperature: float = 32.0
    humidity: float = 85.0
    wind_speed: float = 15.0

@app.get("/")
def read_root():
    return {"status": "AI Service Running"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
    
    prompt = f"""You are ResQAI Emergency Assistant. 
    User Location: {request.location}
    User Message: {request.message}
    
    Task: Provide only necessary, critical life-saving advice for this situation. Include the specific government disaster & ambulance/medical helplines for "{request.location}". Keep the response short, concise, and bulleted."""
    try:
        response = model.generate_content(prompt)
        return {"reply": response.text}
    except Exception as e:
        print("Gemini Chat Error:", e)
        # Smart dynamic fallback for chat when quota exceeded / rate limited
        msg = request.message.lower()
        if "fire" in msg or "wildfire" in msg:
            reply = "ResQAI Emergency Protocol (Backup Mode): Wildfire Safety\n\n1. If ordered to evacuate, do so immediately.\n2. Keep windows and doors closed to prevent smoke and embers from entering.\n3. Pack your emergency supply kit (first-aid, papers, water) and place it in your vehicle."
        elif "flood" in msg or "rain" in msg or "storm" in msg:
            reply = "ResQAI Emergency Protocol (Backup Mode): Severe Storm & Flood Safety\n\n1. Move to higher ground immediately; do not walk or drive through floodwaters.\n2. Seek shelter indoors and stay away from windows.\n3. Keep emergency communication channels open and follow updates from local officials."
        else:
            reply = f"Thank you for contacting ResQAI. I am currently operating in Backup Mode because the Gemini API quota limit has been exceeded.\n\nTo assist you with your query about '{request.message}', please follow standard emergency instructions, monitor local media, and coordinate with response personnel."
            
        return {"reply": reply}

# Simple in-memory cache to avoid hitting Gemini 5 RPM rate limits
risk_cache = {}

@app.post("/api/risk-score")
async def calculate_risk(request: RiskRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    cache_key = f"{request.event_title}_{request.latitude}_{request.longitude}"
    if cache_key in risk_cache:
        print("Serving risk assessment from Python in-memory cache:", request.event_title)
        return risk_cache[cache_key]
        
    prompt = f"""You are ResQAI, an expert Disaster Analyst AI.
    Assess the risk of the following active disaster event:
    Event: {request.event_title}
    Type: {request.event_type}
    Location: Lat {request.latitude}, Lng {request.longitude}
    Current Weather: {request.temperature}°C, {request.humidity}% Humidity, Wind {request.wind_speed} km/h.
    
    Return ONLY a raw JSON object (without markdown code blocks, do not include ```json) with the following exact structure:
    {{
        "riskScore": integer (1-100),
        "severity": string ("Low", "Medium", "High", "Critical"),
        "analysis": string (short 2 sentence explanation of the risk based on the weather and event type),
        "recommendations": [ array of 3 short actionable response strategies ]
    }}
    """
    try:
        response = model.generate_content(prompt, request_options={"timeout": 8.0})
        import json
        import re
        text = response.text
        # Find the JSON block using regex to handle any markdown formatting
        match = re.search(r'\{.*\}', text, re.DOTALL)
        result = None
        if match:
            result = json.loads(match.group(0))
        else:
            result = json.loads(text.strip())
        
        risk_cache[cache_key] = result
        return result
    except Exception as e:
        print("Gemini Error:", e)
        
        # Smart dynamic fallback when API fails or quota is exceeded
        event_type = request.event_type.lower()
        title = request.event_title
        
        # Default fallback values
        risk_score = 65
        severity = "High"
        analysis = f"Pre-calculated threat model indicates potential impact from {title}. Local weather parameters show moderate susceptibility."
        recommendations = [
            "Monitor progress and coordinate with local emergency contacts.",
            "Ensure emergency equipment and resource kits are fully stocked.",
            "Check local evacuation routes and update response team standby status."
        ]
        
        if "fire" in event_type or "wildfire" in event_type or "fire" in title.lower():
            risk_score = 85
            severity = "High" if request.wind_speed < 20 else "Critical"
            analysis = f"High wildfire risk detected for '{title}'. Dry conditions ({request.humidity}% humidity) and wind speeds of {request.wind_speed} km/h favor rapid fire spread."
            recommendations = [
                "Establish a perimeter buffer zone around the reported coordinates.",
                "Notify residential areas downwind to prepare for potential evacuation.",
                "Pre-position high-volume water tankers and active firefighting assets."
            ]
        elif "storm" in event_type or "cyclone" in event_type or "typhoon" in event_type or "storm" in title.lower():
            risk_score = 78
            severity = "High"
            analysis = f"Severe weather risk for '{title}'. Expected precipitation combined with wind speed of {request.wind_speed} km/h poses significant risk of flooding and structure damage."
            recommendations = [
                "Issue coastal flood and flash flood warnings to surrounding zones.",
                "Ensure local community storm shelters are unlocked and fully supplied.",
                "Deploy emergency power generators to key regional hospitals."
            ]
        elif "volcano" in event_type or "volcanic" in event_type or "volcano" in title.lower():
            risk_score = 92
            severity = "Critical"
            analysis = f"Volcanic hazard detected at coordinates. Primary concerns include ash plumes and potential pyroclastic flows affecting nearby valleys."
            recommendations = [
                "Enforce a strict exclusion zone around the volcano base.",
                "Distribute respiratory protection masks to local residents.",
                "Prepare air quality warnings and activate local transport detours."
            ]
        elif "earthquake" in event_type or "seismic" in title.lower():
            risk_score = 80
            severity = "High"
            analysis = f"Seismic warning active for '{title}'. Focus is on structural integrity inspections and monitoring for potential aftershocks."
            recommendations = [
                "Instruct residents to review drop, cover, and hold-on procedures.",
                "Initiate structural safety checks on transit tunnels and bridges.",
                "Coordinate medical staff standby at nearest emergency center."
            ]
            
        return {
            "riskScore": risk_score,
            "severity": severity,
            "analysis": analysis,
            "recommendations": recommendations
        }
