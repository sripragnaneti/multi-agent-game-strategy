# AI Team Strategy Arena: Design & Implementation Specification

## 1. System Overview & Case Study Alignment
This document establishes the architecture, deterministic game rules, PEAS specification, multi-agent coordination mechanism, Minimax & Alpha-Beta Pruning formulation, evaluation functions, API contracts, and testing plan for the **AI Team Strategy Arena**.

Aligned directly with the college case study **"Multi-Agent Game Strategy"** for *Fundamentals of Artificial Intelligence*.

---

## 2. PEAS Formulation
* **Performance Measure (P):**
  - Match Victory (+100) or Draw (0) or Defeat (-100).
  - Capturing Contested Resource Nodes / Objectives (+30 each).
  - Inflicting damage / defeating an enemy agent (+25 for knockout, +2 per HP damage dealt).
  - Teammate survival (+20 per surviving teammate) and preventing friendly damage (-2 per friendly HP lost).
  - Efficient pathing / minimizing wasted turns (-1 step penalty to incentivize goal completion).
* **Environment (E):**
  - **7 × 7 Grid Arena** with discrete grid coordinates `(x, y)` where `0 <= x, y <= 6`.
  - Static Obstacles (Cover barriers).
  - Energy/Strategic Relic Objectives (e.g., Center Objective `(3,3)` and Flank Objectives `(1,5)` and `(5,1)`).
  - Multi-agent: 4 autonomous agents (Team A: A1, A2 vs Team B: B1, B2).
  - Deterministic & Sequential (Round-robin turns: A1 -> B1 -> A2 -> B2).
  - Known static layout with explicit agent field-of-view / sensor range (demonstrating observation vs authoritative state).
* **Actuators (A):**
  - `MOVE [UP, DOWN, LEFT, RIGHT]` (adjacent orthogonal grid cell).
  - `ATTACK [TARGET_AGENT_ID]` (orthogonal or diagonal distance <= range).
  - `DEFEND` (enters defensive stance, granting 50% damage reduction until next turn).
  - `COLLECT` (captures/scores points on an objective cell).
  - `WAIT` (idle when no tactical advantage exists).
* **Sensors (S):**
  - Agent position `(x, y)` and current HP (Max 100).
  - Teammate status (position, HP, active stance, role).
  - Opponent status (positions, HP, active stance).
  - Objective nodes status (unclaimed, contested, captured by Team A/B).
  - Inter-agent coordination message bus (inbox of tactical broadcasts).

---

## 3. Game Rules & Mechanics

1. **Grid & Occupancy:**
   - 7x7 grid. Cells are Walkable, Blocked (Obstacle), or Objective.
   - Exact one agent per cell. Agents cannot walk into obstacles, out of bounds, or occupied cells.
2. **Health & Damage:**
   - Base HP: 100 per agent.
   - Attack Range: Manhattan distance <= 1 (adjacent) or Chebyshev distance <= 1 (includes diagonals) - set to Chebyshev distance 1 (8 surrounding tiles) for tactical melee/close-combat.
   - Base Attack Damage: 25 HP.
   - Defense: Entering `DEFEND` reduces incoming damage by 50% (rounded down: 12 damage instead of 25).
   - Knockout: An agent at 0 HP is eliminated from the board and skips future turns.
3. **Objectives:**
   - Control nodes yield +15 points on initial capture and +5 points each round held.
   - Capturing requires an agent to stand on the cell and execute `COLLECT` (or auto-capture on turn end when standing uncontested).
4. **Turn Structure & Termination:**
   - Round-robin: Turn 1 (A1) -> Turn 2 (B1) -> Turn 3 (A2) -> Turn 4 (B2).
   - Maximum turns limit: 60 turns (15 full rounds).
   - Victory conditions:
     - Total Elimination: All agents of one team knocked out -> opposing team wins immediately.
     - Score Threshold: Reaching >= 100 points.
     - Timeout: Higher score wins at turn 60. Tie-breaker: Total remaining team HP. If still equal: Stalemate/Draw.

---

## 4. Multi-Agent Architecture & Decision Strategies

1. **Role Differentiation:**
   - **Agent A1 (Team A - Attacker / Striker):**
     - Strategy: Minimax with Alpha-Beta Pruning (Adversarial search evaluating tactical offensive positioning, damage maximization, and opponent counter-attacks).
   - **Agent A2 (Team A - Defender & Support):**
     - Strategy: Utility-based Cooperative Tactical AI with Heuristic Evaluation (Protects A1, screens threats, contests secondary objectives, defends when focused).
   - **Agent B1 (Team B - Aggressive Vanguard):**
     - Strategy: Minimax / Alpha-Beta Pruning (Minimizes Team A utility, pursues relic capture and counter-strikes A1/A2).
   - **Agent B2 (Team B - Tactical Tactician & Flanker):**
     - Strategy: Dynamic Strategic Coordinator (Disrupts A1/A2 formations, flanks wounded agents, captures uncovered objectives).
2. **Explicit Agent Communication Protocol:**
   - Structured JSON message broadcasting on Team Message Bus:
     `{ "sender": "A1", "target": "A2", "type": "PROTECT_ME" | "TARGET_ENEMY" | "CONTEST_OBJECTIVE" | "RETREAT", "location": [x, y], "reason": "Low health..." }`
   - Messages are generated deterministically based on environmental triggers and directly modify utility weights of the receiving teammate.

---

## 5. Minimax with Alpha-Beta Pruning Formulation

- **Search State:** Deep-copied game state projection.
- **Perspective:** Team-level utility $U(s) = W_1 \cdot \Delta \text{Score} + W_2 \cdot \Delta \text{Health} + W_3 \cdot \text{ObjectiveControl} - W_4 \cdot \text{ThreatExposure} + W_5 \cdot \text{ProximityToTarget}$.
- **Tree Alternation:**
  - MAX Node: Acting agent picks best action maximizing $U(s)$.
  - MIN Node: Anticipated opponent response picks action minimizing $U(s)$.
- **Pruning Metrics Logged:**
  - Tree depth reached (default depth: 2 to 3 ply).
  - Total nodes explored vs pruned.
  - Number of cutoff events where $\beta \le \alpha$.
  - Exact time per decision (ms).
  - Comparison mode: Runs pure Minimax alongside Alpha-Beta on identical states to prove mathematically identical action selection with dramatic node savings.

---

## 6. Preset Demonstration Scenarios (Evaluation Rubric aligned)
1. **Scenario 1: Standard Match** - Balanced 7x7 arena with 3 objectives and symmetrical obstacles.
2. **Scenario 2: Opponent in Range (Melee Clash)** - A1 and B1 adjacent; demonstrates Minimax attack vs defend decisions.
3. **Scenario 3: Teammate Under Threat** - A1 at low HP cornered by B1; A2 receives coordination message and intervenes to body-block/attack B1.
4. **Scenario 4: Contested Objective** - Center relic contested by both teams; demonstrates utility tradeoff between combat and scoring.
5. **Scenario 5: Obstacle Maze Navigation** - Maze/chokepoint obstacle barrier testing pathfinding and tactical chokepoint control.
6. **Scenario 6: Low-Health Survival Decision** - A1 at 15 HP choosing between DEFEND and tactical retreat while A2 covers.
7. **Scenario 7: Match Endgame (Elimination/Score Cap)** - One turn away from victory, demonstrating decisive terminal state evaluation.
