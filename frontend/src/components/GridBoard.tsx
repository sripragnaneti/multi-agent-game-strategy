import React from 'react';
import { GameState, AgentState } from '../types';
import { Shield, Target, Crosshair } from 'lucide-react';

interface GridBoardProps {
  state: GameState;
  onCellClick?: (r: number, c: number) => void;
}

export const GridBoard: React.FC<GridBoardProps> = ({ state, onCellClick }) => {
  const currentAgentId = state.turn_order[state.current_agent_index % state.turn_order.length];

  // Helper to get agent at position
  const getAgentAt = (r: number, c: number): AgentState | undefined => {
    return Object.values(state.agents).find(
      (a) => a.is_alive && a.position[0] === r && a.position[1] === c
    );
  };

  // Helper to get objective at position
  const getObjectiveAt = (r: number, c: number) => {
    return state.objectives.find((obj) => obj.position[0] === r && obj.position[1] === c);
  };

  const isObstacle = (r: number, c: number) => {
    return state.obstacles.some(([or, oc]) => or === r && oc === c);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>ARENA MAP: 7 × 7 TACTICAL GRID</span>
        <span>TURN ORDER: {state.turn_order.map(id => (
          <strong key={id} style={{ color: id.startsWith('A') ? 'var(--team-a)' : 'var(--team-b)', marginLeft: '6px' }}>
            {id === currentAgentId ? `[${id}]` : id}
          </strong>
        ))}</span>
      </div>

      <div className="arena-grid">
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 7 }).map((_, c) => {
            const agent = getAgentAt(r, c);
            const objective = getObjectiveAt(r, c);
            const obstacle = isObstacle(r, c);
            const isTurn = agent && agent.id === currentAgentId;

            let cellClass = 'arena-cell';
            if (obstacle) cellClass += ' cell-obstacle';
            if (objective) cellClass += ' cell-objective';

            return (
              <div
                key={`${r}-${c}`}
                className={cellClass}
                onClick={() => onCellClick?.(r, c)}
                title={`Cell (${r}, ${c})${objective ? ` - ${objective.name}` : ''}${obstacle ? ' - Obstacle' : ''}`}
              >
                {/* Coordinate label */}
                <span style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '8px', color: '#475569' }}>
                  {r},{c}
                </span>

                {/* Obstacle Render */}
                {obstacle && (
                  <div style={{ width: '60%', height: '60%', background: '#334155', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '60%', height: '4px', background: '#475569', borderRadius: '2px' }} />
                  </div>
                )}

                {/* Objective Node Render */}
                {objective && !agent && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Target size={20} color={objective.captured_by === 'A' ? 'var(--team-a)' : objective.captured_by === 'B' ? 'var(--team-b)' : 'var(--objective)'} />
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#fbbf24', marginTop: '2px' }}>
                      {objective.captured_by ? `TEAM ${objective.captured_by}` : `+${objective.points}`}
                    </span>
                  </div>
                )}

                {/* Agent Token Render */}
                {agent && (
                  <div
                    className={`agent-token ${agent.team === 'A' ? 'agent-team-a' : 'agent-team-b'} ${isTurn ? 'active-turn-ring' : ''}`}
                  >
                    <span>{agent.id}</span>
                    <div style={{ width: '80%', height: '4px', background: '#0f172a', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                      <div
                        style={{
                          width: `${agent.hp}%`,
                          height: '100%',
                          background: agent.hp > 50 ? '#10b981' : agent.hp > 25 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    {agent.is_defending && (
                      <div className="defense-badge" title="DEFENDING (50% incoming damage reduction)">
                        <Shield size={10} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--team-a)' }} />
          <span>Team A (Alpha)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--team-b)' }} />
          <span>Team B (Beta)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={14} color="var(--objective)" />
          <span>Objective (+Pts)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', background: '#334155', borderRadius: '2px' }} />
          <span>Obstacle</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fbbf24' }} />
          <span>Active Turn</span>
        </div>
      </div>
    </div>
  );
};
