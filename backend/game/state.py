# Game State Models & Definitions
from __future__ import annotations
from enum import Enum
from typing import List, Dict, Tuple, Optional, Any
from pydantic import BaseModel, Field
import copy

class Team(str, Enum):
    A = "A"
    B = "B"

class AgentRole(str, Enum):
    ATTACKER = "Attacker"
    DEFENDER = "Defender"

class ActionType(str, Enum):
    MOVE = "MOVE"
    ATTACK = "ATTACK"
    DEFEND = "DEFEND"
    COLLECT = "COLLECT"
    WAIT = "WAIT"

class Direction(str, Enum):
    UP = "UP"
    DOWN = "DOWN"
    LEFT = "LEFT"
    RIGHT = "RIGHT"

DIRECTION_OFFSETS: Dict[Direction, Tuple[int, int]] = {
    Direction.UP: (-1, 0),
    Direction.DOWN: (1, 0),
    Direction.LEFT: (0, -1),
    Direction.RIGHT: (0, 1),
}

class Action(BaseModel):
    action_type: ActionType
    direction: Optional[Direction] = None
    target_id: Optional[str] = None
    explanation: Optional[str] = ""

    def summary(self) -> str:
        if self.action_type == ActionType.MOVE:
            return f"MOVE {self.direction.value if self.direction else ''}"
        elif self.action_type == ActionType.ATTACK:
            return f"ATTACK {self.target_id}"
        elif self.action_type == ActionType.DEFEND:
            return "DEFEND"
        elif self.action_type == ActionType.COLLECT:
            return "COLLECT OBJECTIVE"
        return "WAIT"

class AgentState(BaseModel):
    id: str
    team: Team
    role: AgentRole
    position: Tuple[int, int]
    hp: int = 100
    max_hp: int = 100
    is_defending: bool = False
    is_alive: bool = True
    strategy: str = "Rule-based"
    damage_dealt: int = 0
    objectives_captured: int = 0
    eliminations: int = 0

class ObjectiveNode(BaseModel):
    id: str
    position: Tuple[int, int]
    name: str
    points: int = 15
    captured_by: Optional[Team] = None
    capture_turn: Optional[int] = None

class Message(BaseModel):
    id: str
    turn: int
    sender_id: str
    team: Team
    recipient_id: str
    msg_type: str
    content: str
    location: Optional[Tuple[int, int]] = None

class GameStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"

class GameEvent(BaseModel):
    id: str
    turn: int
    agent_id: str
    team: Team
    event_type: str
    description: str
    details: Dict[str, Any] = Field(default_factory=dict)

class GameState(BaseModel):
    grid_size: int = 7
    turn: int = 0
    max_turns: int = 60
    current_agent_index: int = 0
    status: GameStatus = GameStatus.NOT_STARTED
    winner: Optional[str] = None
    win_reason: Optional[str] = None

    scores: Dict[Team, int] = {Team.A: 0, Team.B: 0}
    agents: Dict[str, AgentState] = {}
    turn_order: List[str] = ["A1", "B1", "A2", "B2"]

    obstacles: List[Tuple[int, int]] = []
    objectives: List[ObjectiveNode] = []

    messages: List[Message] = []
    events: List[GameEvent] = []

    def clone(self) -> GameState:
        """Deep copy of the game state for safe adversarial search simulation."""
        return copy.deepcopy(self)

    @property
    def current_agent_id(self) -> str:
        if not self.turn_order:
            return ""
        return self.turn_order[self.current_agent_index % len(self.turn_order)]

    def get_agent(self, agent_id: str) -> Optional[AgentState]:
        return self.agents.get(agent_id)

    def is_cell_walkable(self, r: int, c: int) -> bool:
        if not (0 <= r < self.grid_size and 0 <= c < self.grid_size):
            return False
        if (r, c) in self.obstacles:
            return False
        for agent in self.agents.values():
            if agent.is_alive and agent.position == (r, c):
                return False
        return True

    def get_agent_at(self, r: int, c: int) -> Optional[AgentState]:
        for agent in self.agents.values():
            if agent.is_alive and agent.position == (r, c):
                return agent
        return None
