# Game Environment & Scenarios
from typing import List, Tuple, Optional, Dict
from backend.game.state import (
    GameState, AgentState, Team, AgentRole, ObjectiveNode, GameStatus, Action
)
from backend.game.rules import GameRules

class GameEnvironment:
    def __init__(self, grid_size: int = 7):
        self.grid_size = grid_size
        self.state = self.create_standard_state()

    def create_standard_state(self) -> GameState:
        """Scenario 1: Standard match with 3 objectives and symmetrical obstacles."""
        state = GameState(grid_size=self.grid_size, status=GameStatus.NOT_STARTED)

        # Obstacles (Symmetrical cover)
        state.obstacles = [
            (2, 2), (2, 4),
            (4, 2), (4, 4)
        ]

        # Objectives
        state.objectives = [
            ObjectiveNode(id="obj_center", position=(3, 3), name="Primary Nexus", points=20),
            ObjectiveNode(id="obj_north", position=(1, 3), name="North Relay", points=15),
            ObjectiveNode(id="obj_south", position=(5, 3), name="South Relay", points=15),
        ]

        # Agents
        # Team A (Left side: columns 0 and 1)
        state.agents["A1"] = AgentState(
            id="A1", team=Team.A, role=AgentRole.ATTACKER,
            position=(1, 0), strategy="Alpha-Beta Pruning"
        )
        state.agents["A2"] = AgentState(
            id="A2", team=Team.A, role=AgentRole.DEFENDER,
            position=(5, 0), strategy="Cooperative Tactical"
        )

        # Team B (Right side: columns 5 and 6)
        state.agents["B1"] = AgentState(
            id="B1", team=Team.B, role=AgentRole.ATTACKER,
            position=(1, 6), strategy="Alpha-Beta Pruning"
        )
        state.agents["B2"] = AgentState(
            id="B2", team=Team.B, role=AgentRole.DEFENDER,
            position=(5, 6), strategy="Dynamic Flanker"
        )

        state.turn_order = ["A1", "B1", "A2", "B2"]
        return state

    def load_scenario(self, scenario_id: str) -> GameState:
        """Load one of the 7 predefined evaluation scenarios."""
        state = self.create_standard_state()

        if scenario_id == "opponent_in_range":
            # Scenario 2: Opponent within attack range (Melee clash A1 vs B1)
            state.agents["A1"].position = (3, 2)
            state.agents["B1"].position = (3, 3) # Adjacent
            state.turn_order = ["A1", "B1", "A2", "B2"]
            state.current_agent_index = 0

        elif scenario_id == "teammate_under_threat":
            # Scenario 3: A1 low health, cornered by B1; A2 in range to assist
            state.agents["A1"].position = (1, 1)
            state.agents["A1"].hp = 25
            state.agents["B1"].position = (1, 2)
            state.agents["A2"].position = (2, 1)
            state.turn_order = ["A2", "B1", "A1", "B2"] # A2 acts first to defend/coordinate
            state.current_agent_index = 0

        elif scenario_id == "contested_objective":
            # Scenario 4: Both teams adjacent to central objective
            state.agents["A1"].position = (3, 2)
            state.agents["B1"].position = (3, 4)
            state.objectives[0].position = (3, 3)
            state.turn_order = ["A1", "B1", "A2", "B2"]

        elif scenario_id == "obstacle_blocking":
            # Scenario 5: Dense obstacle barrier funneling agents through a single chokepoint
            state.obstacles = [
                (1, 3), (2, 3), (4, 3), (5, 3) # Only (3, 3) is open chokepoint
            ]
            state.agents["A1"].position = (3, 1)
            state.agents["B1"].position = (3, 5)
            state.objectives = [ObjectiveNode(id="obj_choke", position=(3, 3), name="Chokepoint Core", points=25)]

        elif scenario_id == "low_health_defense":
            # Scenario 6: A1 has 15 HP, B1 adjacent. A1 must choose DEFEND or evasive move
            state.agents["A1"].position = (2, 2)
            state.agents["A1"].hp = 15
            state.agents["B1"].position = (2, 3)
            state.turn_order = ["A1", "B1", "A2", "B2"]
            state.current_agent_index = 0

        elif scenario_id == "match_ending":
            # Scenario 7: A has 90 points, B has 75. Capturing objective or knocking out enemy ends match
            state.scores[Team.A] = 90
            state.scores[Team.B] = 75
            state.agents["A1"].position = (3, 2)
            state.objectives[0].position = (3, 3)
            state.turn_order = ["A1", "B1", "A2", "B2"]
            state.current_agent_index = 0

        self.state = state
        return self.state

    def step(self, agent_id: str, action: Action) -> Tuple[bool, str, GameState]:
        """Apply an agent action, check termination, and advance turn."""
        if self.state.status == GameStatus.COMPLETED:
            return False, "Game is already completed.", self.state

        success, msg = GameRules.apply_action(self.state, agent_id, action)
        if not success:
            return False, msg, self.state

        # Check win/draw conditions
        is_term, winner, reason = GameRules.check_terminal_condition(self.state)
        if is_term:
            self.state.status = GameStatus.COMPLETED
            self.state.winner = winner
            self.state.win_reason = reason
            return True, f"Match Ended: Winner {winner}! Reason: {reason}", self.state

        # Advance turn to next alive agent
        self._advance_turn()
        return True, msg, self.state

    def _advance_turn(self):
        self.state.turn += 1
        num_agents = len(self.state.turn_order)

        # Loop until next alive agent found or all dead
        for _ in range(num_agents):
            self.state.current_agent_index = (self.state.current_agent_index + 1) % num_agents
            next_agent = self.state.get_agent(self.state.current_agent_id)
            if next_agent and next_agent.is_alive:
                break

        # Check terminal again (in case all agents eliminated)
        is_term, winner, reason = GameRules.check_terminal_condition(self.state)
        if is_term:
            self.state.status = GameStatus.COMPLETED
            self.state.winner = winner
            self.state.win_reason = reason
