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

# HP thresholds governing combat vs. evasion behaviour
HP_CRITICAL   = 25   # Must flee / defend — do not engage
HP_LOW        = 50   # Disengage from prolonged fight and chase objectives instead
HP_SAFE       = 75   # Free to attack aggressively

class AttackerAgent(BaseAgent):
    """
    Minimax / Alpha-Beta Pruning Attacker.
    Prioritizes adversarial search, combat advantages, and objective capture.

    Combat posture (v2):
    - HP > HP_SAFE  : Fight aggressively (Alpha-Beta drives decision).
    - HP_LOW < HP <= HP_SAFE : Still fight, but prefer objectives if adjacent.
    - HP <= HP_LOW  : Disengage — flee toward the nearest uncaptured objective.
    - HP <= HP_CRITICAL AND enemy adjacent : Retreat move or DEFEND.
    """
    def __init__(self, agent_id: str, team: Team, use_pruning: bool = True, depth: int = 2):
        super().__init__(agent_id, team)
        self.searcher = AlphaBetaSearch(depth=depth) if use_pruning else MinimaxSearch(depth=depth)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _nearest_uncaptured_obj(self, state: GameState, agent):
        """Return the uncaptured objective closest to the agent, or None."""
        candidates = [o for o in state.objectives if o.captured_by != self.team]
        if not candidates:
            return None
        return min(
            candidates,
            key=lambda o: abs(agent.position[0] - o.position[0]) + abs(agent.position[1] - o.position[1])
        )

    def _move_toward(self, state: GameState, agent, target_pos) -> Optional[Action]:
        """Return the MOVE action that gets agent closest to target_pos, or None."""
        from backend.game.state import DIRECTION_OFFSETS
        valid_actions = GameRules.get_valid_actions(state, self.agent_id)
        move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
        if not move_actions:
            return None
        return min(
            move_actions,
            key=lambda m: (
                lambda dr, dc:
                    abs((agent.position[0] + dr) - target_pos[0]) +
                    abs((agent.position[1] + dc) - target_pos[1])
            )(*DIRECTION_OFFSETS[m.direction])
        )

    def _move_away_from(self, state: GameState, agent, threat_pos) -> Optional[Action]:
        """Return the MOVE action that maximises distance from threat_pos."""
        from backend.game.state import DIRECTION_OFFSETS
        valid_actions = GameRules.get_valid_actions(state, self.agent_id)
        move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
        if not move_actions:
            return None
        return max(
            move_actions,
            key=lambda m: (
                lambda dr, dc:
                    abs((agent.position[0] + dr) - threat_pos[0]) +
                    abs((agent.position[1] + dc) - threat_pos[1])
            )(*DIRECTION_OFFSETS[m.direction])
        )

    # ------------------------------------------------------------------
    # Core decision
    # ------------------------------------------------------------------
    def select_action(self, state: GameState) -> Tuple[Action, str, Optional[SearchMetrics]]:
        agent = state.get_agent(self.agent_id)
        if not agent or not agent.is_alive:
            return Action(action_type=ActionType.WAIT), "Agent is inactive.", None

        opponents_in_range = [
            o for o in state.agents.values()
            if o.team != self.team and o.is_alive and
            max(abs(agent.position[0] - o.position[0]), abs(agent.position[1] - o.position[1])) <= ATTACK_RANGE_CHEBYSHEV
        ]

        # ── PHASE 1: CRITICAL HP — must get out of danger ──────────────────
        if agent.hp <= HP_CRITICAL:
            if opponents_in_range:
                # Prefer retreating over standing still and dying
                retreat = self._move_away_from(state, agent, opponents_in_range[0].position)
                if retreat:
                    return retreat, (
                        f"CRITICAL ({agent.hp} HP) — retreating away from {opponents_in_range[0].id} "
                        f"to survive and recover position."
                    ), None
                # Can't move — defend as last resort
                return Action(action_type=ActionType.DEFEND), (
                    f"CRITICAL ({agent.hp} HP) with {opponents_in_range[0].id} adjacent. "
                    f"No escape route — holding defensive stance."
                ), None
            # No enemy adjacent but still critical — rush an objective
            nearest = self._nearest_uncaptured_obj(state, agent)
            if nearest:
                move = self._move_toward(state, agent, nearest.position)
                if move:
                    return move, (
                        f"CRITICAL HP ({agent.hp}) but no immediate threat. "
                        f"Racing toward {nearest.name} to score instead of fighting."
                    ), None

        # ── PHASE 2: Standing on an objective — grab it immediately ────────
        for obj in state.objectives:
            if obj.position == agent.position and obj.captured_by != self.team:
                return Action(action_type=ActionType.COLLECT), (
                    f"Standing on {obj.name}. Capturing for +{obj.points} pts."
                ), None

        # ── PHASE 3: LOW HP — disengage from combat, chase objectives ──────
        if agent.hp <= HP_LOW and opponents_in_range:
            nearest = self._nearest_uncaptured_obj(state, agent)
            if nearest:
                move = self._move_toward(state, agent, nearest.position)
                if move:
                    return move, (
                        f"LOW HP ({agent.hp}) — disengaging from {opponents_in_range[0].id} "
                        f"and heading for {nearest.name} at {nearest.position} to gain score "
                        f"instead of risking elimination in a prolonged fight."
                    ), None
            # No objective reachable — retreat from the fight
            retreat = self._move_away_from(state, agent, opponents_in_range[0].position)
            if retreat:
                return retreat, (
                    f"LOW HP ({agent.hp}) — no objectives available; "
                    f"retreating from {opponents_in_range[0].id} to avoid elimination."
                ), None

        # ── PHASE 4: SAFE HP — Alpha-Beta drives aggressive play ───────────
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

        opponents_adjacent = [
            o for o in state.agents.values()
            if o.team != self.team and o.is_alive and
            max(abs(agent.position[0]-o.position[0]), abs(agent.position[1]-o.position[1])) <= ATTACK_RANGE_CHEBYSHEV
        ]

        # ── PHASE 1: CRITICAL HP — retreat or collect, never fight ────────
        if agent.hp <= HP_CRITICAL:
            if opponents_adjacent:
                # Try to flee away from nearest enemy
                move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
                if move_actions:
                    from backend.game.state import DIRECTION_OFFSETS
                    threat = opponents_adjacent[0]
                    retreat = max(
                        move_actions,
                        key=lambda m: (
                            lambda dr, dc:
                                abs((agent.position[0]+dr) - threat.position[0]) +
                                abs((agent.position[1]+dc) - threat.position[1])
                        )(*DIRECTION_OFFSETS[m.direction])
                    )
                    return retreat, (
                        f"CRITICAL ({agent.hp} HP) — fleeing from {threat.id} to survive."
                    ), None
            # No adjacent enemy — grab nearest diamond
            uncaptured = [o for o in state.objectives if o.captured_by != self.team]
            if uncaptured:
                closest = min(uncaptured, key=lambda o: abs(agent.position[0]-o.position[0])+abs(agent.position[1]-o.position[1]))
                move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
                if move_actions:
                    best = min(move_actions, key=lambda m: self._eval_distance(agent.position, m.direction, closest.position))
                    return best, f"CRITICAL HP ({agent.hp}) — sprinting for {closest.name} to score.", None

        # ── PHASE 2: Always collect if standing on objective ──────────────
        for act in valid_actions:
            if act.action_type == ActionType.COLLECT:
                return act, "Standing on uncaptured objective. Collecting to gain team points.", None

        # ── PHASE 3: LOW HP + enemy adjacent — disengage, go for diamonds ─
        if agent.hp <= HP_LOW and opponents_adjacent:
            uncaptured = [o for o in state.objectives if o.captured_by != self.team]
            if uncaptured:
                closest = min(uncaptured, key=lambda o: abs(agent.position[0]-o.position[0])+abs(agent.position[1]-o.position[1]))
                move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
                if move_actions:
                    best = min(move_actions, key=lambda m: self._eval_distance(agent.position, m.direction, closest.position))
                    return best, (
                        f"LOW HP ({agent.hp}) — disengaging from {opponents_adjacent[0].id}, "
                        f"heading for {closest.name} to score instead of dying in a fight."
                    ), None

        # ── PHASE 4: Healthy — normal defender logic ───────────────────────
        # 4a. Attack if enemy in range
        attack_actions = [a for a in valid_actions if a.action_type == ActionType.ATTACK]
        if attack_actions:
            best_attack = min(
                attack_actions,
                key=lambda a: state.get_agent(a.target_id).hp if state.get_agent(a.target_id) else 999
            )
            target = state.get_agent(best_attack.target_id)
            return best_attack, f"Opportunity attack on hostile {target.id} (HP: {target.hp}) to relieve pressure.", None

        # 4b. Move to support threatened teammate
        teammates = [a for a in state.agents.values() if a.team == self.team and a.id != self.agent_id and a.is_alive]
        teammate = teammates[0] if teammates else None
        if teammate and teammate.hp <= 50:
            tr, tc = teammate.position
            move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
            if move_actions:
                best_move = min(move_actions, key=lambda m: self._eval_distance(agent.position, m.direction, (tr, tc)))
                return best_move, f"Teammate {teammate.id} under threat ({teammate.hp} HP). Moving to provide defensive escort.", None

        # 4c. Move towards closest uncaptured objective
        uncaptured_objs = [obj for obj in state.objectives if obj.captured_by != self.team]
        if uncaptured_objs:
            closest_obj = min(uncaptured_objs, key=lambda o: abs(agent.position[0]-o.position[0]) + abs(agent.position[1]-o.position[1]))
            move_actions = [a for a in valid_actions if a.action_type == ActionType.MOVE]
            if move_actions:
                best_move = min(move_actions, key=lambda m: self._eval_distance(agent.position, m.direction, closest_obj.position))
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
