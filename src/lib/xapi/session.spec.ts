import { describe, expect, it, vi } from 'vitest';
import {
	getOrCreateSessionRegistration,
	XAPI_SESSION_REGISTRATION_KEY,
	type SessionStorage
} from './session';

const existingRegistration = '8cb1b606-4eb0-4e23-beda-51f967ded708';
const newRegistration = 'f59032d8-9e27-49e4-bacd-8d7948be8046';

function storage(initialValue: string | null = null): SessionStorage & { value: string | null } {
	return {
		value: initialValue,
		getItem(key) {
			expect(key).toBe(XAPI_SESSION_REGISTRATION_KEY);
			return this.value;
		},
		setItem(key, value) {
			expect(key).toBe(XAPI_SESSION_REGISTRATION_KEY);
			this.value = value;
		}
	};
}

describe('xAPI browser session', () => {
	it('reuses the registration stored for the current browser session', () => {
		const createId = vi.fn(() => newRegistration);

		expect(getOrCreateSessionRegistration(storage(existingRegistration), createId)).toBe(
			existingRegistration
		);
		expect(createId).not.toHaveBeenCalled();
	});

	it('creates and stores a registration when the session has none', () => {
		const target = storage();

		expect(getOrCreateSessionRegistration(target, () => newRegistration)).toBe(newRegistration);
		expect(target.value).toBe(newRegistration);
	});

	it('replaces malformed session data', () => {
		const target = storage('not-a-registration');

		expect(getOrCreateSessionRegistration(target, () => newRegistration)).toBe(newRegistration);
		expect(target.value).toBe(newRegistration);
	});

	it('falls back to a generated registration when storage is unavailable', () => {
		const unavailable: SessionStorage = {
			getItem() {
				throw new Error('unavailable');
			},
			setItem() {
				throw new Error('unavailable');
			}
		};

		expect(getOrCreateSessionRegistration(unavailable, () => newRegistration)).toBe(
			newRegistration
		);
	});
});
