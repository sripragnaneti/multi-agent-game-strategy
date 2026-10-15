# Reward Function and Evaluation Metrics
from typing import Dict
from backend.game.state import GameState, Team, AgentState

# Reward Weights
W_SCORE = 2.0
W_KILL = 50.0
W_DAMAGE_DEALT = 1.0
W_HEALTH_PRESERVED = 0.5
W_OBJECTIVE_CONTROL = 15.0
W_PROXIMITY_TO_OBJECTIVE = 2.0
W_DEFENSIVE_STANCE_WHEN_THREATENED = 10.0

def evaluate_team_utility(state: GameState, team: Team) -> float:
    """
    Computes utility from the perspective of 'team'.
    Utility > 0 indicates an advantageous game state for 'team'.
    Utility < 0 indicates an advantageous state for the opposing team.
    """
    opposing_team = Team.B if team == Team.A else Team.A

    # 1. Score differential
    score_diff = state.scores[team] - state.scores[opposing_team]
    utility = score_diff * W_SCORE

    # 2. Agent survival & health differential
    team_agents = [a for a in state.agents.values() if a.team == team]
    opp_agents = [a for a in state.agents.values() if a.team == opposing_team]

    team_alive = sum(1 for a in team_agents if a.is_alive)
    opp_alive = sum(1 for a in opp_agents if a.is_alive)
    utility += (team_alive - opp_alive) * W_KILL

    team_hp = sum(a.hp for a in team_agents if a.is_alive)
    opp_hp = sum(a.hp for a in opp_agents if a.is_alive)
    utility += (team_hp - opp_hp) * W_HEALTH_PRESERVED

    # 3. Objectives control
    for obj in state.objectives:
        if obj.captured_by == team:
            utility += W_OBJECTIVE_CONTROL
        elif obj.captured_by == opposing_team:
            utility -= W_OBJECTIVE_CONTROL
        else:
            # Proximity to uncaptured objective
            min_team_dist = min([abs(a.position[0]-obj.position[0]) + abs(a.position[1]-obj.position[1]) for a in team_agents if a.is_alive] or [999])
            min_opp_dist = min([abs(o.position[0]-obj.position[0]) + abs(o.position[1]-obj.position[1]) for o in opp_agents if o.is_alive] or [999])
            if min_team_dist < min_opp_dist:
                utility += W_PROXIMITY_TO_OBJECTIVE * (10 - min_team_dist)

    # 4. Terminal reward bonus
    if state.winner == team.value:
        utility += 1000.0
    elif state.winner == opposing_team.value:
        utility -= 1000.0

    return utility
