import React from 'react';
import { GameState, LatestDecision } from '../types';
import { Brain, Cpu, Activity, Info } from 'lucide-react';

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
        <h3>Active Agent Inspection</h3>
        <p style={{ color: 'var(--text-muted)' }}>Waiting for game initialization...</p>
      </div>
    );
  }

  const isTeamA = agent.team === 'A';

  return (
    <div className="card" style={{ borderLeft: `4px solid ${isTeamA ? 'var(--team-a)' : 'var(--team-b)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={20} color={isTeamA ? 'var(--team-a)' : 'var(--team-b)'} />
          <h3 style={{ fontSize: '1.1rem' }}>
            AGENT {agent.id} — {agent.role.toUpperCase()}
          </h3>
        </div>
        <span
          style={{
            background: isTeamA ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            color: isTeamA ? 'var(--team-a)' : 'var(--team-b)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          TEAM {agent.team}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Position:</span> ({agent.position[0]}, {agent.position[1]})
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Health:</span> {agent.hp} / {agent.max_hp} HP
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Strategy:</span> <strong>{agent.strategy}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Stance:</span> {agent.is_defending ? '🛡️ DEFENDING (50% DR)' : '⚔️ OFFENSIVE'}
        </div>
      </div>

      {/* Decision Cycle Breakdown */}
      <div style={{ background: '#0d1322', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600 }}>
          <Brain size={16} />
          <span>AUTONOMOUS DECISION REASONING</span>
        </div>

        {decision && decision.agent_id === agent.id ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action Executed:</span>
              <span style={{ background: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, color: '#38bdf8' }}>
                {decision.action}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              "{decision.reason}"
            </p>

            {decision.metrics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', background: '#131b2e', padding: '6px', borderRadius: '4px' }}>
                <div>Nodes: <strong style={{ color: '#fff' }}>{decision.metrics.nodes_visited}</strong></div>
                <div>Pruned: <strong style={{ color: '#10b981' }}>{decision.metrics.branches_pruned}</strong></div>
                <div>Time: <strong style={{ color: '#fff' }}>{decision.metrics.execution_time_ms} ms</strong></div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Agent is analyzing the state space... Click "Advance Turn" or "Start Simulation" to execute decision.
          </p>
        )}
      </div>
    </div>
  );
};
