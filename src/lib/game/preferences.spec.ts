import { describe, expect, it } from 'vitest';
import {
	loadSoundPreference,
	saveSoundPreference,
	SOUND_PREFERENCE_KEY,
	type PreferenceStorage
} from './preferences';

function storage(initialValue: string | null = null): PreferenceStorage & { value: string | null } {
	return {
		value: initialValue,
		getItem(key) {
			expect(key).toBe(SOUND_PREFERENCE_KEY);
			return this.value;
		},
		setItem(key, value) {
			expect(key).toBe(SOUND_PREFERENCE_KEY);
			this.value = value;
		}
	};
}

describe('sound preference', () => {
	it('defaults to enabled and restores a muted preference', () => {
		expect(loadSoundPreference(storage())).toBe(true);
		expect(loadSoundPreference(storage('false'))).toBe(false);
	});

	it('persists the selected sound state', () => {
		const target = storage();
		expect(saveSoundPreference(target, false)).toBe(true);
		expect(target.value).toBe('false');
	});

	it('falls back safely when storage is unavailable', () => {
		const unavailable: PreferenceStorage = {
			getItem() {
				throw new Error('unavailable');
			},
			setItem() {
				throw new Error('unavailable');
			}
		};
		expect(loadSoundPreference(unavailable)).toBe(true);
		expect(saveSoundPreference(unavailable, false)).toBe(false);
	});
});
