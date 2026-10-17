// Game-inspired character names mapping
// Replaces generic "A1/A2/B1/B2" labels throughout the UI

export const AGENT_NAMES: Record<string, string> = {
  A1: 'Kael',
  A2: 'Sira',
  B1: 'Dusk',
  B2: 'Varn',
};

export const TEAM_NAMES: Record<string, string> = {
  A: 'Ember Guard',
  B: 'Ashen Veil',
};

export const AGENT_ROLES: Record<string, string> = {
  A1: 'Striker',
  A2: 'Warden',
  B1: 'Vanguard',
  B2: 'Flanker',
};

/** Returns "Kael (Striker)" style label */
export function agentLabel(id: string): string {
  return `${AGENT_NAMES[id] ?? id} · ${AGENT_ROLES[id] ?? ''}`;
}
