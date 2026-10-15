import React from 'react';
import { GameState } from '../types';
import { MessageSquare, Radio, Shield, Crosshair } from 'lucide-react';

interface MultiAgentViewProps {
  state: GameState;
}

export const MultiAgentView: React.FC<MultiAgentViewProps> = ({ state }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 4 Agent Strategic Profiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {Object.values(state.agents).map((agent) => {
          const isTeamA = agent.team === 'A';
          return (
            <div
              key={agent.id}
              className="card"
              style={{
                borderLeft: `4px solid ${isTeamA ? 'var(--team-a)' : 'var(--team-b)'}`,
                opacity: agent.is_alive ? 1 : 0.4
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ color: isTeamA ? 'var(--team-a)' : 'var(--team-b)', fontSize: '1.1rem' }}>
                  {agent.id} — {agent.role}
                </h4>
                <span
                  style={{
                    background: agent.is_alive ? '#064e3b' : '#7f1d1d',
                    color: agent.is_alive ? '#34d399' : '#f87171',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}
                >
                  {agent.is_alive ? 'OPERATIONAL' : 'ELIMINATED'}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Strategy: <strong style={{ color: '#fff' }}>{agent.strategy}</strong>
              </div>

              {/* Health Bar */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                  <span>Health</span>
                  <span>{agent.hp} / {agent.max_hp} HP</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#0f172a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${agent.hp}%`,
                      height: '100%',
                      background: agent.hp > 50 ? '#10b981' : agent.hp > 25 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <div>Position: ({agent.position[0]}, {agent.position[1]})</div>
                <div>Stance: {agent.is_defending ? '🛡️ Defending' : '⚔️ Attacking'}</div>
                <div>Damage Dealt: {agent.damage_dealt}</div>
                <div>Objectives: {agent.objectives_captured}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inter-Agent Tactical Message Feed */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="#fbbf24" />
            INTER-AGENT COORDINATION & MESSAGING BUS
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Peer-to-Peer Tactical Exchange
          </span>
        </div>

        <div style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {state.messages.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              No tactical messages broadcast yet. Agents communicate automatically when detecting threats, low health, or contested objectives.
            </p>
          ) : (
            [...state.messages].reverse().map((msg) => {
              const isTeamA = msg.team === 'A';
              return (
                <div
                  key={msg.id}
                  style={{
                    background: '#0d1322',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <MessageSquare size={16} color={isTeamA ? 'var(--team-a)' : 'var(--team-b)'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
                      <strong style={{ color: isTeamA ? 'var(--team-a)' : 'var(--team-b)', fontSize: '0.85rem' }}>
                        [{msg.sender_id} ➔ {msg.recipient_id}]
                      </strong>
                      <span style={{ background: '#1e293b', color: '#fbbf24', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px' }}>
                        {msg.msg_type}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Turn {msg.turn}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0 }}>
                      "{msg.content}"
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
