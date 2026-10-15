export type Team = 'A' | 'B';
export type AgentRole = 'Attacker' | 'Defender';
export type ActionType = 'MOVE' | 'ATTACK' | 'DEFEND' | 'COLLECT' | 'WAIT';

export interface AgentState {
  id: string;
  team: Team;
  role: AgentRole;
  position: [number, number];
  hp: number;
  max_hp: number;
  is_defending: boolean;
  is_alive: boolean;
  strategy: string;
  damage_dealt: number;
  objectives_captured: number;
  eliminations: number;
}

export interface ObjectiveNode {
  id: string;
  position: [number, number];
  name: string;
  points: number;
  captured_by: Team | null;
  capture_turn: number | null;
}

export interface Message {
  id: string;
  turn: number;
  sender_id: string;
  team: Team;
  recipient_id: string;
  msg_type: string;
  content: string;
  location?: [number, number];
}

export interface GameEvent {
  id: string;
  turn: number;
  agent_id: string;
  team: Team;
  event_type: string;
  description: string;
  details?: Record<string, any>;
}

export interface GameState {
  grid_size: number;
  turn: number;
  max_turns: number;
  current_agent_index: number;
  status: 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  winner: string | null;
  win_reason: string | null;
  scores: Record<Team, number>;
  agents: Record<string, AgentState>;
  turn_order: string[];
  obstacles: [number, number][];
  objectives: ObjectiveNode[];
  messages: Message[];
  events: GameEvent[];
}

export interface SearchMetrics {
  algorithm: string;
  depth: number;
  nodes_visited: number;
  leaf_nodes_evaluated: number;
  branches_pruned: number;
  execution_time_ms: number;
  best_action: string;
  best_score: number;
  search_tree?: any;
}

export interface LatestDecision {
  agent_id: string;
  turn: number;
  action: string;
  reason: string;
  execution_result: string;
  metrics?: SearchMetrics;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
}
