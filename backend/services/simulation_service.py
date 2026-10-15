# Simulation Service
import asyncio
from typing import Dict, Optional, Tuple, Any
from backend.game.environment import GameEnvironment
from backend.game.state import GameState, Action, Team, GameStatus
from backend.agents.agents import BaseAgent, AttackerAgent, DefenderAgent
from backend.algorithms.search import MinimaxSearch, AlphaBetaSearch, SearchMetrics

class SimulationService:
    def __init__(self):
        self.env = GameEnvironment()
        self.agents: Dict[str, BaseAgent] = {}
        self.init_agents()
        self.is_auto_running = False
        self.delay_ms = 800
        self.latest_decision_info: Dict[str, Any] = {}
        self.last_search_metrics: Optional[SearchMetrics] = None

    def init_agents(self, a1_algo: str = "Alpha-Beta", b1_algo: str = "Alpha-Beta", depth: int = 2):
        self.agents = {
            "A1": AttackerAgent("A1", Team.A, use_pruning=(a1_algo == "Alpha-Beta"), depth=depth),
            "A2": DefenderAgent("A2", Team.A),
            "B1": AttackerAgent("B1", Team.B, use_pruning=(b1_algo == "Alpha-Beta"), depth=depth),
            "B2": DefenderAgent("B2", Team.B),
        }
        # Update strategy label in state
        if "A1" in self.env.state.agents:
            self.env.state.agents["A1"].strategy = a1_algo
        if "B1" in self.env.state.agents:
            self.env.state.agents["B1"].strategy = b1_algo

    def reset_match(self, scenario_id: Optional[str] = None):
        self.is_auto_running = False
        if scenario_id:
            self.env.load_scenario(scenario_id)
        else:
            self.env.state = self.env.create_standard_state()
        self.init_agents()
        self.latest_decision_info = {}
        self.last_search_metrics = None

    def step(self) -> Dict[str, Any]:
        """Perform one autonomous agent turn."""
        state = self.env.state
        if state.status == GameStatus.COMPLETED:
            return {"success": False, "message": "Match already concluded.", "state": state.model_dump()}

        state.status = GameStatus.RUNNING
        acting_id = state.current_agent_id
        agent = self.agents.get(acting_id)

        if not agent:
            # Advance if agent not found
            self.env._advance_turn()
            return {"success": False, "message": f"Agent {acting_id} not registered."}

        # 1. Generate Inter-Agent Messages
        new_msgs = agent.generate_coordination_messages(state)
        for msg in new_msgs:
            state.messages.append(msg)

        # 2. Select Action & formulate reason
        action, reason, metrics = agent.select_action(state)
        action.explanation = reason

        if metrics:
            self.last_search_metrics = metrics

        # 3. Apply Action in authoritative game environment
        success, exec_msg, updated_state = self.env.step(acting_id, action)

        # Record decision inspection data
        self.latest_decision_info = {
            "agent_id": acting_id,
            "turn": updated_state.turn,
            "action": action.summary(),
            "reason": reason,
            "execution_result": exec_msg,
            "metrics": metrics.model_dump() if metrics else None,
            "valid_actions": [a.summary() for a in self.env.state.agents.get(acting_id, None) and [] or []]
        }

        return {
            "success": success,
            "message": exec_msg,
            "decision": self.latest_decision_info,
            "state": updated_state.model_dump()
        }

    def compare_algorithms(self, depth: int = 2) -> Dict[str, Any]:
        """Directly benchmark pure Minimax vs Minimax with Alpha-Beta Pruning on current state."""
        state_clone = self.env.state.clone()
        acting_id = state_clone.current_agent_id

        minimax = MinimaxSearch(depth=depth)
        alpha_beta = AlphaBetaSearch(depth=depth)

        act_mm, metrics_mm = minimax.search(state_clone, acting_id)
        act_ab, metrics_ab = alpha_beta.search(state_clone, acting_id)

        return {
            "agent_id": acting_id,
            "depth": depth,
            "minimax": metrics_mm.model_dump(),
            "alpha_beta": metrics_ab.model_dump(),
            "identical_action": (act_mm.summary() if act_mm else None) == (act_ab.summary() if act_ab else None),
            "identical_score": abs(metrics_mm.best_score - metrics_ab.best_score) < 0.01,
            "nodes_saved": metrics_mm.nodes_visited - metrics_ab.nodes_visited,
            "speedup_ratio": round(metrics_mm.execution_time_ms / max(metrics_ab.execution_time_ms, 0.001), 2)
        }
