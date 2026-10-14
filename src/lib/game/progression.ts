import { HAMMERS } from './config';
import type { HammerLevel } from './types';

export const ICE_BREAKER_PROGRESS_KEY = 'xapi-icebreaker.progress';
export const PROGRESS_VERSION = 1;

export interface PlayerProgress {
	version: typeof PROGRESS_VERSION;
	points: number;
	hammerLevel: HammerLevel;
}

export type UpgradeStatus = 'purchased' | 'insufficient-points' | 'maximum-level';

export interface UpgradeResult {
	status: UpgradeStatus;
	progress: PlayerProgress;
	cost: number | null;
	previousLevel: HammerLevel;
	newLevel: HammerLevel;
}

export interface ProgressStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export function createInitialProgress(): PlayerProgress {
	return { version: PROGRESS_VERSION, points: 0, hammerLevel: 0 };
}

function isHammerLevel(value: unknown): value is HammerLevel {
	return (
		Number.isInteger(value) && typeof value === 'number' && value >= 0 && value < HAMMERS.length
	);
}

export function parseSavedProgress(raw: string | null): PlayerProgress {
	if (raw === null) return createInitialProgress();

	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== 'object' || value === null) return createInitialProgress();

		const candidate = value as Record<string, unknown>;
		if (
			candidate.version !== PROGRESS_VERSION ||
			!Number.isSafeInteger(candidate.points) ||
			typeof candidate.points !== 'number' ||
			candidate.points < 0 ||
			!isHammerLevel(candidate.hammerLevel)
		) {
			return createInitialProgress();
		}

		return {
			version: PROGRESS_VERSION,
			points: candidate.points,
			hammerLevel: candidate.hammerLevel
		};
	} catch {
		return createInitialProgress();
	}
}

export function loadProgress(storage: ProgressStorage): PlayerProgress {
	try {
		return parseSavedProgress(storage.getItem(ICE_BREAKER_PROGRESS_KEY));
	} catch {
		return createInitialProgress();
	}
}

export function saveProgress(storage: ProgressStorage, progress: PlayerProgress): boolean {
	try {
		storage.setItem(ICE_BREAKER_PROGRESS_KEY, JSON.stringify(progress));
		return true;
	} catch {
		return false;
	}
}

export function purchaseNextHammer(progress: PlayerProgress): UpgradeResult {
	const currentHammer = HAMMERS[progress.hammerLevel];
	const cost = currentHammer.upgradeCost;

	if (cost === null) {
		return {
			status: 'maximum-level',
			progress,
			cost,
			previousLevel: progress.hammerLevel,
			newLevel: progress.hammerLevel
		};
	}

	if (progress.points < cost) {
		return {
			status: 'insufficient-points',
			progress,
			cost,
			previousLevel: progress.hammerLevel,
			newLevel: progress.hammerLevel
		};
	}

	const newLevel = (progress.hammerLevel + 1) as HammerLevel;
	return {
		status: 'purchased',
		progress: {
			version: PROGRESS_VERSION,
			points: progress.points - cost,
			hammerLevel: newLevel
		},
		cost,
		previousLevel: progress.hammerLevel,
		newLevel
	};
}
