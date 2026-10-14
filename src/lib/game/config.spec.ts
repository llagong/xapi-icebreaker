import { describe, expect, it } from 'vitest';
import { HAMMERS, INITIAL_GAME_STATE, MINIMUM_SCORE, SCORE_TIERS, SCORE_VARIANCE } from './config';

describe('hammer configuration', () => {
	it('defines five levels that reduce the hit count from five to one', () => {
		expect(HAMMERS).toHaveLength(5);
		expect(HAMMERS.map((hammer) => hammer.requiredHits)).toEqual([5, 4, 3, 2, 1]);
	});

	it('uses the agreed upgrade price curve', () => {
		expect(HAMMERS.map((hammer) => hammer.upgradeCost)).toEqual([50, 100, 200, 400, null]);
	});

	it('provides a distinct name for every level', () => {
		const names = HAMMERS.map((hammer) => hammer.name);
		expect(new Set(names).size).toBe(HAMMERS.length);
	});
});

describe('score configuration', () => {
	it('matches the agreed duration thresholds and base points', () => {
		expect(SCORE_TIERS.map(({ maxDurationMs, basePoints }) => [maxDurationMs, basePoints])).toEqual(
			[
				[200, 50],
				[300, 40],
				[400, 30],
				[500, 20],
				[null, 10]
			]
		);
	});

	it('defines the score variance and minimum', () => {
		expect(SCORE_VARIANCE).toBe(5);
		expect(MINIMUM_SCORE).toBe(10);
	});
});

describe('initial game state', () => {
	it('starts directly in the playable arena with no progress', () => {
		expect(INITIAL_GAME_STATE).toEqual({
			phase: 'playing',
			points: 0,
			hammerLevel: 0,
			iceBroken: 0,
			registrationId: null,
			activeIce: null
		});
	});
});
