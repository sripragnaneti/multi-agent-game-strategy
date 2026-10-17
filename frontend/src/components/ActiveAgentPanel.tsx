import React from 'react';
import { GameState, LatestDecision } from '../types';
import { Brain, Sword, Shield } from 'lucide-react';
import { AGENT_NAMES, AGENT_ROLES, TEAM_NAMES } from '../agentNames';

interface ActiveAgentPanelProps {
  state: GameState;
  decision?: LatestDecision;
}

export const ActiveAgentPanel: React.FC<ActiveAgentPanelProps> = ({ state, decision }) => {
  const currentAgentId = state.turn_order[state.current_agent_index % state.turn_order.length];
  const agent = state.agents[currentAgentId];

  if (!agent) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>Waiting for game to start…</p>
      </div>
    );
  }

  const isTeamA    = agent.team === 'A';
  const color      = isTeamA ? 'var(--team-a)' : 'var(--team-b)';
  const colorLight = isTeamA ? 'var(--team-a-light)' : 'var(--team-b-light)';
  const name       = AGENT_NAMES[agent.id] ?? agent.id;
  const role       = AGENT_ROLES[agent.id] ?? agent.role;
  const faction    = TEAM_NAMES[agent.team];

  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      {/* Agent identity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: isTeamA
              ? 'radial-gradient(circle at 35% 35%, #f59e0b, #92400e)'
              : 'radial-gradient(circle at 35% 35%, #2dd4bf, #0f5f59)',
            border: `2px solid ${colorLight}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '0.75rem', color: '#fff',
          }}>
            {name.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, fontSize: '1rem', color: colorLight }}>{name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{role} · {faction}</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: agent.is_defending ? 'rgba(74,222,128,0.1)' : 'rgba(251,146,60,0.1)',
          color: agent.is_defending ? '#4ade80' : '#fb923c',
          padding: '3px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
        }}>
          {agent.is_defending ? <Shield size={11} /> : <Sword size={11} />}
          {agent.is_defending ? 'Defending' : 'Offence'}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: '0.6rem', fontSize: '0.73rem' }}>
        {[
          { label: 'Health',    value: `${agent.hp} / ${agent.max_hp}` },
          { label: 'Position',  value: `(${agent.position[0]}, ${agent.position[1]})` },
          { label: 'Strategy',  value: agent.strategy.replace('Alpha-Beta Pruning', 'α-β Search').replace('Cooperative Tactical', 'Heuristic') },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#111414', padding: '5px 7px', borderRadius: 6 }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontWeight: 600, marginTop: 2, color: 'var(--text-main)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* HP bar */}
      <div className="hp-bar-track" style={{ marginBottom: '0.75rem' }}>
        <div className="hp-bar-fill" style={{
          width: `${agent.hp}%`,
          background: agent.hp > 60 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : agent.hp > 30 ? 'linear-gradient(90deg,#c2410c,#fb923c)' : 'linear-gradient(90deg,#991b1b,#ef4444)',
        }} />
      </div>

      {/* Decision reasoning */}
      <div style={{ background: '#111414', borderRadius: 8, padding: '0.65rem', border: '1px solid #1d2020' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.4rem', color: '#c8a84b', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          <Brain size={13} />
          Decision Reasoning
        </div>

        {decision && decision.agent_id === agent.id ? (
          <div>
            <div style={{ marginBottom: 5 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Action: </span>
              <span style={{
                background: '#1c1e1e', border: '1px solid #2e3232',
                padding: '1px 7px', borderRadius: 4, fontWeight: 700, fontSize: '0.78rem', color: colorLight,
              }}>
                {decision.action}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#c8c0b0', lineHeight: 1.45, marginBottom: '0.4rem' }}>
              {decision.reason}
            </p>
            {decision.metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, fontSize: '0.7rem' }}>
                {[
                  { label: 'Nodes',   value: decision.metrics.nodes_visited },
                  { label: 'Pruned',  value: decision.metrics.branches_pruned, color: '#4ade80' },
                  { label: 'Time',    value: `${decision.metrics.execution_time_ms}ms` },
                ].map(({ label, value, color: c }) => (
                  <div key={label} style={{ background: '#0e0f0f', padding: '4px 6px', borderRadius: 5, textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.62rem' }}>{label}</div>
                    <div style={{ fontWeight: 700, color: c ?? 'var(--text-main)' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Press <strong>Next Turn</strong> or <strong>Play</strong> to see {name}'s next decision.
          </p>
        )}
      </div>
    </div>
  );
};
