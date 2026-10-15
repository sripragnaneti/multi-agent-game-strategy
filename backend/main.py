# FastAPI Application and Routes
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import asyncio
import json

from backend.services.simulation_service import SimulationService

app = FastAPI(
    title="AI Team Strategy Arena API",
    description="Backend engine for the Multi-Agent Game Strategy Simulation (Fundamentals of AI).",
    version="1.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = SimulationService()

class ConfigPayload(BaseModel):
    a1_algo: Optional[str] = "Alpha-Beta"
    b1_algo: Optional[str] = "Alpha-Beta"
    depth: Optional[int] = 2

class ScenarioPayload(BaseModel):
    scenario_id: str

@app.get("/api/state")
def get_state():
    """Retrieve full authoritative game state."""
    return {
        "state": service.env.state.model_dump(),
        "latest_decision": service.latest_decision_info,
        "is_auto_running": service.is_auto_running
    }

@app.post("/api/step")
def step_simulation():
    """Execute one turn of the active agent."""
    result = service.step()
    return result

@app.post("/api/reset")
def reset_match(payload: Optional[ScenarioPayload] = None):
    """Reset match or load a preset demonstration scenario."""
    scenario_id = payload.scenario_id if payload else None
    service.reset_match(scenario_id)
    return {
        "status": "reset",
        "scenario": scenario_id or "standard",
        "state": service.env.state.model_dump()
    }

@app.post("/api/config")
def update_config(payload: ConfigPayload):
    """Reconfigure agent search algorithms and depth."""
    service.init_agents(
        a1_algo=payload.a1_algo or "Alpha-Beta",
        b1_algo=payload.b1_algo or "Alpha-Beta",
        depth=payload.depth or 2
    )
    return {"status": "configured", "config": payload.model_dump()}

@app.get("/api/compare")
def compare_algorithms(depth: int = 2):
    """Benchmark pure Minimax vs Alpha-Beta Pruning on current game state."""
    return service.compare_algorithms(depth=depth)

@app.get("/api/scenarios")
def list_scenarios():
    """Available preset demonstration scenarios."""
    return [
        {
            "id": "standard",
            "name": "1. Standard Balanced Match",
            "description": "7x7 symmetric board with 3 objectives and cover obstacles. Tests complete multi-agent dynamics."
        },
        {
            "id": "opponent_in_range",
            "name": "2. Opponent in Range (Melee Clash)",
            "description": "Agent A1 and B1 adjacent. Tests immediate adversarial Minimax combat vs defense decision."
        },
        {
            "id": "teammate_under_threat",
            "name": "3. Teammate Under Threat (Coordination)",
            "description": "A1 is low health and cornered; A2 receives broadcast alert and maneuvers to provide cover."
        },
        {
            "id": "contested_objective",
            "name": "4. Contested Strategic Relic",
            "description": "Central Nexus contested by both teams. Tests utility tradeoff between combat and points."
        },
        {
            "id": "obstacle_blocking",
            "name": "5. Chokepoint & Obstacle Navigation",
            "description": "Wall of obstacles leaving a single corridor. Tests pathfinding and bottleneck control."
        },
        {
            "id": "low_health_defense",
            "name": "6. Low-Health Defensive Stance",
            "description": "A1 is critically wounded (15 HP). Demonstrates dynamic stance switch to survive incoming strike."
        },
        {
            "id": "match_ending",
            "name": "7. Match-Ending Endgame",
            "description": "Team A is at 90 points. Capturing the objective triggers immediate victory condition."
        }
    ]

# WebSocket for high-frequency live state pushes during automatic simulation
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_text(json.dumps({
            "type": "STATE_UPDATE",
            "state": service.env.state.model_dump(),
            "latest_decision": service.latest_decision_info
        }))
        while True:
            data = await websocket.receive_text()
            cmd = json.loads(data)
            action = cmd.get("action")

            if action == "STEP":
                res = service.step()
                await manager.broadcast(json.dumps({
                    "type": "STATE_UPDATE",
                    "result": res,
                    "state": service.env.state.model_dump(),
                    "latest_decision": service.latest_decision_info
                }))
            elif action == "START_AUTO":
                service.is_auto_running = True
                asyncio.create_task(run_auto_loop())
            elif action == "PAUSE_AUTO":
                service.is_auto_running = False
                await manager.broadcast(json.dumps({"type": "STATUS", "is_auto_running": False}))
            elif action == "RESET":
                scenario = cmd.get("scenario")
                service.reset_match(scenario)
                await manager.broadcast(json.dumps({
                    "type": "STATE_UPDATE",
                    "state": service.env.state.model_dump(),
                    "latest_decision": {}
                }))
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket)

async def run_auto_loop():
    while service.is_auto_running and service.env.state.status != "COMPLETED":
        service.step()
        await manager.broadcast(json.dumps({
            "type": "STATE_UPDATE",
            "state": service.env.state.model_dump(),
            "latest_decision": service.latest_decision_info,
            "is_auto_running": service.is_auto_running
        }))
        await asyncio.sleep(0.7)
    service.is_auto_running = False
    await manager.broadcast(json.dumps({
        "type": "STATUS",
        "is_auto_running": False,
        "state": service.env.state.model_dump()
    }))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
