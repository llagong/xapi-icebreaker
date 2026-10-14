import type { Statement } from '@xapi/xapi';
import { describe, expect, it } from 'vitest';
import { aggregateXapiStats } from './stats';

function statement(
	id: string,
	actorName: string,
	verb: 'tapped' | 'broken' | 'upgraded',
	timestamp: string,
	hammer = 'Wooden Mallet'
): Statement {
	return {
		id,
		actor: {
			objectType: 'Agent',
			name: actorName,
			account: { homePage: 'https://buri.io', name: actorName.toLowerCase().replaceAll(' ', '-') }
		},
		verb: { id: `https://buri.io/xapi/ice-breaker/verbs/${verb}` },
		object: { objectType: 'Activity', id: 'https://buri.io/xapi/ice-breaker/game' },
		result: {
			extensions: {
				[`https://buri.io/xapi/ice-breaker/extensions/${verb === 'upgraded' ? 'new-hammer' : 'hammer-name'}`]:
					hammer
			}
		},
		timestamp
	};
}

describe('xAPI statistics', () => {
	it('aggregates hourly activity, unique players, breaks, and upgrades', () => {
		const statements = [
			statement('1', 'Player One', 'tapped', '2026-10-14T02:55:00.000Z'),
			statement('2', 'Player One', 'broken', '2026-10-14T03:05:00.000Z'),
			statement('3', 'Player Two', 'broken', '2026-10-14T03:45:00.000Z', 'Iron Breaker'),
			statement('4', 'Player Two', 'upgraded', '2026-10-14T04:00:00.000Z', 'Frost Smasher')
		];

		const stats = aggregateXapiStats(statements);
		expect(stats).toMatchObject({
			players: 2,
			iceBroken: 2,
			hammerUpgrades: 1,
			hammerProgress: [
				{
					level: 0,
					hammer: 'Wooden Mallet',
					accent: '#f5b968',
					count: 1,
					players: ['Player One']
				},
				{
					level: 1,
					hammer: 'Stone Cracker',
					accent: '#b9c6d4',
					count: 0,
					players: []
				},
				{
					level: 2,
					hammer: 'Iron Breaker',
					accent: '#f18762',
					count: 0,
					players: []
				},
				{
					level: 3,
					hammer: 'Frost Smasher',
					accent: '#56d6e9',
					count: 1,
					players: ['Player Two']
				},
				{
					level: 4,
					hammer: 'Thunder Hammer',
					accent: '#ffd166',
					count: 0,
					players: []
				}
			]
		});
		expect(stats.activityPerHour).toHaveLength(24);
		expect(stats.activityPerHour[0]).toEqual({
			hour: '2026-10-14T00:00:00.000Z',
			count: 0
		});
		expect(stats.activityPerHour.slice(2, 5)).toEqual([
			{ hour: '2026-10-14T02:00:00.000Z', count: 1 },
			{ hour: '2026-10-14T03:00:00.000Z', count: 2 },
			{ hour: '2026-10-14T04:00:00.000Z', count: 1 }
		]);
		expect(stats.activityPerHour.at(-1)).toEqual({
			hour: '2026-10-14T23:00:00.000Z',
			count: 0
		});
	});

	it('covers every hour across whole start and end days', () => {
		const stats = aggregateXapiStats([
			statement('1', 'Player One', 'tapped', '2026-10-14T22:00:00.000Z'),
			statement('2', 'Player One', 'broken', '2026-10-15T01:00:00.000Z')
		]);

		expect(stats.activityPerHour).toHaveLength(48);
		expect(stats.activityPerHour[0].hour).toBe('2026-10-14T00:00:00.000Z');
		expect(stats.activityPerHour.at(-1)?.hour).toBe('2026-10-15T23:00:00.000Z');
	});

	it('uses the viewer offset for local day boundaries', () => {
		const stats = aggregateXapiStats(
			[statement('1', 'Player One', 'tapped', '2026-10-14T18:30:00.000Z')],
			8 * 60
		);

		expect(stats.activityPerHour).toHaveLength(24);
		expect(stats.activityPerHour[0].hour).toBe('2026-10-14T16:00:00.000Z');
		expect(stats.activityPerHour[2]).toEqual({
			hour: '2026-10-14T18:00:00.000Z',
			count: 1
		});
		expect(stats.activityPerHour.at(-1)?.hour).toBe('2026-10-15T15:00:00.000Z');
	});

	it('ignores invalid or missing timestamps in the hourly series', () => {
		const invalid = statement('1', 'Player One', 'tapped', 'not-a-date');
		const missing = { ...statement('2', 'Player Two', 'broken', '2026-10-14T03:00:00Z') };
		delete missing.timestamp;

		expect(aggregateXapiStats([invalid, missing])).toEqual({
			activityPerHour: [],
			players: 2,
			iceBroken: 1,
			hammerUpgrades: 0,
			hammerProgress: [
				{
					level: 0,
					hammer: 'Wooden Mallet',
					accent: '#f5b968',
					count: 2,
					players: ['Player One', 'Player Two']
				},
				{
					level: 1,
					hammer: 'Stone Cracker',
					accent: '#b9c6d4',
					count: 0,
					players: []
				},
				{
					level: 2,
					hammer: 'Iron Breaker',
					accent: '#f18762',
					count: 0,
					players: []
				},
				{
					level: 3,
					hammer: 'Frost Smasher',
					accent: '#56d6e9',
					count: 0,
					players: []
				},
				{
					level: 4,
					hammer: 'Thunder Hammer',
					accent: '#ffd166',
					count: 0,
					players: []
				}
			]
		});
	});

	it('uses the latest observed hammer when statements are out of order', () => {
		const stats = aggregateXapiStats([
			statement('new', 'Player One', 'broken', '2026-10-14T05:00:00.000Z', 'Iron Breaker'),
			statement('old', 'Player One', 'tapped', '2026-10-14T03:00:00.000Z', 'Wooden Mallet')
		]);

		expect(
			stats.hammerProgress.find((progress) => progress.hammer === 'Iron Breaker')
		).toMatchObject({
			count: 1,
			players: ['Player One']
		});
	});
});
