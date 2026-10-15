import React from 'react';
import { GameEvent } from '../types';
import { Activity, ShieldAlert, Swords, Target, Move } from 'lucide-react';

interface EventLogProps {
  events: GameEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ATTACK':
        return <Swords size={14} color="#f43f5e" />;
      case 'DEFEND':
        return <ShieldAlert size={14} color="#10b981" />;
      case 'COLLECT':
        return <Target size={14} color="#fbbf24" />;
      case 'MOVE':
        return <Move size={14} color="#38bdf8" />;
      default:
        return <Activity size={14} color="#94a3b8" />;
    }
  };

  return (
    <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={16} color="#38bdf8" />
          SIMULATION EVENT TIMELINE
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{events.length} Events</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
        {events.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
            No actions recorded yet. Start simulation or advance a turn.
          </p>
        ) : (
          [...events].reverse().map((ev) => {
            const isTeamA = ev.team === 'A';
            return (
              <div
                key={ev.id}
                style={{
                  background: '#0d1322',
                  border: '1px solid #1e293b',
                  borderLeft: `3px solid ${isTeamA ? 'var(--team-a)' : 'var(--team-b)'}`,
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <div style={{ marginTop: '2px' }}>{getEventIcon(ev.event_type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: isTeamA ? 'var(--team-a)' : 'var(--team-b)' }}>
                      TURN {ev.turn}: {ev.agent_id}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ev.event_type}</span>
                  </div>
                  <span style={{ color: '#cbd5e1', lineHeight: 1.3 }}>{ev.description}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
