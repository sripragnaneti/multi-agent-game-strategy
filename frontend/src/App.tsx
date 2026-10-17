import React, { useState, useEffect, useRef } from 'react';
import { GameState, LatestDecision, Scenario } from './types';
import { fetchGameState, stepSimulation, resetMatch, fetchScenarios } from './services/api';
import { GridBoard }          from './components/GridBoard';
import { TeamCards }          from './components/TeamCards';
import { ActiveAgentPanel }   from './components/ActiveAgentPanel';
import { EventLog }           from './components/EventLog';
import { MultiAgentView }     from './components/MultiAgentView';
import { AlgorithmVisualizer } from './components/AlgorithmVisualizer';
import { AnalyticsView }      from './components/AnalyticsView';
import { RulesAndPeasView }   from './components/RulesAndPeasView';
import {
  Play, Pause, RotateCcw, SkipForward,
  Swords, Users, Cpu, BarChart2, BookOpen,
} from 'lucide-react';
import { TEAM_NAMES } from './agentNames';

type TabId = 'arena' | 'multiagent' | 'search' | 'analytics' | 'rules';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'arena',      label: 'Battle Arena',        icon: <Swords size={14} /> },
  { id: 'multiagent', label: 'Agent Dynamics',      icon: <Users size={14} /> },
  { id: 'search',     label: 'Search Visualiser',   icon: <Cpu size={14} /> },
  { id: 'analytics',  label: 'Analytics',           icon: <BarChart2 size={14} /> },
  { id: 'rules',      label: 'Rules & PEAS',        icon: <BookOpen size={14} /> },
];

export function App() {
  const [activeTab, setActiveTab]         = useState<TabId>('arena');
  const [gameState, setGameState]         = useState<GameState | null>(null);
  const [latestDecision, setLatestDecision] = useState<LatestDecision | undefined>();
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [scenarios, setScenarios]         = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('standard');
  const [loading, setLoading]             = useState(true);

  const wsRef = useRef<WebSocket | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchScenarios().then(setScenarios).catch(console.error);

    (async () => {
      try {
        const data = await fetchGameState();
        setGameState(data.state);
        setLatestDecision(data.latest_decision);
        setIsAutoRunning(data.is_auto_running);
      } catch (err) {
        console.error('Failed to load initial state:', err);
      } finally {
        setLoading(false);
      }
    })();

    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'STATE_UPDATE') {
        if (msg.state)           setGameState(msg.state);
        if (msg.latest_decision) setLatestDecision(msg.latest_decision);
        if (msg.is_auto_running !== undefined) setIsAutoRunning(msg.is_auto_running);
      } else if (msg.type === 'STATUS') {
        if (msg.is_auto_running !== undefined) setIsAutoRunning(msg.is_auto_running);
        if (msg.state) setGameState(msg.state);
      }
    };

    return () => ws.close();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStep = async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'STEP' }));
    } else {
      const res = await stepSimulation();
      if (res.state)    setGameState(res.state);
      if (res.decision) setLatestDecision(res.decision);
    }
  };

  const handleToggleAuto = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (isAutoRunning) {
      wsRef.current.send(JSON.stringify({ action: 'PAUSE_AUTO' }));
      setIsAutoRunning(false);
    } else {
      wsRef.current.send(JSON.stringify({ action: 'START_AUTO' }));
      setIsAutoRunning(true);
    }
  };

  const handleReset = (scenarioId?: string) => {
    const sc = scenarioId ?? selectedScenario;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'RESET', scenario: sc }));
    } else {
      resetMatch(sc).then((res) => {
        setGameState(res.state);
        setLatestDecision(undefined);
        setIsAutoRunning(false);
      });
    }
  };

  const handleScenarioChange = (id: string) => {
    setSelectedScenario(id);
    handleReset(id);
  };

  // ── Derived UI state ───────────────────────────────────────────────────────
  const isCompleted = gameState?.status === 'COMPLETED';
  const turn        = gameState?.turn ?? 0;
  const maxTurns    = gameState?.max_turns ?? 60;
  const winner      = gameState?.winner;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || !gameState) {
    return (
      <div style={{
        display: 'flex', height: '100vh', alignItems: 'center',
        justifyContent: 'center', background: '#0e0f0f', flexDirection: 'column', gap: '1rem',
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2e3232', borderTopColor: '#d97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#7a7870', fontSize: '0.85rem' }}>Connecting to strategy engine…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0.75rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{
        background: '#121414',
        border: '1px solid #232626',
        borderRadius: 10,
        padding: '0.65rem 1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        {/* Title */}
        <div>
          <h1 style={{ fontSize: '1.05rem', color: '#e8e2d8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Swords size={18} color="#d97706" />
            Tactical Strategy Arena
          </h1>
          <div style={{ fontSize: '0.72rem', color: '#4a4840', marginTop: 2 }}>
            {TEAM_NAMES.A} &nbsp;⚔️&nbsp; {TEAM_NAMES.B} &nbsp;·&nbsp; Turn {turn} / {maxTurns}
          </div>
        </div>

        {/* Match status badge */}
        {isCompleted ? (
          <div className="status-pill status-ended">
            🏆 {winner === 'A' ? TEAM_NAMES.A : winner === 'B' ? TEAM_NAMES.B : 'Draw'} Wins
          </div>
        ) : isAutoRunning ? (
          <div className="status-pill status-running">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
            Running
          </div>
        ) : (
          <div className="status-pill status-idle">Paused</div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Scenario picker */}
          <select
            className="scenario-select"
            value={selectedScenario}
            onChange={(e) => handleScenarioChange(e.target.value)}
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.name}</option>
            ))}
          </select>

          {/* Play / Pause */}
          <button
            className="button-primary"
            onClick={handleToggleAuto}
            disabled={isCompleted}
            style={isAutoRunning ? { background: 'linear-gradient(135deg,#7c2d12,#c2410c)' } : {}}
          >
            {isAutoRunning ? <Pause size={14} /> : <Play size={14} />}
            {isAutoRunning ? 'Pause' : 'Play'}
          </button>

          {/* Step forward */}
          <button
            className="button-secondary"
            onClick={handleStep}
            disabled={isAutoRunning || isCompleted}
            title="Advance one turn"
          >
            <SkipForward size={14} />
            Next Turn
          </button>

          {/* Reset */}
          <button
            className="button-danger"
            onClick={() => handleReset()}
            title="Reset match to start of selected scenario"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </header>

      {/* ── Nav Tabs ────────────────────────────────────────────────────── */}
      <nav style={{ display: 'flex', gap: 2, borderBottom: '1px solid #232626', paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main style={{ flex: 1 }}>

        {activeTab === 'arena' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Team stat bars */}
            <TeamCards state={gameState} />

            {/* Arena + side panel */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.15fr) minmax(280px, 1fr)', gap: '0.65rem', alignItems: 'start' }}>
              <GridBoard state={gameState} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <ActiveAgentPanel state={gameState} decision={latestDecision} />
                <EventLog events={gameState.events} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'multiagent' && <MultiAgentView state={gameState} />}
        {activeTab === 'search'     && <AlgorithmVisualizer metrics={latestDecision?.metrics} />}
        {activeTab === 'analytics'  && <AnalyticsView state={gameState} />}
        {activeTab === 'rules'      && <RulesAndPeasView />}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

export default App;
