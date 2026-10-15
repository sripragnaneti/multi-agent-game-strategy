import React, { useState, useEffect, useRef } from 'react';
import { GameState, LatestDecision, Scenario, SearchMetrics } from './types';
import { fetchGameState, stepSimulation, resetMatch, fetchScenarios } from './services/api';
import { GridBoard } from './components/GridBoard';
import { TeamCards } from './components/TeamCards';
import { ActiveAgentPanel } from './components/ActiveAgentPanel';
import { EventLog } from './components/EventLog';
import { MultiAgentView } from './components/MultiAgentView';
import { AlgorithmVisualizer } from './components/AlgorithmVisualizer';
import { AnalyticsView } from './components/AnalyticsView';
import { RulesAndPeasView } from './components/RulesAndPeasView';
import { Play, Pause, RotateCcw, FastForward, Layers, Cpu, BarChart2, BookOpen, Users } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'arena' | 'multiagent' | 'search' | 'analytics' | 'rules'>('arena');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [latestDecision, setLatestDecision] = useState<LatestDecision | undefined>();
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('standard');
  const [loading, setLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);

  // Initialize data & WebSockets connection
  useEffect(() => {
    fetchScenarios().then(setScenarios).catch(console.error);

    const initData = async () => {
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
    };
    initData();

    // Connect WebSocket for live simulation updates
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'STATE_UPDATE') {
        if (msg.state) setGameState(msg.state);
        if (msg.latest_decision) setLatestDecision(msg.latest_decision);
        if (msg.is_auto_running !== undefined) setIsAutoRunning(msg.is_auto_running);
      } else if (msg.type === 'STATUS') {
        if (msg.is_auto_running !== undefined) setIsAutoRunning(msg.is_auto_running);
        if (msg.state) setGameState(msg.state);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleStep = async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'STEP' }));
    } else {
      const res = await stepSimulation();
      if (res.state) setGameState(res.state);
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
    const sc = scenarioId || selectedScenario;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'RESET', scenario: sc }));
    } else {
      resetMatch(sc).then((res) => {
        setGameState(res.state);
        setLatestDecision(undefined);
        setIsAutoRunning(false);
      });
    }
  };

  if (loading || !gameState) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff' }}>
        <h2>Connecting to AI Team Strategy Engine on localhost:8000...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Header */}
      <header
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              AI TEAM STRATEGY ARENA
            </h1>
            <span style={{ background: '#1e293b', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              FOAI REVIEW
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Course: Fundamentals of Artificial Intelligence • Case Study: Multi-Agent Game Strategy
          </span>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Preset Scenario Selector */}
          <select
            value={selectedScenario}
            onChange={(e) => {
              setSelectedScenario(e.target.value);
              handleReset(e.target.value);
            }}
            style={{
              background: '#090d16',
              color: '#f1f5f9',
              border: '1px solid var(--border-color)',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>

          <button
            className="button-primary"
            onClick={handleToggleAuto}
            style={{ background: isAutoRunning ? '#f59e0b' : undefined }}
          >
            {isAutoRunning ? <Pause size={16} /> : <Play size={16} />}
            {isAutoRunning ? 'Pause Simulation' : 'Start Simulation'}
          </button>

          <button className="button-secondary" onClick={handleStep} disabled={isAutoRunning}>
            <FastForward size={16} />
            Advance Turn
          </button>

          <button className="button-secondary" onClick={() => handleReset()}>
            <RotateCcw size={16} />
            Reset Match
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
        <button
          className={activeTab === 'arena' ? 'button-primary' : 'button-secondary'}
          onClick={() => setActiveTab('arena')}
        >
          <Layers size={16} />
          Simulation Arena
        </button>
        <button
          className={activeTab === 'multiagent' ? 'button-primary' : 'button-secondary'}
          onClick={() => setActiveTab('multiagent')}
        >
          <Users size={16} />
          Multi-Agent Dynamics
        </button>
        <button
          className={activeTab === 'search' ? 'button-primary' : 'button-secondary'}
          onClick={() => setActiveTab('search')}
        >
          <Cpu size={16} />
          Search & Alpha-Beta Visualizer
        </button>
        <button
          className={activeTab === 'analytics' ? 'button-primary' : 'button-secondary'}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 size={16} />
          Analytics & Outcome
        </button>
        <button
          className={activeTab === 'rules' ? 'button-primary' : 'button-secondary'}
          onClick={() => setActiveTab('rules')}
        >
          <BookOpen size={16} />
          PEAS & Game Rules
        </button>
      </div>

      {/* Main Screen Views */}
      <main style={{ flex: 1 }}>
        {activeTab === 'arena' && (
          <div>
            <TeamCards state={gameState} />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(320px, 1fr)', gap: '1rem', alignItems: 'start' }}>
              <GridBoard state={gameState} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ActiveAgentPanel state={gameState} decision={latestDecision} />
                <EventLog events={gameState.events} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'multiagent' && <MultiAgentView state={gameState} />}

        {activeTab === 'search' && (
          <AlgorithmVisualizer metrics={latestDecision?.metrics} />
        )}

        {activeTab === 'analytics' && <AnalyticsView state={gameState} />}

        {activeTab === 'rules' && <RulesAndPeasView />}
      </main>
    </div>
  );
}

export default App;
