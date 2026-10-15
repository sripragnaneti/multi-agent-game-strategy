# Minimax Search and Alpha-Beta Pruning Implementation
from typing import Tuple, Optional, List, Dict, Any
import time
import math
from pydantic import BaseModel
from backend.game.state import GameState, Action, Team, ActionType
from backend.game.rules import GameRules
from backend.game.rewards import evaluate_team_utility

class SearchMetrics(BaseModel):
    algorithm: str
    depth: int
    nodes_visited: int = 0
    leaf_nodes_evaluated: int = 0
    branches_pruned: int = 0
    execution_time_ms: float = 0.0
    best_action: Optional[str] = None
    best_score: float = 0.0
    search_tree: Optional[Dict[str, Any]] = None

class MinimaxSearch:
    """
    Standard Minimax without pruning.
    Serves as the ground truth baseline to verify Alpha-Beta equivalence.
    """
    def __init__(self, depth: int = 2):
        self.depth = depth

    def search(self, state: GameState, agent_id: str) -> Tuple[Optional[Action], SearchMetrics]:
        start_time = time.perf_counter()
        agent = state.get_agent(agent_id)
        if not agent:
            return None, SearchMetrics(algorithm="Minimax", depth=self.depth)

        team = agent.team
        metrics = SearchMetrics(algorithm="Minimax", depth=self.depth)

        best_action, best_val, tree = self._minimax(
            state, agent_id, self.depth, is_maximizing=True, team=team, metrics=metrics
        )

        metrics.execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        metrics.best_action = best_action.summary() if best_action else "WAIT"
        metrics.best_score = round(best_val, 2)
        metrics.search_tree = tree
        return best_action, metrics

    def _minimax(
        self, state: GameState, agent_id: str, depth: int,
        is_maximizing: bool, team: Team, metrics: SearchMetrics
    ) -> Tuple[Optional[Action], float, Dict[str, Any]]:
        metrics.nodes_visited += 1

        is_term, _, _ = GameRules.check_terminal_condition(state)
        if depth == 0 or is_term:
            metrics.leaf_nodes_evaluated += 1
            utility = evaluate_team_utility(state, team)
            return None, utility, {
                "name": f"Leaf (U={round(utility, 1)})",
                "score": round(utility, 1),
                "type": "leaf",
                "depth": depth
            }

        valid_actions = GameRules.get_valid_actions(state, agent_id)
        if not valid_actions:
            valid_actions = [Action(action_type=ActionType.WAIT)]

        best_action = valid_actions[0]
        tree_node = {
            "name": f"{agent_id} ({'MAX' if is_maximizing else 'MIN'})",
            "type": "max" if is_maximizing else "min",
            "depth": depth,
            "children": []
        }

        # Determine next agent for adversarial turn
        opponents = [a.id for a in state.agents.values() if a.team != team and a.is_alive]
        next_agent_id = opponents[0] if opponents else agent_id

        if is_maximizing:
            max_eval = -math.inf
            for action in valid_actions:
                sim_state = state.clone()
                GameRules.apply_action(sim_state, agent_id, action)

                _, eval_val, child_tree = self._minimax(
                    sim_state, next_agent_id, depth - 1, False, team, metrics
                )
                child_tree["action"] = action.summary()
                child_tree["score"] = round(eval_val, 1)
                tree_node["children"].append(child_tree)

                if eval_val > max_eval:
                    max_eval = eval_val
                    best_action = action

            tree_node["score"] = round(max_eval, 1)
            return best_action, max_eval, tree_node
        else:
            min_eval = math.inf
            for action in valid_actions:
                sim_state = state.clone()
                GameRules.apply_action(sim_state, agent_id, action)

                _, eval_val, child_tree = self._minimax(
                    sim_state, agent_id, depth - 1, True, team, metrics
                )
                child_tree["action"] = action.summary()
                child_tree["score"] = round(eval_val, 1)
                tree_node["children"].append(child_tree)

                if eval_val < min_eval:
                    min_eval = eval_val
                    best_action = action

            tree_node["score"] = round(min_eval, 1)
            return best_action, min_eval, tree_node


class AlphaBetaSearch:
    """
    Minimax search with Alpha-Beta Pruning.
    Prunes branches where beta <= alpha, guaranteeing identical outcome with fewer node visits.
    """
    def __init__(self, depth: int = 2):
        self.depth = depth

    def search(self, state: GameState, agent_id: str) -> Tuple[Optional[Action], SearchMetrics]:
        start_time = time.perf_counter()
        agent = state.get_agent(agent_id)
        if not agent:
            return None, SearchMetrics(algorithm="Alpha-Beta", depth=self.depth)

        team = agent.team
        metrics = SearchMetrics(algorithm="Alpha-Beta", depth=self.depth)

        best_action, best_val, tree = self._alpha_beta(
            state, agent_id, self.depth, alpha=-math.inf, beta=math.inf,
            is_maximizing=True, team=team, metrics=metrics
        )

        metrics.execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        metrics.best_action = best_action.summary() if best_action else "WAIT"
        metrics.best_score = round(best_val, 2)
        metrics.search_tree = tree
        return best_action, metrics

    def _alpha_beta(
        self, state: GameState, agent_id: str, depth: int,
        alpha: float, beta: float, is_maximizing: bool, team: Team,
        metrics: SearchMetrics
    ) -> Tuple[Optional[Action], float, Dict[str, Any]]:
        metrics.nodes_visited += 1

        is_term, _, _ = GameRules.check_terminal_condition(state)
        if depth == 0 or is_term:
            metrics.leaf_nodes_evaluated += 1
            utility = evaluate_team_utility(state, team)
            return None, utility, {
                "name": f"Leaf (U={round(utility, 1)})",
                "score": round(utility, 1),
                "type": "leaf",
                "depth": depth,
                "alpha": round(alpha, 1) if alpha != -math.inf else "-∞",
                "beta": round(beta, 1) if beta != math.inf else "+∞"
            }

        valid_actions = GameRules.get_valid_actions(state, agent_id)
        if not valid_actions:
            valid_actions = [Action(action_type=ActionType.WAIT)]

        best_action = valid_actions[0]
        tree_node = {
            "name": f"{agent_id} ({'MAX' if is_maximizing else 'MIN'})",
            "type": "max" if is_maximizing else "min",
            "depth": depth,
            "alpha": round(alpha, 1) if alpha != -math.inf else "-∞",
            "beta": round(beta, 1) if beta != math.inf else "+∞",
            "children": []
        }

        opponents = [a.id for a in state.agents.values() if a.team != team and a.is_alive]
        next_agent_id = opponents[0] if opponents else agent_id

        if is_maximizing:
            max_eval = -math.inf
            for idx, action in enumerate(valid_actions):
                sim_state = state.clone()
                GameRules.apply_action(sim_state, agent_id, action)

                _, eval_val, child_tree = self._alpha_beta(
                    sim_state, next_agent_id, depth - 1, alpha, beta, False, team, metrics
                )
                child_tree["action"] = action.summary()
                child_tree["score"] = round(eval_val, 1)
                tree_node["children"].append(child_tree)

                if eval_val > max_eval:
                    max_eval = eval_val
                    best_action = action
                alpha = max(alpha, eval_val)

                if beta <= alpha:
                    metrics.branches_pruned += (len(valid_actions) - (idx + 1))
                    tree_node["pruned"] = True
                    break

            tree_node["score"] = round(max_eval, 1)
            return best_action, max_eval, tree_node
        else:
            min_eval = math.inf
            for idx, action in enumerate(valid_actions):
                sim_state = state.clone()
                GameRules.apply_action(sim_state, agent_id, action)

                _, eval_val, child_tree = self._alpha_beta(
                    sim_state, agent_id, depth - 1, alpha, beta, True, team, metrics
                )
                child_tree["action"] = action.summary()
                child_tree["score"] = round(eval_val, 1)
                tree_node["children"].append(child_tree)

                if eval_val < min_eval:
                    min_eval = eval_val
                    best_action = action
                beta = min(beta, eval_val)

                if beta <= alpha:
                    metrics.branches_pruned += (len(valid_actions) - (idx + 1))
                    tree_node["pruned"] = True
                    break

            tree_node["score"] = round(min_eval, 1)
            return best_action, min_eval, tree_node
