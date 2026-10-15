import React from 'react';
import { GameState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart3, TrendingUp, Trophy } from 'lucide-react';

interface AnalyticsViewProps {
  state: GameState;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ state }) => {
  // Agent Performance Data
  const agentData = Object.values(state.agents).map((a) => ({
    name: `${a.id} (${a.team})`,
    hp: a.hp,
    damage: a.damage_dealt,
    relics: a.objectives_captured,
    eliminations: a.eliminations
  }));

  // Score comparison data
  const scoreData = [
    { name: 'Team A (Alpha)', score: state.scores.A, fill: '#38bdf8' },
    { name: 'Team B (Beta)', score: state.scores.B, fill: '#f43f5e' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner / Match Status */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="#fbbf24" />
            MATCH OUTCOME & PERFORMANCE ANALYTICS
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Status: <strong>{state.status}</strong> | Total Turns: <strong>{state.turn} / {state.max_turns}</strong>
          </span>
        </div>
        {state.winner && (
          <div style={{ background: state.winner === 'A' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(244, 63, 94, 0.2)', padding: '6px 16px', borderRadius: '8px', border: `1px solid ${state.winner === 'A' ? 'var(--team-a)' : 'var(--team-b)'}` }}>
            <strong style={{ color: state.winner === 'A' ? 'var(--team-a)' : 'var(--team-b)', fontSize: '1rem' }}>
              VICTORY: TEAM {state.winner}
            </strong>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0 }}>{state.win_reason}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Agent Combat Performance Chart */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            DAMAGE DEALT BY AGENTS (HP)
          </h4>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }} />
                <Bar dataKey="damage" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Team Health Chart */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            AGENT SURVIVAL & HEALTH (CURRENT HP)
          </h4>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={11} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }} />
                <Bar dataKey="hp" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
