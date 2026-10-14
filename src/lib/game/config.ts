import type { GameState, HammerDefinition, ScoreTier } from './types';

export const HAMMERS = [
	{
		level: 0,
		name: 'Wooden Mallet',
		description: 'A humble start. Five solid hits will do it.',
		requiredHits: 5,
		upgradeCost: 50,
		accent: '#f5b968'
	},
	{
		level: 1,
		name: 'Stone Cracker',
		description: 'Heavy-headed and ready to make a dent.',
		requiredHits: 4,
		upgradeCost: 100,
		accent: '#b9c6d4'
	},
	{
		level: 2,
		name: 'Iron Breaker',
		description: 'Forged for fast, decisive strikes.',
		requiredHits: 3,
		upgradeCost: 200,
		accent: '#f18762'
	},
	{
		level: 3,
		name: 'Frost Smasher',
		description: 'Cold meets colder. The ice barely stands a chance.',
		requiredHits: 2,
		upgradeCost: 400,
		accent: '#56d6e9'
	},
	{
		level: 4,
		name: 'Thunder Hammer',
		description: 'One swing. One shatter. Maximum power.',
		requiredHits: 1,
		upgradeCost: null,
		accent: '#ffd166'
	}
] as const satisfies readonly HammerDefinition[];

export const SCORE_TIERS = [
	{ maxDurationMs: 200, basePoints: 50, label: 'Lightning' },
	{ maxDurationMs: 300, basePoints: 40, label: 'Rapid' },
	{ maxDurationMs: 400, basePoints: 30, label: 'Quick' },
	{ maxDurationMs: 500, basePoints: 20, label: 'Steady' },
	{ maxDurationMs: null, basePoints: 10, label: 'Complete' }
] as const satisfies readonly ScoreTier[];

export const SCORE_VARIANCE = 5;
export const MINIMUM_SCORE = 10;

export const INITIAL_GAME_STATE: Readonly<GameState> = {
	phase: 'playing',
	points: 0,
	hammerLevel: 0,
	iceBroken: 0,
	registrationId: null,
	activeIce: null
};
