import React from 'react';
import { GameState, AgentState } from '../types';
import { Shield, Gem } from 'lucide-react';
import { AGENT_NAMES } from '../agentNames';

interface GridBoardProps {
  state: GameState;
  onCellClick?: (r: number, c: number) => void;
}

export const GridBoard: React.FC<GridBoardProps> = ({ state, onCellClick }) => {
  const currentAgentId = state.turn_order[state.current_agent_index % state.turn_order.length];

  const getAgentAt = (r: number, c: number): AgentState | undefined =>
    Object.values(state.agents).find((a) => a.is_alive && a.position[0] === r && a.position[1] === c);

  const getObjectiveAt = (r: number, c: number) =>
    state.objectives.find((obj) => obj.position[0] === r && obj.position[1] === c);

  const isObstacle = (r: number, c: number) =>
    state.obstacles.some(([or, oc]) => or === r && oc === c);

  const turnProgress = Math.round((state.turn / state.max_turns) * 100);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          7 × 7 Tactical Grid
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Turn order:</span>
          {state.turn_order.map((id) => (
            <span
              key={id}
              style={{
                color: id === currentAgentId
                  ? (id.startsWith('A') ? 'var(--team-a-light)' : 'var(--team-b-light)')
                  : 'var(--text-dim)',
                fontWeight: id === currentAgentId ? 700 : 400,
                fontFamily: id === currentAgentId ? "'Cinzel', serif" : 'inherit',
              }}
            >
              {AGENT_NAMES[id] ?? id}
            </span>
          ))}
        </div>
      </div>

      {/* Turn progress bar */}
      <div style={{ background: '#0a0b0b', borderRadius: 4, height: 3, overflow: 'hidden' }}>
        <div style={{ width: `${turnProgress}%`, height: '100%', background: 'linear-gradient(90deg, #b45309, #f59e0b)', transition: 'width 0.4s ease', borderRadius: 4 }} />
      </div>

      {/* Grid */}
      <div className="arena-grid">
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 7 }).map((_, c) => {
            const agent     = getAgentAt(r, c);
            const objective = getObjectiveAt(r, c);
            const obstacle  = isObstacle(r, c);
            const isTurn    = agent?.id === currentAgentId;

            let cellClass = 'arena-cell';
            if (obstacle)  cellClass += ' cell-obstacle';
            if (objective) cellClass += ' cell-objective';

            return (
              <div
                key={`${r}-${c}`}
                className={cellClass}
                onClick={() => onCellClick?.(r, c)}
                title={
                  agent     ? `${AGENT_NAMES[agent.id] ?? agent.id} (HP ${agent.hp})` :
                  objective ? objective.name :
                  obstacle  ? 'Obstacle' :
                  `(${r},${c})`
                }
              >
                {/* Coord micro-label */}
                <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 7, color: '#2e3232', userSelect: 'none' }}>
                  {r},{c}
                </span>

                {/* Obstacle block */}
                {obstacle && (
                  <div style={{ width: '55%', height: '55%', background: '#1e2222', borderRadius: 3, border: '1px solid #2a2e2e' }} />
                )}

                {/* Objective gem */}
                {objective && !agent && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Gem
                      size={18}
                      color={
                        objective.captured_by === 'A' ? 'var(--team-a-light)' :
                        objective.captured_by === 'B' ? 'var(--team-b-light)' :
                        'var(--objective)'
                      }
                      fill={objective.captured_by ? 'currentColor' : 'none'}
                    />
                    <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--objective)' }}>
                      {objective.captured_by ? (objective.captured_by === 'A' ? '🔥' : '🌊') : `+${objective.points}`}
                    </span>
                  </div>
                )}

                {/* Agent token */}
                {agent && (
                  <div className={`agent-token ${agent.team === 'A' ? 'agent-team-a' : 'agent-team-b'} ${isTurn ? 'active-turn-ring' : ''}`}>
                    <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{AGENT_NAMES[agent.id] ?? agent.id}</span>
                    {/* HP micro-bar */}
                    <div style={{ width: '80%', height: 3, background: '#0a0b0b', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                      <div style={{
                        width: `${agent.hp}%`,
                        height: '100%',
                        background: agent.hp > 60 ? '#4ade80' : agent.hp > 30 ? '#fb923c' : '#ef4444',
                        borderRadius: 2,
                      }} />
                    </div>
                    {agent.is_defending && (
                      <div className="defense-badge" title="Defending — 50% damage reduction">
                        <Shield size={8} />
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
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.73rem', color: 'var(--text-muted)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--team-a)', display: 'inline-block' }} />
          Ember Guard
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--team-b)', display: 'inline-block' }} />
          Ashen Veil
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Gem size={11} color="var(--objective)" />
          Relic Node
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, background: '#1e2222', border: '1px solid #2a2e2e', display: 'inline-block', borderRadius: 2 }} />
          Obstacle
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #f59e0b', display: 'inline-block' }} />
          Active Turn
        </span>
      </div>
    </div>
  );
};
