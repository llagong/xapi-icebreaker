import { describe, expect, it } from 'vitest';
import { HAMMERS } from './config';
import { calculateBreakScore, formatDuration, getScoreTier, resolveHit } from './game';

describe('break scoring', () => {
	it.each([
		[0, 50],
		[200, 50],
		[201, 40],
		[300, 40],
		[301, 30],
		[400, 30],
		[401, 20],
		[500, 20],
		[501, 10]
	])('awards the correct base points at %dms', (durationMs, expectedPoints) => {
		expect(getScoreTier(durationMs).basePoints).toBe(expectedPoints);
	});

	it('applies the complete integer variance range', () => {
		expect(calculateBreakScore(200, () => 0)).toMatchObject({ points: 45, variance: -5 });
		expect(calculateBreakScore(200, () => 0.999_999)).toMatchObject({
			points: 55,
			variance: 5
		});
	});

	it('never awards fewer than ten points', () => {
		expect(calculateBreakScore(10_000, () => 0)).toMatchObject({
			points: 10,
			basePoints: 10,
			variance: -5
		});
	});

	it('formats elapsed time to hundredths of a second', () => {
		expect(formatDuration(823)).toBe('0.82s');
	});
});

describe('hammer hit requirements', () => {
	it('requires exactly five hits for the starting hammer', () => {
		expect(HAMMERS[0].requiredHits).toBe(5);
	});

	it('decreases by one hit per upgrade until one hit remains', () => {
		expect(HAMMERS.map((hammer) => hammer.requiredHits)).toEqual([5, 4, 3, 2, 1]);
	});

	it('breaks only when the active hammer reaches its requirement', () => {
		let hits = 0;

		for (let strike = 1; strike <= HAMMERS[0].requiredHits; strike += 1) {
			const result = resolveHit(hits, HAMMERS[0].requiredHits, false);
			hits = result.hits;
			expect(result.didBreak).toBe(strike === HAMMERS[0].requiredHits);
		}
	});

	it('rejects input while an ice block is already breaking', () => {
		expect(resolveHit(5, 5, true)).toEqual({
			accepted: false,
			hits: 5,
			didBreak: false
		});
	});
});
