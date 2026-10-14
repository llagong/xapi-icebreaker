import { describe, expect, it } from 'vitest';
import type { XapiGameEvent } from './events';
import { buildSessionActor, buildStatement, type StatementConfig } from './statements';

const config: StatementConfig = {
	activityBaseUrl: 'https://example.com/activities/ice-breaker/'
};

const eventBase = {
	registration: '8cb1b606-4eb0-4e23-beda-51f967ded708',
	timestamp: '2026-10-08T08:00:00.000Z'
};

function expectStatementEnvelope(event: XapiGameEvent) {
	const statement = buildStatement(event, config);
	expect(statement.id).toMatch(/^[0-9a-f-]{36}$/);
	expect(statement.actor).toMatchObject({
		objectType: 'Agent',
		account: {
			homePage: 'https://buri.io',
			name: `ice-breaker-${eventBase.registration}`
		}
	});
	expect(statement.context?.registration).toBe(eventBase.registration);
	expect(statement.timestamp).toBe(eventBase.timestamp);
	expect(statement.object).toMatchObject({ objectType: 'Activity' });
	return statement;
}

describe('xAPI statement mapping', () => {
	it('creates a stable pseudonymous actor for each game session', () => {
		const firstActor = buildSessionActor(eventBase.registration);
		const repeatedActor = buildSessionActor(eventBase.registration);
		const otherActor = buildSessionActor('f59032d8-9e27-49e4-bacd-8d7948be8046');

		expect(repeatedActor).toEqual(firstActor);
		expect(otherActor.account.name).not.toBe(firstActor.account.name);
		expect(firstActor.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-F0-9]{4}$/);
	});

	it('maps a game start to a launched statement', () => {
		const statement = expectStatementEnvelope({
			...eventBase,
			type: 'game-started',
			hammerName: 'Iron Breaker'
		});
		expect(statement.verb.id).toBe('http://adlnet.gov/expapi/verbs/launched');
		expect(statement.object).toMatchObject({
			id: 'https://example.com/activities/ice-breaker/game'
		});
		expect(statement.result?.extensions).toMatchObject({
			'https://example.com/activities/ice-breaker/extensions/hammer-name': 'Iron Breaker'
		});
	});

	it('maps an ice tap with a unique ice activity, hammer, and hit number', () => {
		const statement = expectStatementEnvelope({
			...eventBase,
			type: 'ice-tapped',
			iceId: 'ice-123',
			hammerName: 'Stone Cracker',
			hitNumber: 3
		});
		expect(statement.verb.id).toBe('https://example.com/activities/ice-breaker/verbs/tapped');
		expect(statement.object).toMatchObject({
			id: 'https://example.com/activities/ice-breaker/ice/ice-123'
		});
		expect(statement.result?.extensions).toMatchObject({
			'https://example.com/activities/ice-breaker/extensions/hammer-name': 'Stone Cracker',
			'https://example.com/activities/ice-breaker/extensions/hit-number': 3
		});
	});

	it('maps an ice break with points, duration, hammer, and hit count', () => {
		const statement = expectStatementEnvelope({
			...eventBase,
			type: 'ice-broken',
			iceId: 'ice-456',
			hammerName: 'Iron Breaker',
			points: 43,
			durationMs: 825,
			hitCount: 3
		});
		expect(statement.verb.id).toBe('https://example.com/activities/ice-breaker/verbs/broken');
		expect(statement.result).toMatchObject({
			completion: true,
			duration: 'PT0.825S',
			score: { raw: 43, min: 10 }
		});
		expect(statement.result?.extensions).toMatchObject({
			'https://example.com/activities/ice-breaker/extensions/hammer-name': 'Iron Breaker',
			'https://example.com/activities/ice-breaker/extensions/hit-count': 3,
			'https://example.com/activities/ice-breaker/extensions/break-duration-ms': 825
		});
	});

	it('maps an upgrade with the old and new hammer, price, and remaining points', () => {
		const statement = expectStatementEnvelope({
			...eventBase,
			type: 'hammer-upgraded',
			previousHammer: 'Wooden Mallet',
			newHammer: 'Stone Cracker',
			cost: 50,
			remainingPoints: 12
		});
		expect(statement.verb.id).toBe('https://example.com/activities/ice-breaker/verbs/upgraded');
		expect(statement.object).toMatchObject({
			id: 'https://example.com/activities/ice-breaker/hammer/stone-cracker'
		});
		expect(statement.result?.extensions).toMatchObject({
			'https://example.com/activities/ice-breaker/extensions/previous-hammer': 'Wooden Mallet',
			'https://example.com/activities/ice-breaker/extensions/new-hammer': 'Stone Cracker',
			'https://example.com/activities/ice-breaker/extensions/upgrade-cost': 50,
			'https://example.com/activities/ice-breaker/extensions/remaining-points': 12
		});
	});
});
