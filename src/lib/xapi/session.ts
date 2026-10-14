export const XAPI_SESSION_REGISTRATION_KEY = 'xapi-icebreaker.registration';

export interface SessionStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateSessionRegistration(
	storage: SessionStorage,
	createId: () => string
): string {
	try {
		const storedId = storage.getItem(XAPI_SESSION_REGISTRATION_KEY);
		if (storedId && UUID_PATTERN.test(storedId)) return storedId;
	} catch {
		// A generated registration still allows tracking when storage is unavailable.
	}

	const registration = createId();
	try {
		storage.setItem(XAPI_SESSION_REGISTRATION_KEY, registration);
	} catch {
		// Storage can be unavailable in restrictive browser modes.
	}
	return registration;
}
