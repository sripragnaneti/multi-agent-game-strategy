import React from 'react';
import { GameState } from '../types';
import { Shield, Zap, Award, Users } from 'lucide-react';

interface TeamCardsProps {
  state: GameState;
}

export const TeamCards: React.FC<TeamCardsProps> = ({ state }) => {
  const getTeamStats = (team: 'A' | 'B') => {
    const agents = Object.values(state.agents).filter((a) => a.team === team);
    const alive = agents.filter((a) => a.is_alive).length;
    const totalHp = agents.reduce((acc, a) => acc + (a.is_alive ? a.hp : 0), 0);
    const damage = agents.reduce((acc, a) => acc + a.damage_dealt, 0);
    const objectives = state.objectives.filter((o) => o.captured_by === team).length;
    const eliminations = agents.reduce((acc, a) => acc + a.eliminations, 0);

    return { alive, totalHp, damage, objectives, eliminations };
  };

  const teamA = getTeamStats('A');
  const teamB = getTeamStats('B');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
      {/* Team A Card */}
      <div className="card" style={{ borderTop: '4px solid var(--team-a)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ color: 'var(--team-a)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              TEAM ALPHA (A)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agents: A1 (Attacker) & A2 (Support)</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--team-a)' }}>{state.scores.A}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>POINTS</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Surviving</span>
            <strong style={{ color: teamA.alive > 0 ? '#10b981' : '#ef4444' }}>{teamA.alive} / 2</strong>
          </div>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Team HP</span>
            <strong>{teamA.totalHp}</strong>
          </div>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Relics Held</span>
            <strong style={{ color: '#fbbf24' }}>{teamA.objectives}</strong>
          </div>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>KOs</span>
            <strong>{teamA.eliminations}</strong>
          </div>
        </div>
      </div>

      {/* Team B Card */}
      <div className="card" style={{ borderTop: '4px solid var(--team-b)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ color: 'var(--team-b)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              TEAM BETA (B)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agents: B1 (Attacker) & B2 (Flanker)</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--team-b)' }}>{state.scores.B}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>POINTS</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Surviving</span>
            <strong style={{ color: teamB.alive > 0 ? '#10b981' : '#ef4444' }}>{teamB.alive} / 2</strong>
          </div>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Team HP</span>
            <strong>{teamB.totalHp}</strong>
          </div>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Relics Held</span>
            <strong style={{ color: '#fbbf24' }}>{teamB.objectives}</strong>
          </div>
          <div style={{ background: '#0f172a', padding: '6px', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>KOs</span>
            <strong>{teamB.eliminations}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
