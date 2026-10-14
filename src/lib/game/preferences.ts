export const SOUND_PREFERENCE_KEY = 'xapi-icebreaker.sound-enabled';

export interface PreferenceStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export function loadSoundPreference(storage: PreferenceStorage): boolean {
	try {
		return storage.getItem(SOUND_PREFERENCE_KEY) !== 'false';
	} catch {
		return true;
	}
}

export function saveSoundPreference(storage: PreferenceStorage, enabled: boolean): boolean {
	try {
		storage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
		return true;
	} catch {
		return false;
	}
}
