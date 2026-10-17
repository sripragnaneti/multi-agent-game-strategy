import React from 'react';
import { GameState } from '../types';
import { AGENT_NAMES, AGENT_ROLES, TEAM_NAMES } from '../agentNames';

interface TeamCardsProps { state: GameState; }

export const TeamCards: React.FC<TeamCardsProps> = ({ state }) => {
  const getTeamStats = (team: 'A' | 'B') => {
    const agents = Object.values(state.agents).filter((a) => a.team === team);
    const alive      = agents.filter((a) => a.is_alive).length;
    const totalHp    = agents.reduce((s, a) => s + (a.is_alive ? a.hp : 0), 0);
    const damage     = agents.reduce((s, a) => s + a.damage_dealt, 0);
    const objectives = state.objectives.filter((o) => o.captured_by === team).length;
    const elims      = agents.reduce((s, a) => s + a.eliminations, 0);
    return { alive, totalHp, damage, objectives, elims, agents };
  };

  const teamA = getTeamStats('A');
  const teamB = getTeamStats('B');

  const renderAgentRow = (agent: ReturnType<typeof getTeamStats>['agents'][number]) => (
    <div key={agent.id} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '4px 6px', borderRadius: 6,
      background: agent.is_alive ? 'transparent' : 'rgba(0,0,0,0.2)',
      opacity: agent.is_alive ? 1 : 0.45,
    }}>
      {/* Token */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: agent.team === 'A'
          ? 'radial-gradient(circle at 35% 35%, #f59e0b, #92400e)'
          : 'radial-gradient(circle at 35% 35%, #2dd4bf, #0f5f59)',
        border: `2px solid ${agent.team === 'A' ? '#fbbf24' : '#5eead4'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.6rem', fontFamily: "'Cinzel', serif", fontWeight: 700,
        color: '#fff', flexShrink: 0,
      }}>
        {(AGENT_NAMES[agent.id] ?? agent.id).slice(0, 2)}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <span style={{ fontWeight: 600 }}>{AGENT_NAMES[agent.id] ?? agent.id}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{AGENT_ROLES[agent.id]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <div className="hp-bar-track" style={{ flex: 1 }}>
            <div className="hp-bar-fill" style={{
              width: `${agent.hp}%`,
              background: agent.hp > 60 ? '#4ade80' : agent.hp > 30 ? '#fb923c' : '#ef4444',
            }} />
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>{agent.hp}/100</span>
        </div>
      </div>
    </div>
  );

  const TeamCard = ({ team }: { team: 'A' | 'B' }) => {
    const stats = team === 'A' ? teamA : teamB;
    const color = team === 'A' ? 'var(--team-a)' : 'var(--team-b)';
    const colorLight = team === 'A' ? 'var(--team-a-light)' : 'var(--team-b-light)';
    const score = state.scores[team];

    return (
      <div className="card" style={{ borderTop: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="faction-name" style={{ fontSize: '0.95rem', color: colorLight }}>{TEAM_NAMES[team]}</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {stats.alive}/2 active · {stats.totalHp} HP remaining
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="score-badge" style={{ color: colorLight }}>{score}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>POINTS</div>
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[
            { label: 'Damage', value: stats.damage },
            { label: 'Relics', value: `${stats.objectives} / 3` },
            { label: 'KOs', value: stats.elims },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#111414', padding: '5px 6px', borderRadius: 6, textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: colorLight, marginTop: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Per-agent rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {stats.agents.map(renderAgentRow)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
      <TeamCard team="A" />
      <TeamCard team="B" />
    </div>
  );
};
