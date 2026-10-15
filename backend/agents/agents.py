# Base Agent and Concrete Agent Roles
from abc import ABC, abstractmethod
from typing import Tuple, List, Optional, Dict, Any
from backend.game.state import GameState, Action, ActionType, Team, Message, Direction
from backend.game.rules import GameRules, ATTACK_RANGE_CHEBYSHEV
from backend.algorithms.search import AlphaBetaSearch, MinimaxSearch, SearchMetrics

class DecisionExplanation:
    def __init__(self, action: Action, reason: str, metrics: Optional[SearchMetrics] = None):
        self.action = action
        self.reason = reason
        self.metrics = metrics

    def to_dict(self) -> Dict[str, Any]:
        return {
            "action": self.action.summary(),
            "reason": self.reason,
            "metrics": self.metrics.model_dump() if self.metrics else None
        }

class BaseAgent(ABC):
    def __init__(self, agent_id: str, team: Team):
        self.agent_id = agent_id
        self.team = team

    @abstractmethod
    def select_action(self, state: GameState) -> Tuple[Action, str, Optional[SearchMetrics]]:
        """
        Decision cycle:
        1. Observe state
        2. Filter valid actions
        3. Evaluate context & communications
        4. Select action & formulate reasoned explanation
        """
        pass

    def generate_coordination_messages(self, state: GameState) -> List[Message]:
        """Examine state and emit tactical alerts to teammate."""
        return []

class AttackerAgent(BaseAgent):
    """
    Minimax / Alpha-Beta Pruning Attacker.
    Prioritizes adversarial search, combat advantages, and objective capture.
    """
    def __init__(self, agent_id: str, team: Team, use_pruning: bool = True, depth: int = 2):
        super().__init__(agent_id, team)
        self.searcher = AlphaBetaSearch(depth=depth) if use_pruning else MinimaxSearch(depth=depth)

    def select_action(self, state: GameState) -> Tuple[Action, str, Optional[SearchMetrics]]:
        agent = state.get_agent(self.agent_id)
        if not agent or not agent.is_alive:
            return Action(action_type=ActionType.WAIT), "Agent is inactive.", None

        # 1. Check for immediate critical condition (Very low HP adjacent to threat -> Defend or Evasive)
        opponents_in_range = [
            o for o in state.agents.values()
            if o.team != self.team and o.is_alive and
            max(abs(agent.position[0]-o.position[0]), abs(agent.position[1]-o.position[1])) <= ATTACK_RANGE_CHEBYSHEV
        ]

        if agent.hp <= 25 and opponents_in_range:
            action = Action(action_type=ActionType.DEFEND)
            return action, f"Critical health ({agent.hp} HP) with {opponents_in_range[0].id} in strike range. Assuming defensive stance to survive.", None

        # 2. Check if already standing on an uncaptured objective
        for obj in state.objectives:
            if obj.position == agent.position and obj.captured_by != self.team:
                action = Action(action_type=ActionType.COLLECT)
                return action, f"Secured position on {obj.name}. Executing objective capture for +{obj.points} points.", None

        # 3. Adversarial Search (Minimax with Alpha-Beta Pruning)
        best_action, metrics = self.searcher.search(state, self.agent_id)
        if not best_action:
            best_action = Action(action_type=ActionType.WAIT)

        reason = (
            f"Alpha-Beta search (depth {metrics.depth}) selected {best_action.summary()} "
            f"yielding utility {metrics.best_score:.1f} after evaluating {metrics.leaf_nodes_evaluated} states "
            f"and pruning {metrics.branches_pruned} branches in {metrics.execution_time_ms}ms."
        )
        return best_action, reason, metrics

    def generate_coordination_messages(self, state: GameState) -> List[Message]:
        msgs: List[Message] = []
        agent = state.get_agent(self.agent_id)
        if not agent or not agent.is_alive:
            return msgs

        teammates = [a for a in state.agents.values() if a.team == self.team and a.id != self.agent_id and a.is_alive]
        if not teammates:
            return msgs
        teammate = teammates[0]

        # Trigger 1: Health Alert
        if agent.hp <= 30:
            msgs.append(Message(
                id=f"msg_{len(state.messages)+1}",
                turn=state.turn,
                sender_id=self.agent_id,
                team=self.team,
                recipient_id=teammate.id,
                msg_type="REQUEST_SUPPORT",
                content=f"Critical HP ({agent.hp}/100)! Requesting defensive cover.",
                location=agent.position
            ))

        # Trigger 2: Opponent in Range
        opps = [
            o for o in state.agents.values()
            if o.team != self.team and o.is_alive and
            max(abs(agent.position[0]-o.position[0]), abs(agent.position[1]-o.position[1])) <= ATTACK_RANGE_CHEBYSHEV
        ]
        if opps:
            msgs.append(Message(
                id=f"msg_{len(state.messages)+1}",
                turn=state.turn,
                sender_id=self.agent_id,
                team=self.team,
                recipient_id=teammate.id,
                msg_type="TARGET_ALERT",
                content=f"Engaging enemy {opps[0].id} at {opps[0].position}. Coordinate crossfire.",
                location=opps[0].position
            ))

        return msgs

class DefenderAgent(BaseAgent):
    """
    Cooperative Support & Defender.
    Protects teammates, blocks lanes, assists in combat, and captures secondary objectives.
    """
    def __init__(self, agent_id: str, team: Team):
        super().__init__(agent_id, team)

    def select_action(self, state: GameState) -> Tuple[Action, str, Optional[SearchMetrics]]:
        agent = state.get_agent(self.agent_id)
        if not agent or not agent.is_alive:
            return Action(action_type=ActionType.WAIT), "Agent is inactive.", None

        valid_actions = GameRules.get_valid_actions(state, self.agent_id)
        if not valid_actions:
            return Action(action_type=ActionType.WAIT), "No valid actions available.", None

        # 1. Collect if on objective
        for act in valid_actions:
            if act.action_type == ActionType.COLLECT:
                return act, f"Standing on uncaptured objective. Collecting to gain team points.", None

        # 2. Check teammate status & messages
        teammates = [a for a in state.agents.values() if a.team == self.team and a.id != self.agent_id and a.is_alive]
        teammate = teammates[0] if teammates else None

        # 3. Check for attack opportunities (finish off weakened enemies)
        attack_actions = [a for a in valid_actions if a.action_type == ActionType.ATTACK]
        if attack_actions:
            # Sort by enemy lowest health
            best_attack = min(
                attack_actions,
                key=lambda a: state.get_agent(a.target_id).hp if state.get_agent(a.target_id) else 999
            )
            target = state.get_agent(best_attack.target_id)
            return best_attack, f"Opportunity attack on hostile {target.id} (HP: {target.hp}) to relieve pressure.", None

        # 4. If teammate is threatened, move towards teammate or interpose
        if teammate and teammate.hp <= 50:
            tr, tc = teammate.position
            move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
            if move_actions:
                best_move = min(
                    move_actions,
                    key=lambda m: self._eval_distance(agent.position, m.direction, (tr, tc))
                )
                return best_move, f"Teammate {teammate.id} under threat ({teammate.hp} HP). Moving to provide defensive escort.", None

        # 5. Move towards closest uncaptured objective
        uncaptured_objs = [obj for obj in state.objectives if obj.captured_by != self.team]
        if uncaptured_objs:
            closest_obj = min(
                uncaptured_objs,
                key=lambda o: abs(agent.position[0]-o.position[0]) + abs(agent.position[1]-o.position[1])
            )
            move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
            if move_actions:
                best_move = min(
                    move_actions,
                    key=lambda m: self._eval_distance(agent.position, m.direction, closest_obj.position)
                )
                return best_move, f"Advancing toward {closest_obj.name} at {closest_obj.position} to establish team control.", None

        # Fallback: Defend
        defend_act = next((a for a in valid_actions if a.action_type == ActionType.DEFEND), None)
        if defend_act:
            return defend_act, "No urgent objectives in range. Holding defensive guard.", None

        return valid_actions[0], "Executing standard tactical maneuver.", None

    def _eval_distance(self, current_pos: Tuple[int, int], direction: Direction, target_pos: Tuple[int, int]) -> int:
        from backend.game.state import DIRECTION_OFFSETS
        dr, dc = DIRECTION_OFFSETS[direction]
        nr, nc = current_pos[0] + dr, current_pos[1] + dc
        return abs(nr - target_pos[0]) + abs(nc - target_pos[1])

    def generate_coordination_messages(self, state: GameState) -> List[Message]:
        msgs: List[Message] = []
        agent = state.get_agent(self.agent_id)
        if not agent or not agent.is_alive:
            return msgs

        # Broadcast objective claim
        for obj in state.objectives:
            if obj.captured_by != self.team:
                dist = abs(agent.position[0]-obj.position[0]) + abs(agent.position[1]-obj.position[1])
                if dist <= 2:
                    msgs.append(Message(
                        id=f"msg_{len(state.messages)+1}",
                        turn=state.turn,
                        sender_id=self.agent_id,
                        team=self.team,
                        recipient_id=f"Team {self.team.value}",
                        msg_type="OBJECTIVE_CONTEST",
                        content=f"Closing in on {obj.name} ({dist} steps away). Securing perimeter.",
                        location=obj.position
                    ))
                    break
        return msgs
