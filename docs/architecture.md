# AI Team Strategy Arena: Comprehensive Documentation & Review Guide

## Fundamentals of Artificial Intelligence — Multi-Agent Game Strategy Case Study

### 1. Executive Summary & Problem Formulation
The **AI Team Strategy Arena** is an interactive, browser-based multi-agent game simulation engineered specifically for the evaluation of the college case study **"Multi-Agent Game Strategy"** in **Fundamentals of Artificial Intelligence**.

It implements an authoritative Python backend engine executing genuine state-space transformations, adversarial Minimax search, Alpha-Beta branch pruning, deterministic combat and objective capture mechanics, and peer-to-peer inter-agent coordination broadcast messaging, visualized through a modern React + Vite dashboard.

---

### 2. PEAS Formulation
* **Performance Measure (P):**
  - **Match Victory (+100 pts) / Defeat (-100 pts)**.
  - **Contested Relic Capture (+15 to +20 pts)** on collection.
  - **Hostile Agent Knockout (+25 pts)** and direct combat damage (+2 pts per HP inflicted).
  - **Teammate Preservation:** Deductions for friendly health lost (-2 pts per HP).
* **Environment (E):**
  - **7 × 7 Discrete Grid Arena** indexed `(0,0)` to `(6,6)`.
  - Static barrier obstacles providing tactical cover.
  - 3 Strategic Relic Objectives (Primary Nexus at `(3,3)`, North Relay at `(1,3)`, South Relay at `(5,3)`).
  - Round-robin turn sequence: `A1 -> B1 -> A2 -> B2`.
  - Deterministic state transitions with zero unauthorized external state mutations.
* **Actuators (A):**
  - `MOVE [UP, DOWN, LEFT, RIGHT]`: Moves to an adjacent orthogonal walkable cell.
  - `ATTACK [TARGET_ID]`: Strikes an opponent within Chebyshev distance 1 (8 surrounding cells).
  - `DEFEND`: Dynamic tactical stance granting **50% incoming damage reduction** (damage reduced from 25 HP to 12 HP).
  - `COLLECT`: Captures a strategic objective when occupying its tile.
  - `WAIT`: Conserves position when no tactical advantage is available.
* **Sensors (S):**
  - Self position `(r, c)` and health status `(0-100 HP)`.
  - Teammate status, position, and active stance.
  - Known opponent positions, HP, and defense flags.
  - Status and ownership of all 3 objectives.
  - Real-time peer-to-peer team messaging bus.

---

### 3. Russell & Norvig Environment Taxonomy
1. **Multi-Agent:** Both **competitive** (Team A vs Team B) and **strictly cooperative** (A1 with A2; B1 with B2).
2. **Deterministic:** Given state $S$ and action $A$, the resulting state $S'$ is completely deterministic.
3. **Sequential:** Actions taken in early turns alter board positioning, health pools, and relic control for subsequent turns.
4. **Discrete:** Discrete coordinates, integer turns, discrete action enumerations, and finite search states.

---

### 4. Search Algorithms & Alpha-Beta Pruning Invariance
The system models adversarial decisions through Minimax with Alpha-Beta Pruning on simulated state copies without mutating the authoritative live game state:
* **Evaluation Utility Function $U(s)$:**
  $$U(s) = 2.0 \cdot \Delta \text{Score} + 50.0 \cdot \Delta \text{Alive} + 0.5 \cdot \Delta \text{HP} + 15.0 \cdot \text{RelicsHeld} + 2.0 \cdot \text{ProximityToRelic} \pm 1000.0 \text{ (Terminal)}$$
* **Alpha-Beta Pruning Invariance:**
  Alpha-Beta guarantees the exact same backed-up utility and action selection as pure Minimax while establishing branch cutoffs whenever $\beta \le \alpha$.

---

### 5. Preset Demonstration Scenarios (Rubric Aligned)
1. **Standard Balanced Match:** Full 7x7 symmetrical board testing end-to-end multi-agent game dynamics.
2. **Opponent in Range (Melee Clash):** A1 and B1 adjacent. Demonstrates immediate Minimax combat vs defense decision.
3. **Teammate Under Threat (Coordination):** A1 at critical 25 HP cornered by B1. A2 receives peer broadcast alert and maneuvers to provide cover and crossfire.
4. **Contested Strategic Relic:** Central Nexus contested by both teams. Tests utility tradeoff between combat and points.
5. **Chokepoint & Obstacle Navigation:** Wall of obstacles leaving a single corridor. Tests pathfinding and bottleneck control.
6. **Low-Health Defensive Stance:** A1 wounded (15 HP). Demonstrates dynamic stance switch to survive incoming strike.
7. **Match-Ending Endgame:** Team A at 90 points. Capturing the objective triggers immediate victory condition.

---

### 6. Automated Testing Suite
Executed via `pytest backend/tests/ -v`:
* `test_initialization`: 4 agents, 2 teams, 3 objectives correctly initialized.
* `test_valid_movement`: Grid coordinate updates upon valid move action.
* `test_obstacle_rejection`: Illegal traversal into obstacles strictly prohibited.
* `test_out_of_bounds_rejection`: Bounds enforcement outside 7x7 perimeter.
* `test_attack_and_damage`: Base attack applies 25 HP damage.
* `test_defend_stance_reduces_damage`: Defend stance halves incoming damage to 12 HP.
* `test_objective_capture`: Objective scoring and team ownership assignment.
* `test_minimax_and_alphabeta_equivalence`: Proves mathematical equivalence of Alpha-Beta and pure Minimax.
* `test_simulation_service_step_and_scenarios`: Full turn step execution and scenario resets.
* **Result:** **9 passed in 1.05s (100% pass rate)**.
