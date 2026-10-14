import type { Statement } from '@xapi/xapi';
import { describe, expect, it } from 'vitest';
import { formatStatementSummary, toStatementRecords } from './records';

function statement(id: string, verbId: string): Statement {
	return {
		id,
		actor: {
			objectType: 'Agent',
			account: { homePage: 'https://buri.io', name: 'ice-breaker-session' }
		},
		verb: { id: verbId },
		object: { objectType: 'Activity', id: 'https://buri.io/xapi/ice-breaker/game' },
		stored: '2026-10-14T03:15:00.000Z'
	};
}

describe('LRS statement records', () => {
	it('maps Ice Breaker statements returned by the LRS', () => {
		const records = toStatementRecords([
			statement('launch-id', 'http://adlnet.gov/expapi/verbs/launched'),
			statement('tap-id', 'https://buri.io/xapi/ice-breaker/verbs/tapped'),
			statement('break-id', 'https://buri.io/xapi/ice-breaker/verbs/broken'),
			statement('upgrade-id', 'https://buri.io/xapi/ice-breaker/verbs/upgraded')
		]);

		expect(records.map((record) => record.eventType)).toEqual([
			'game-started',
			'ice-tapped',
			'ice-broken',
			'hammer-upgraded'
		]);
		expect(records[0]).toMatchObject({
			id: 'launch-id',
			recordedAt: '2026-10-14T03:15:00.000Z'
		});
	});

	it('ignores unrelated or incomplete statements', () => {
		const unrelated = statement('other-id', 'https://example.com/verbs/other');
		const withoutId = {
			...statement('unused', 'http://adlnet.gov/expapi/verbs/launched'),
			id: undefined
		};

		expect(toStatementRecords([unrelated, withoutId])).toEqual([]);
	});

	it('formats records as actor-action-object sentences', () => {
		const [record] = toStatementRecords([
			{
				...statement('break-id', 'https://buri.io/xapi/ice-breaker/verbs/broken'),
				actor: {
					objectType: 'Agent',
					name: 'Frosty Seal 28E9',
					account: { homePage: 'https://buri.io', name: 'ice-breaker-session' }
				}
			}
		]);

		expect(formatStatementSummary(record)).toBe('Frosty Seal 28E9 broke the ice');
	});
});
