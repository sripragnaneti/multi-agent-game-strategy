# Game Rules & Mechanics Engine
from typing import List, Tuple, Optional
from backend.game.state import (
    GameState, AgentState, Action, ActionType, Direction,
    DIRECTION_OFFSETS, Team, GameStatus, GameEvent
)

BASE_ATTACK_DAMAGE = 25
DEFENDED_DAMAGE = 12
ATTACK_RANGE_CHEBYSHEV = 1  # 8 surrounding cells
OBJECTIVE_CAPTURE_SCORE = 15
OBJECTIVE_CONTROL_ROUND_SCORE = 5
MAX_SCORE_TO_WIN = 100

class GameRules:

    @staticmethod
    def get_valid_actions(state: GameState, agent_id: str) -> List[Action]:
        agent = state.get_agent(agent_id)
        if not agent or not agent.is_alive:
            return []

        actions: List[Action] = []
        r, c = agent.position

        # 1. MOVE Actions
        for direction, (dr, dc) in DIRECTION_OFFSETS.items():
            nr, nc = r + dr, c + dc
            if state.is_cell_walkable(nr, nc):
                actions.append(Action(action_type=ActionType.MOVE, direction=direction))

        # 2. ATTACK Actions (Opponents within Chebyshev range 1)
        for other_id, other_agent in state.agents.items():
            if other_agent.is_alive and other_agent.team != agent.team:
                or_, oc_ = other_agent.position
                if max(abs(r - or_), abs(c - oc_)) <= ATTACK_RANGE_CHEBYSHEV:
                    actions.append(Action(action_type=ActionType.ATTACK, target_id=other_id))

        # 3. DEFEND Action (always available)
        actions.append(Action(action_type=ActionType.DEFEND))

        # 4. COLLECT Action (if standing on an uncaptured objective or objective not yet captured by own team)
        for obj in state.objectives:
            if obj.position == (r, c) and obj.captured_by != agent.team:
                actions.append(Action(action_type=ActionType.COLLECT))

        # 5. WAIT Action (always an option)
        actions.append(Action(action_type=ActionType.WAIT))

        return actions

    @staticmethod
    def apply_action(state: GameState, agent_id: str, action: Action) -> Tuple[bool, str]:
        agent = state.get_agent(agent_id)
        if not agent or not agent.is_alive:
            return False, f"Agent {agent_id} is inactive or not found."

        # Reset defend status at the start of their active turn
        agent.is_defending = False

        if action.action_type == ActionType.MOVE:
            if not action.direction:
                return False, "Move direction missing."
            dr, dc = DIRECTION_OFFSETS[action.direction]
            nr, nc = agent.position[0] + dr, agent.position[1] + dc

            if not (0 <= nr < state.grid_size and 0 <= nc < state.grid_size):
                return False, f"Cell ({nr}, {nc}) is outside the grid."
            if (nr, nc) in state.obstacles:
                return False, f"Cell ({nr}, {nc}) is blocked by an obstacle."
            occupant = state.get_agent_at(nr, nc)
            if occupant and occupant.id != agent.id:
                return False, f"Cell ({nr}, {nc}) is occupied by {occupant.id}."

            old_pos = agent.position
            agent.position = (nr, nc)
            state.events.append(GameEvent(
                id=f"ev_{len(state.events)+1}",
                turn=state.turn,
                agent_id=agent.id,
                team=agent.team,
                event_type="MOVE",
                description=f"{agent.id} moved {action.direction.value} from {old_pos} to ({nr}, {nc}).",
                details={"from": old_pos, "to": (nr, nc)}
            ))
            return True, f"{agent.id} moved {action.direction.value} to ({nr}, {nc})."

        elif action.action_type == ActionType.ATTACK:
            target = state.get_agent(action.target_id or "")
            if not target or not target.is_alive:
                return False, f"Target {action.target_id} is invalid or already eliminated."
            if target.team == agent.team:
                return False, "Cannot attack a teammate."

            ar, ac = agent.position
            tr, tc = target.position
            if max(abs(ar - tr), abs(ac - tc)) > ATTACK_RANGE_CHEBYSHEV:
                return False, f"Target {target.id} is out of attack range."

            # Calculate damage
            damage = DEFENDED_DAMAGE if target.is_defending else BASE_ATTACK_DAMAGE
            target.hp = max(0, target.hp - damage)
            agent.damage_dealt += damage

            desc = f"{agent.id} attacked {target.id} for {damage} damage (Target HP: {target.hp}/100)."
            if target.is_defending:
                desc += " [Damage reduced by 50% due to DEFEND stance]"

            if target.hp == 0:
                target.is_alive = False
                agent.eliminations += 1
                state.scores[agent.team] += 25
                desc += f" -- {target.id} was KNOCKED OUT! (+25 pts for Team {agent.team.value})"

            state.events.append(GameEvent(
                id=f"ev_{len(state.events)+1}",
                turn=state.turn,
                agent_id=agent.id,
                team=agent.team,
                event_type="ATTACK",
                description=desc,
                details={"target": target.id, "damage": damage, "target_hp": target.hp, "knockout": not target.is_alive}
            ))
            return True, desc

        elif action.action_type == ActionType.DEFEND:
            agent.is_defending = True
            desc = f"{agent.id} assumed a DEFENSIVE STANCE (50% damage reduction until next turn)."
            state.events.append(GameEvent(
                id=f"ev_{len(state.events)+1}",
                turn=state.turn,
                agent_id=agent.id,
                team=agent.team,
                event_type="DEFEND",
                description=desc
            ))
            return True, desc

        elif action.action_type == ActionType.COLLECT:
            captured = False
            for obj in state.objectives:
                if obj.position == agent.position:
                    old_owner = obj.captured_by
                    obj.captured_by = agent.team
                    obj.capture_turn = state.turn
                    state.scores[agent.team] += obj.points
                    agent.objectives_captured += 1
                    captured = True
                    desc = f"{agent.id} captured objective '{obj.name}' at {obj.position} (+{obj.points} pts for Team {agent.team.value})."
                    state.events.append(GameEvent(
                        id=f"ev_{len(state.events)+1}",
                        turn=state.turn,
                        agent_id=agent.id,
                        team=agent.team,
                        event_type="COLLECT",
                        description=desc,
                        details={"objective_id": obj.id, "points": obj.points, "previous_owner": old_owner}
                    ))
                    return True, desc
            return False, f"No objective to collect at {agent.position}."

        elif action.action_type == ActionType.WAIT:
            desc = f"{agent.id} waited to hold strategic position."
            state.events.append(GameEvent(
                id=f"ev_{len(state.events)+1}",
                turn=state.turn,
                agent_id=agent.id,
                team=agent.team,
                event_type="WAIT",
                description=desc
            ))
            return True, desc

        return False, f"Unknown action: {action.action_type}"

    @staticmethod
    def check_terminal_condition(state: GameState) -> Tuple[bool, Optional[str], Optional[str]]:
        """Returns (is_terminal, winner_team, reason)."""
        # 1. Elimination Check
        team_a_alive = any(a.is_alive for a in state.agents.values() if a.team == Team.A)
        team_b_alive = any(a.is_alive for a in state.agents.values() if a.team == Team.B)

        if not team_a_alive and not team_b_alive:
            return True, "DRAW", "Both teams were eliminated simultaneously."
        if not team_a_alive:
            return True, "B", "Team B eliminated all Team A agents."
        if not team_b_alive:
            return True, "A", "Team A eliminated all Team B agents."

        # 2. Score Threshold Check
        if state.scores[Team.A] >= MAX_SCORE_TO_WIN and state.scores[Team.A] > state.scores[Team.B]:
            return True, "A", f"Team A reached score target ({state.scores[Team.A]} pts)."
        if state.scores[Team.B] >= MAX_SCORE_TO_WIN and state.scores[Team.B] > state.scores[Team.A]:
            return True, "B", f"Team B reached score target ({state.scores[Team.B]} pts)."

        # 3. Max Turn Limit Check
        if state.turn >= state.max_turns:
            score_a = state.scores[Team.A]
            score_b = state.scores[Team.B]
            if score_a > score_b:
                return True, "A", f"Turn limit reached ({state.max_turns}). Team A won on points ({score_a} vs {score_b})."
            elif score_b > score_a:
                return True, "B", f"Turn limit reached ({state.max_turns}). Team B won on points ({score_b} vs {score_a})."
            else:
                # Tie-breaker: Total remaining HP
                hp_a = sum(a.hp for a in state.agents.values() if a.team == Team.A)
                hp_b = sum(a.hp for a in state.agents.values() if a.team == Team.B)
                if hp_a > hp_b:
                    return True, "A", f"Turn limit tie broken by total remaining HP (Team A: {hp_a} HP vs Team B: {hp_b} HP)."
                elif hp_b > hp_a:
                    return True, "B", f"Turn limit tie broken by total remaining HP (Team B: {hp_b} HP vs Team A: {hp_a} HP)."
                else:
                    return True, "DRAW", f"Turn limit reached with exact tie in points ({score_a}) and HP ({hp_a})."

        return False, None, None
