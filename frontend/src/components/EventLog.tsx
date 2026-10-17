import React from 'react';
import { GameEvent } from '../types';
import { Activity, ShieldAlert, Swords, Gem, MoveRight, Clock } from 'lucide-react';
import { AGENT_NAMES } from '../agentNames';

interface EventLogProps { events: GameEvent[]; }

const EVENT_ICON: Record<string, React.ReactNode> = {
  ATTACK:  <Swords    size={13} color="#fb923c" />,
  DEFEND:  <ShieldAlert size={13} color="#4ade80" />,
  COLLECT: <Gem       size={13} color="#c8a84b" />,
  MOVE:    <MoveRight size={13} color="#7a7870" />,
  WAIT:    <Clock     size={13} color="#4a4840" />,
};

// Replaces "A1", "B2" etc. in description text with character names
const substituteNames = (text: string): string => {
  let out = text;
  for (const [id, name] of Object.entries(AGENT_NAMES)) {
    out = out.replaceAll(id, name);
  }
  return out;
};

export const EventLog: React.FC<EventLogProps> = ({ events }) => (
  <div className="card" style={{ height: 300, display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
        <Activity size={13} />
        Battle Log
      </span>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{events.length} events</span>
    </div>

    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {events.length === 0 ? (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'center', margin: 'auto' }}>
          No actions yet — press Play or Next Turn.
        </p>
      ) : (
        [...events].reverse().map((ev) => {
          const isTeamA = ev.team === 'A';
          return (
            <div
              key={ev.id}
              className={`event-log-item ${isTeamA ? 'team-a' : 'team-b'}`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>{EVENT_ICON[ev.event_type] ?? <Activity size={13} color="#4a4840" />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.75rem', color: isTeamA ? 'var(--team-a-light)' : 'var(--team-b-light)' }}>
                      {AGENT_NAMES[ev.agent_id] ?? ev.agent_id}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>T{ev.turn}</span>
                  </div>
                  <span style={{ color: '#a09888', lineHeight: 1.35, fontSize: '0.73rem', display: 'block' }}>
                    {substituteNames(ev.description)}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);
