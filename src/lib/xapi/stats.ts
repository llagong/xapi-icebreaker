import type { Actor, Statement } from '@xapi/xapi';
import { HAMMERS } from '../game/config';

export interface HourlyActivity {
	hour: string;
	count: number;
}

export interface XapiStats {
	activityPerHour: HourlyActivity[];
	players: number;
	iceBroken: number;
	hammerUpgrades: number;
	hammerProgress: HammerProgress[];
}

export interface HammerProgress {
	level: number;
	hammer: string;
	accent: string;
	count: number;
	players: string[];
}

function actorKey(actor: Actor): string | null {
	if ('account' in actor && actor.account)
		return `account:${actor.account.homePage}:${actor.account.name}`;
	if ('mbox' in actor && actor.mbox) return `mbox:${actor.mbox}`;
	if ('mbox_sha1sum' in actor && actor.mbox_sha1sum) return `mbox_sha1sum:${actor.mbox_sha1sum}`;
	if ('openid' in actor && actor.openid) return `openid:${actor.openid}`;
	return actor.name ? `name:${actor.name}` : null;
}

function hourBucket(statement: Statement, utcOffsetMinutes: number): string | null {
	const timestamp = statement.timestamp ?? statement.stored;
	if (!timestamp) return null;
	const offsetMs = utcOffsetMinutes * 60 * 1_000;
	const date = new Date(new Date(timestamp).getTime() + offsetMs);
	if (Number.isNaN(date.getTime())) return null;
	date.setUTCMinutes(0, 0, 0);
	return new Date(date.getTime() - offsetMs).toISOString();
}

function statementTime(statement: Statement): number {
	const timestamp = statement.timestamp ?? statement.stored;
	if (!timestamp) return Number.NEGATIVE_INFINITY;
	const time = new Date(timestamp).getTime();
	return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function extensionValue(statement: Statement, suffix: string): string | null {
	const entry = Object.entries(statement.result?.extensions ?? {}).find(([key]) =>
		key.endsWith(suffix)
	);
	return typeof entry?.[1] === 'string' ? entry[1] : null;
}

function hammerFromStatement(statement: Statement): string | null {
	return (
		extensionValue(statement, '/extensions/new-hammer') ??
		extensionValue(statement, '/extensions/hammer-name')
	);
}

function completeDayRange(
	hourlyCounts: Map<string, number>,
	utcOffsetMinutes: number
): HourlyActivity[] {
	const observedHours = [...hourlyCounts.keys()].sort();
	if (observedHours.length === 0) return [];

	const offsetMs = utcOffsetMinutes * 60 * 1_000;
	const firstHour = new Date(new Date(observedHours[0]).getTime() + offsetMs);
	const lastHour = new Date(new Date(observedHours.at(-1)!).getTime() + offsetMs);
	firstHour.setUTCHours(0, 0, 0, 0);
	lastHour.setUTCHours(23, 0, 0, 0);
	const firstTimestamp = firstHour.getTime() - offsetMs;
	const lastTimestamp = lastHour.getTime() - offsetMs;

	const activity: HourlyActivity[] = [];
	for (let timestamp = firstTimestamp; timestamp <= lastTimestamp; timestamp += 60 * 60 * 1_000) {
		const hour = new Date(timestamp).toISOString();
		activity.push({ hour, count: hourlyCounts.get(hour) ?? 0 });
	}
	return activity;
}

export function aggregateXapiStats(statements: Statement[], utcOffsetMinutes = 0): XapiStats {
	const players = new Set<string>();
	const playerProgress = new Map<string, { name: string; hammer: string; observedAt: number }>();
	const hourlyCounts = new Map<string, number>();
	let iceBroken = 0;
	let hammerUpgrades = 0;

	for (const statement of statements) {
		const player = actorKey(statement.actor);
		if (player) {
			players.add(player);
			const observedAt = statementTime(statement);
			const existing = playerProgress.get(player);
			const observedHammer = hammerFromStatement(statement);
			if (!existing) {
				playerProgress.set(player, {
					name: statement.actor.name ?? 'Player',
					hammer: observedHammer ?? HAMMERS[0].name,
					observedAt
				});
			} else if (observedHammer && observedAt >= existing.observedAt) {
				existing.hammer = observedHammer;
				existing.observedAt = observedAt;
			}
		}

		const hour = hourBucket(statement, utcOffsetMinutes);
		if (hour) hourlyCounts.set(hour, (hourlyCounts.get(hour) ?? 0) + 1);

		if (statement.verb.id.endsWith('/verbs/broken')) iceBroken += 1;
		if (statement.verb.id.endsWith('/verbs/upgraded')) hammerUpgrades += 1;
	}

	return {
		activityPerHour: completeDayRange(hourlyCounts, utcOffsetMinutes),
		players: players.size,
		iceBroken,
		hammerUpgrades,
		hammerProgress: HAMMERS.map((hammer) => {
			const names = [...playerProgress.values()]
				.filter((player) => player.hammer === hammer.name)
				.map((player) => player.name)
				.sort((first, second) => first.localeCompare(second));
			return {
				level: hammer.level,
				hammer: hammer.name,
				accent: hammer.accent,
				count: names.length,
				players: names
			};
		})
	};
}
