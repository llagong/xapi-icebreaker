import type { Statement } from '@xapi/xapi';
import type { XapiGameEvent } from './events';

export interface StatementConfig {
	activityBaseUrl: string;
}

const EN_US = 'en-US' as const;
const ACTOR_ACCOUNT_HOME_PAGE = 'https://buri.io';
const ACTOR_ADJECTIVES = [
	'Brisk',
	'Bright',
	'Cool',
	'Daring',
	'Frosty',
	'Gentle',
	'Glacial',
	'Happy',
	'Icy',
	'Lucky',
	'Polar',
	'Quick',
	'Sparkling',
	'Sunny',
	'Swift',
	'Tropical'
] as const;
const ACTOR_ANIMALS = [
	'Albatross',
	'Bear',
	'Dolphin',
	'Gecko',
	'Heron',
	'Kingfisher',
	'Manta',
	'Narwhal',
	'Otter',
	'Penguin',
	'Puffin',
	'Seal',
	'Shark',
	'Tern',
	'Turtle',
	'Whale'
] as const;

function normalizeBaseUrl(value: string): string {
	return value.replace(/\/+$/, '');
}

function hashSessionId(value: string): number {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function buildSessionActor(registration: string) {
	const hash = hashSessionId(registration);
	const adjective = ACTOR_ADJECTIVES[hash % ACTOR_ADJECTIVES.length];
	const animal = ACTOR_ANIMALS[(hash >>> 8) % ACTOR_ANIMALS.length];
	const sessionTag = registration
		.replace(/[^a-z0-9]/gi, '')
		.slice(0, 4)
		.toUpperCase();

	return {
		objectType: 'Agent' as const,
		name: `${adjective} ${animal} ${sessionTag}`,
		account: {
			homePage: ACTOR_ACCOUNT_HOME_PAGE,
			name: `ice-breaker-${registration}`
		}
	};
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function durationToIso(durationMs: number): string {
	return `PT${(Math.max(0, durationMs) / 1_000).toFixed(3)}S`;
}

export function buildStatement(event: XapiGameEvent, config: StatementConfig): Statement {
	const baseUrl = normalizeBaseUrl(config.activityBaseUrl);
	const actor = buildSessionActor(event.registration);
	const context = {
		registration: event.registration,
		platform: 'Ice Breaker',
		contextActivities: {
			grouping: [{ objectType: 'Activity' as const, id: `${baseUrl}/game` }]
		}
	};
	const statementBase = {
		id: crypto.randomUUID(),
		actor,
		context,
		timestamp: event.timestamp
	};

	switch (event.type) {
		case 'game-started':
			return {
				...statementBase,
				verb: {
					id: 'http://adlnet.gov/expapi/verbs/launched',
					display: { [EN_US]: 'launched' }
				},
				object: {
					objectType: 'Activity',
					id: `${baseUrl}/game`,
					definition: {
						name: { [EN_US]: 'Ice Breaker' },
						description: { [EN_US]: 'A speed-based ice-breaking game.' }
					}
				},
				result: {
					extensions: {
						[`${baseUrl}/extensions/hammer-name`]: event.hammerName
					}
				}
			};
		case 'ice-tapped':
			return {
				...statementBase,
				verb: {
					id: `${baseUrl}/verbs/tapped`,
					display: { [EN_US]: 'tapped' }
				},
				object: {
					objectType: 'Activity',
					id: `${baseUrl}/ice/${event.iceId}`,
					definition: { name: { [EN_US]: 'Ice block' } }
				},
				result: {
					extensions: {
						[`${baseUrl}/extensions/hammer-name`]: event.hammerName,
						[`${baseUrl}/extensions/hit-number`]: event.hitNumber
					}
				}
			};
		case 'ice-broken':
			return {
				...statementBase,
				verb: {
					id: `${baseUrl}/verbs/broken`,
					display: { [EN_US]: 'broke' }
				},
				object: {
					objectType: 'Activity',
					id: `${baseUrl}/ice/${event.iceId}`,
					definition: { name: { [EN_US]: 'Ice block' } }
				},
				result: {
					completion: true,
					duration: durationToIso(event.durationMs),
					score: { raw: event.points, min: 10, scaled: Math.min(1, event.points / 55) },
					extensions: {
						[`${baseUrl}/extensions/hammer-name`]: event.hammerName,
						[`${baseUrl}/extensions/hit-count`]: event.hitCount,
						[`${baseUrl}/extensions/break-duration-ms`]: event.durationMs
					}
				}
			};
		case 'hammer-upgraded':
			return {
				...statementBase,
				verb: {
					id: `${baseUrl}/verbs/upgraded`,
					display: { [EN_US]: 'upgraded' }
				},
				object: {
					objectType: 'Activity',
					id: `${baseUrl}/hammer/${slugify(event.newHammer)}`,
					definition: { name: { [EN_US]: event.newHammer } }
				},
				result: {
					extensions: {
						[`${baseUrl}/extensions/previous-hammer`]: event.previousHammer,
						[`${baseUrl}/extensions/new-hammer`]: event.newHammer,
						[`${baseUrl}/extensions/upgrade-cost`]: event.cost,
						[`${baseUrl}/extensions/remaining-points`]: event.remainingPoints
					}
				}
			};
	}
}
