import type { GameState, LatestDecision, Scenario } from '../types';

const API_BASE = 'http://localhost:8000';

export async function fetchGameState(): Promise<{ state: GameState; latest_decision: LatestDecision; is_auto_running: boolean }> {
  const res = await fetch(`${API_BASE}/api/state`);
  if (!res.ok) throw new Error('Failed to fetch game state');
  return res.json();
}

export async function stepSimulation(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/step`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to step simulation');
  return res.json();
}

export async function resetMatch(scenarioId?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id: scenarioId || 'standard' }),
  });
  if (!res.ok) throw new Error('Failed to reset match');
  return res.json();
}

export async function fetchScenarios(): Promise<Scenario[]> {
  const res = await fetch(`${API_BASE}/api/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function compareAlgorithms(depth: number = 2): Promise<any> {
  const res = await fetch(`${API_BASE}/api/compare?depth=${depth}`);
  if (!res.ok) throw new Error('Failed to compare algorithms');
  return res.json();
}

export async function updateConfig(a1Algo: string, b1Algo: string, depth: number): Promise<any> {
  const res = await fetch(`${API_BASE}/api/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a1_algo: a1Algo, b1_algo: b1Algo, depth }),
  });
  if (!res.ok) throw new Error('Failed to update config');
  return res.json();
}
