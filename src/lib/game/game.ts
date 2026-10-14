import { MINIMUM_SCORE, SCORE_TIERS, SCORE_VARIANCE } from './config';

export interface BreakScore {
	points: number;
	basePoints: number;
	variance: number;
	label: string;
}

export interface HitResolution {
	accepted: boolean;
	hits: number;
	didBreak: boolean;
}

function normalizeRandom(randomValue: number): number {
	if (!Number.isFinite(randomValue)) return 0;
	return Math.min(Math.max(randomValue, 0), 0.999_999);
}

export function getScoreTier(durationMs: number) {
	const safeDuration = Math.max(0, durationMs);
	return SCORE_TIERS.find(
		(tier) => tier.maxDurationMs === null || safeDuration <= tier.maxDurationMs
	)!;
}

export function calculateBreakScore(
	durationMs: number,
	random: () => number = Math.random
): BreakScore {
	const tier = getScoreTier(durationMs);
	const variance =
		Math.floor(normalizeRandom(random()) * (SCORE_VARIANCE * 2 + 1)) - SCORE_VARIANCE;

	return {
		points: Math.max(MINIMUM_SCORE, tier.basePoints + variance),
		basePoints: tier.basePoints,
		variance,
		label: tier.label
	};
}

export function resolveHit(
	currentHits: number,
	requiredHits: number,
	isBreaking: boolean
): HitResolution {
	const safeRequiredHits = Math.max(1, requiredHits);
	const safeCurrentHits = Math.min(Math.max(0, currentHits), safeRequiredHits);

	if (isBreaking) {
		return { accepted: false, hits: safeCurrentHits, didBreak: false };
	}

	const hits = Math.min(safeCurrentHits + 1, safeRequiredHits);
	return { accepted: true, hits, didBreak: hits === safeRequiredHits };
}

export function formatDuration(durationMs: number): string {
	return `${(Math.max(0, durationMs) / 1_000).toFixed(2)}s`;
}
