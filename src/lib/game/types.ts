export type HammerLevel = 0 | 1 | 2 | 3 | 4;

export interface HammerDefinition {
	level: HammerLevel;
	name: string;
	description: string;
	requiredHits: number;
	upgradeCost: number | null;
	accent: string;
}

export interface ScoreTier {
	maxDurationMs: number | null;
	basePoints: number;
	label: string;
}

export type GamePhase = 'welcome' | 'playing' | 'breaking' | 'paused';

export interface IceState {
	id: string;
	hits: number;
	spawnedAt: number;
	firstHitAt: number | null;
	position: {
		xPercent: number;
		yPercent: number;
	};
}

export interface GameState {
	phase: GamePhase;
	points: number;
	hammerLevel: HammerLevel;
	iceBroken: number;
	registrationId: string | null;
	activeIce: IceState | null;
}
