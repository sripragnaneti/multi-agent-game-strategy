# Comprehensive Automated Test Suite
import pytest
from backend.game.state import GameState, Team, Action, ActionType, Direction, AgentRole
from backend.game.rules import GameRules, BASE_ATTACK_DAMAGE, DEFENDED_DAMAGE
from backend.game.environment import GameEnvironment
from backend.algorithms.search import MinimaxSearch, AlphaBetaSearch
from backend.services.simulation_service import SimulationService

def test_initialization():
    env = GameEnvironment()
    state = env.state
    assert len(state.agents) == 4
    assert "A1" in state.agents and "B1" in state.agents
    assert state.agents["A1"].team == Team.A
    assert state.agents["B1"].team == Team.B
    assert len(state.objectives) == 3

def test_valid_movement():
    env = GameEnvironment()
    state = env.state
    # A1 is at (1, 0)
    act = Action(action_type=ActionType.MOVE, direction=Direction.DOWN)
    success, msg = GameRules.apply_action(state, "A1", act)
    assert success is True
    assert state.agents["A1"].position == (2, 0)

def test_obstacle_rejection():
    env = GameEnvironment()
    state = env.state
    state.agents["A1"].position = (2, 1)
    # (2, 2) has an obstacle
    act = Action(action_type=ActionType.MOVE, direction=Direction.RIGHT)
    success, msg = GameRules.apply_action(state, "A1", act)
    assert success is False
    assert "blocked by an obstacle" in msg
    assert state.agents["A1"].position == (2, 1)

def test_out_of_bounds_rejection():
    env = GameEnvironment()
    state = env.state
    state.agents["A1"].position = (0, 0)
    act = Action(action_type=ActionType.MOVE, direction=Direction.UP)
    success, msg = GameRules.apply_action(state, "A1", act)
    assert success is False
    assert "outside the grid" in msg

def test_attack_and_damage():
    env = GameEnvironment()
    state = env.state
    state.agents["A1"].position = (3, 3)
    state.agents["B1"].position = (3, 4) # adjacent
    initial_hp = state.agents["B1"].hp
    act = Action(action_type=ActionType.ATTACK, target_id="B1")
    success, msg = GameRules.apply_action(state, "A1", act)
    assert success is True
    assert state.agents["B1"].hp == initial_hp - BASE_ATTACK_DAMAGE

def test_defend_stance_reduces_damage():
    env = GameEnvironment()
    state = env.state
    state.agents["A1"].position = (3, 3)
    state.agents["B1"].position = (3, 4)
    # B1 enters DEFEND stance
    defend_act = Action(action_type=ActionType.DEFEND)
    GameRules.apply_action(state, "B1", defend_act)
    assert state.agents["B1"].is_defending is True

    # A1 attacks B1
    attack_act = Action(action_type=ActionType.ATTACK, target_id="B1")
    GameRules.apply_action(state, "A1", attack_act)
    assert state.agents["B1"].hp == 100 - DEFENDED_DAMAGE

def test_objective_capture():
    env = GameEnvironment()
    state = env.state
    state.agents["A1"].position = (3, 3) # Central objective
    act = Action(action_type=ActionType.COLLECT)
    success, msg = GameRules.apply_action(state, "A1", act)
    assert success is True
    assert state.objectives[0].captured_by == Team.A
    assert state.scores[Team.A] == 20

def test_minimax_and_alphabeta_equivalence():
    """Verify that Alpha-Beta pruning returns mathematically identical value to pure Minimax while pruning branches."""
    env = GameEnvironment()
    state = env.state
    mm = MinimaxSearch(depth=2)
    ab = AlphaBetaSearch(depth=2)

    act_mm, met_mm = mm.search(state, "A1")
    act_ab, met_ab = ab.search(state, "A1")

    assert act_mm is not None and act_ab is not None
    assert round(met_mm.best_score, 1) == round(met_ab.best_score, 1)
    assert met_ab.nodes_visited <= met_mm.nodes_visited

def test_simulation_service_step_and_scenarios():
    service = SimulationService()
    # Step standard match
    res = service.step()
    assert res["success"] is True
    assert "state" in res

    # Test load scenario
    service.reset_match("teammate_under_threat")
    assert service.env.state.agents["A1"].hp == 25
    step_res = service.step()
    assert step_res["success"] is True
