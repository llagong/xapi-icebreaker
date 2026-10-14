import { describe, expect, it } from 'vitest';
import {
	createInitialProgress,
	ICE_BREAKER_PROGRESS_KEY,
	loadProgress,
	parseSavedProgress,
	PROGRESS_VERSION,
	purchaseNextHammer,
	saveProgress,
	type PlayerProgress,
	type ProgressStorage
} from './progression';

function createStorage(
	initialValue: string | null = null
): ProgressStorage & { value: string | null } {
	return {
		value: initialValue,
		getItem() {
			return this.value;
		},
		setItem(key, value) {
			expect(key).toBe(ICE_BREAKER_PROGRESS_KEY);
			this.value = value;
		}
	};
}

describe('hammer purchases', () => {
	it('deducts the price and advances exactly one hammer level', () => {
		const result = purchaseNextHammer({ version: PROGRESS_VERSION, points: 80, hammerLevel: 0 });

		expect(result).toMatchObject({
			status: 'purchased',
			cost: 50,
			previousLevel: 0,
			newLevel: 1,
			progress: { points: 30, hammerLevel: 1 }
		});
	});

	it('does not change progress when points are insufficient', () => {
		const progress = { version: PROGRESS_VERSION, points: 49, hammerLevel: 0 } as const;
		const result = purchaseNextHammer(progress);

		expect(result.status).toBe('insufficient-points');
		expect(result.progress).toBe(progress);
	});

	it('does not purchase beyond the maximum hammer level', () => {
		const progress = { version: PROGRESS_VERSION, points: 999, hammerLevel: 4 } as const;
		const result = purchaseNextHammer(progress);

		expect(result.status).toBe('maximum-level');
		expect(result.progress).toBe(progress);
		expect(result.cost).toBeNull();
	});

	it('uses the complete exponential price sequence', () => {
		let progress: PlayerProgress = { version: PROGRESS_VERSION, points: 750, hammerLevel: 0 };
		const costs: number[] = [];

		while (progress.hammerLevel < 4) {
			const result = purchaseNextHammer(progress);
			if (result.cost !== null) costs.push(result.cost);
			progress = result.progress;
		}

		expect(costs).toEqual([50, 100, 200, 400]);
		expect(progress).toEqual({ version: PROGRESS_VERSION, points: 0, hammerLevel: 4 });
	});
});

describe('saved progress', () => {
	it('round-trips valid progress through storage', () => {
		const storage = createStorage();
		const progress = { version: PROGRESS_VERSION, points: 275, hammerLevel: 2 } as const;

		expect(saveProgress(storage, progress)).toBe(true);
		expect(loadProgress(storage)).toEqual(progress);
	});

	it.each([
		null,
		'not-json',
		'{}',
		JSON.stringify({ version: 0, points: 100, hammerLevel: 1 }),
		JSON.stringify({ version: PROGRESS_VERSION, points: -1, hammerLevel: 1 }),
		JSON.stringify({ version: PROGRESS_VERSION, points: 100, hammerLevel: 8 })
	])('recovers safely from missing, invalid, or outdated data', (raw) => {
		expect(parseSavedProgress(raw)).toEqual(createInitialProgress());
	});

	it('survives unavailable browser storage', () => {
		const unavailableStorage: ProgressStorage = {
			getItem() {
				throw new Error('storage unavailable');
			},
			setItem() {
				throw new Error('storage unavailable');
			}
		};

		expect(loadProgress(unavailableStorage)).toEqual(createInitialProgress());
		expect(saveProgress(unavailableStorage, createInitialProgress())).toBe(false);
	});
});
