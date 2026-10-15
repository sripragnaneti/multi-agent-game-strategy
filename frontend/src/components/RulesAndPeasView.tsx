import React from 'react';
import { BookOpen, ShieldCheck, Compass, Radio } from 'lucide-react';

export const RulesAndPeasView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '78vh', overflowY: 'auto', paddingRight: '6px' }}>
      {/* PEAS Formulation Card */}
      <div className="card" style={{ borderLeft: '4px solid #38bdf8' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', color: '#38bdf8' }}>
          <Compass size={20} />
          PEAS FORMULATION (FUNDAMENTALS OF AI)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ background: '#0d1322', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '4px' }}>Performance Measure (P)</strong>
            <p style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
              Victory (+100 pts), Objective Capture (+15 to +20 pts), Knockout (+25 pts), Damage Inflicted (+2/HP), Teammate Preservation (-2/friendly HP lost).
            </p>
          </div>

          <div style={{ background: '#0d1322', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>Environment (E)</strong>
            <p style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
              7 × 7 Grid Arena with static obstacle cover, 3 contested relics, discrete coordinates (x, y), sequential round-robin turn order, and deterministic transitions.
            </p>
          </div>

          <div style={{ background: '#0d1322', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px' }}>Actuators (A)</strong>
            <p style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
              MOVE (Up, Down, Left, Right to adjacent non-blocked cells), ATTACK (Chebyshev range 1), DEFEND (50% damage reduction), COLLECT (claim objective), WAIT.
            </p>
          </div>

          <div style={{ background: '#0d1322', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <strong style={{ color: '#f43f5e', display: 'block', marginBottom: '4px' }}>Sensors (S)</strong>
            <p style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
              Agent coordinates & HP, teammate status & roles, visible opponent positions, objective states, team score, and inter-agent message inbox.
            </p>
          </div>
        </div>
      </div>

      {/* Environment Characteristics */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#fbbf24' }}>
          ENVIRONMENT TAXONOMY (RUSSELL & NORVIG)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
          <div style={{ background: '#131b2e', padding: '8px', borderRadius: '6px' }}>
            <strong>Multi-Agent:</strong> Competitive between opposing teams; strictly cooperative within intra-team pairs.
          </div>
          <div style={{ background: '#131b2e', padding: '8px', borderRadius: '6px' }}>
            <strong>Deterministic:</strong> Actions produce guaranteed state transitions without uncontrolled noise.
          </div>
          <div style={{ background: '#131b2e', padding: '8px', borderRadius: '6px' }}>
            <strong>Sequential:</strong> Previous actions directly dictate current board positions and resource control.
          </div>
          <div style={{ background: '#131b2e', padding: '8px', borderRadius: '6px' }}>
            <strong>Discrete:</strong> Fixed 7x7 grid coordinates, discrete turns, integer health values, and defined actions.
          </div>
        </div>
      </div>

      {/* State-Space Transition Flow */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#38bdf8' }}>
          STATE-SPACE TRANSITION & SEARCH MODEL
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          <strong>State Transition Cycle:</strong> <code>Current State S → Action A Selected by Agent → State Validation Engine → S' → Reward/Evaluation Function U(S') → Opponent Response Projection</code>
        </p>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          <strong>Alpha-Beta Pruning Invariance:</strong> Evaluates identical game trees as pure Minimax, guaranteeing the optimal adversarial move while pruning dominated subtrees whenever <code>β ≤ α</code>, reducing branching complexity.
        </p>
      </div>
    </div>
  );
};
