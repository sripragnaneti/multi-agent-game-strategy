# Reward Function and Evaluation Metrics
from typing import Dict
from backend.game.state import GameState, Team, AgentState

# Reward Weights
W_SCORE = 2.0
W_KILL = 50.0
W_DAMAGE_DEALT = 1.0
W_HEALTH_PRESERVED = 0.5
W_OBJECTIVE_CONTROL = 20.0       # Raised: controlling a diamond matters more
W_PROXIMITY_TO_OBJECTIVE = 4.0   # Raised: always reward racing toward diamonds
W_APPROACH_ENEMY = 0.6           # Lowered: don't magnetically pull bots into fights
W_OSCILLATION_PENALTY = 4.0      # Penalise re-visiting a cell visited 2+ turns ago
W_LOW_HP_RETREAT = 3.0           # Extra bonus for increasing distance while HP is low

def evaluate_team_utility(state: GameState, team: Team) -> float:
    """
    Computes utility from the perspective of 'team'.
    Utility > 0 indicates an advantageous game state for 'team'.
    Utility < 0 indicates an advantageous state for the opposing team.

    Fixes over v1:
    - Enemies are always approached (W_APPROACH_ENEMY) so attackers march
      forward instead of shuffling when objectives are equidistant.
    - Agents are penalised for landing on a cell they already stood on
      in the last 4 turns (oscillation / thrashing detection).
    - Objective proximity reward is applied unconditionally (not only
      when closer than the opponent) to break early-game symmetry ties.
    """
    opposing_team = Team.B if team == Team.A else Team.A

    # 1. Score differential
    score_diff = state.scores[team] - state.scores[opposing_team]
    utility = score_diff * W_SCORE

    # 2. Agent survival & health differential
    team_agents = [a for a in state.agents.values() if a.team == team]
    opp_agents  = [a for a in state.agents.values() if a.team == opposing_team]

    team_alive = sum(1 for a in team_agents if a.is_alive)
    opp_alive  = sum(1 for a in opp_agents  if a.is_alive)
    utility += (team_alive - opp_alive) * W_KILL

    team_hp = sum(a.hp for a in team_agents if a.is_alive)
    opp_hp  = sum(a.hp for a in opp_agents  if a.is_alive)
    utility += (team_hp - opp_hp) * W_HEALTH_PRESERVED

    # 3. Objectives control + unconditional proximity reward
    for obj in state.objectives:
        if obj.captured_by == team:
            utility += W_OBJECTIVE_CONTROL
        elif obj.captured_by == opposing_team:
            utility -= W_OBJECTIVE_CONTROL
        else:
            # Always reward being close — breaks early symmetry ties
            min_team_dist = min(
                [abs(a.position[0] - obj.position[0]) + abs(a.position[1] - obj.position[1])
                 for a in team_agents if a.is_alive] or [999]
            )
            min_opp_dist = min(
                [abs(o.position[0] - obj.position[0]) + abs(o.position[1] - obj.position[1])
                 for o in opp_agents if o.is_alive] or [999]
            )
            # Proximity bonus — bigger when closer AND closer than opponent
            proximity_bonus = W_PROXIMITY_TO_OBJECTIVE * (10 - min_team_dist)
            if min_team_dist < min_opp_dist:
                proximity_bonus *= 1.5   # extra incentive for leading the race
            utility += proximity_bonus

    # 4. Enemy-approach reward — nudge attackers toward the enemy ONLY when healthy.
    #    When HP is low the reward flips to encourage retreat (increasing distance = good).
    MAX_BOARD = 12  # max Manhattan distance on a 7x7 grid
    for a in team_agents:
        if not a.is_alive:
            continue
        if opp_agents:
            min_enemy_dist = min(
                abs(a.position[0] - o.position[0]) + abs(a.position[1] - o.position[1])
                for o in opp_agents if o.is_alive
            ) if any(o.is_alive for o in opp_agents) else MAX_BOARD

            if a.hp > 50:  # Healthy — reward closing in
                utility += W_APPROACH_ENEMY * (MAX_BOARD - min_enemy_dist)
            else:          # Low HP — reward increasing distance (retreat incentive)
                utility += W_LOW_HP_RETREAT * min_enemy_dist

    # 5. Oscillation penalty — penalise landing on a recently-visited cell
    for a in team_agents:
        if not a.is_alive:
            continue
        history = getattr(a, 'position_history', [])
        # Count how many of the last 4 recorded positions match the current one
        repeat_count = sum(1 for p in history[-4:] if p == a.position)
        if repeat_count >= 1:
            utility -= W_OSCILLATION_PENALTY * repeat_count

    # 6. Terminal reward bonus
    if state.winner == team.value:
        utility += 1000.0
    elif state.winner == opposing_team.value:
        utility -= 1000.0

    return utility
