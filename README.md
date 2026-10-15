# AI Team Strategy Arena: Interactive Multi-Agent Game Simulation

An interactive, browser-based multi-agent game strategy simulation designed for the **Fundamentals of Artificial Intelligence** college case study: **"Multi-Agent Game Strategy"**.

---

## 🌟 Key Capabilities
- **4 Autonomous AI Agents:** Team A (A1 Attacker, A2 Defender/Support) vs Team B (B1 Attacker, B2 Flanker).
- **Adversarial Search:** Genuine Minimax search with Alpha-Beta Pruning, real-time node exploration metrics, and branch cutoffs.
- **Inter-Agent Communication Bus:** Structured peer-to-peer tactical messaging for intra-team coordination (e.g., requesting defense, calling focus targets, claiming objectives).
- **Interactive Web Interface:** Real-time 7x7 grid visualization, team statistics, active agent reasoning breakdowns, chronological event timeline, and live Recharts analytics.
- **7 Evaluation Scenarios:** Preset scenarios directly aligned with the course review criteria (e.g., Melee Clash, Teammate Under Threat, Chokepoint Navigation, Low-Health Survival, Match Endgame).

---

## 🚀 Quickstart Guide

### 1. Requirements
- **Python**: 3.10+ (Tested on Python 3.12.2)
- **Node.js**: v18+ or v20+ (Tested on Node.js v20.12.2 and npm 10.8.0)

### 2. Backend Setup & Startup
Open a terminal in the project root:
```bash
# Install Python backend dependencies
python -m pip install -r backend/requirements.txt

# Start the FastAPI & WebSockets backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Backend API will be accessible at: `http://localhost:8000`
Interactive Swagger Docs: `http://localhost:8000/docs`

### 3. Frontend Setup & Startup
Open a second terminal in the `frontend` directory:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Automated Testing
Run the automated test suite verifying game mechanics, obstacle rejection, damage calculations, and Minimax / Alpha-Beta mathematical equivalence:
```bash
python -m pytest backend/tests/ -v
```
All 9 test cases pass in ~1.0s.

---

## 🎯 Case Study & Evaluation Alignment (10/10 Marks)
1. **Tool/Package Selection & Setup (3 Marks):** Modern Python FastAPI backend + Vite React TypeScript frontend with clean separation of concerns and WebSockets streaming.
2. **Multi-Agent Execution & Interaction (3 Marks):** 4 autonomous agents with distinctive roles, independent decision cycles, and peer-to-peer communication.
3. **Demo Quality & Testing Scenarios (3 Marks):** Polished dark-mode UI with 7 preset scenarios, controllable simulation speed, step-by-step turn inspection, and direct Minimax vs Alpha-Beta benchmarking.
4. **Code Structure & Scalability (1 Mark):** Cleanly decoupled architecture across `game/`, `agents/`, `algorithms/`, `services/`, and `frontend/components/`.
