import type { Statement } from '@xapi/xapi';
import type { XapiGameEvent } from './events';

export interface StatementRecord {
	id: string;
	eventType: XapiGameEvent['type'];
	statement: Statement;
	recordedAt: string;
}

export function formatStatementSummary(record: StatementRecord): string {
	const actorName = record.statement.actor.name ?? 'Player';
	const action = {
		'game-started': 'started the game',
		'ice-tapped': 'tapped the ice',
		'ice-broken': 'broke the ice',
		'hammer-upgraded': 'upgraded the hammer'
	}[record.eventType];

	return `${actorName} ${action}`;
}

function eventTypeFromStatement(statement: Statement): XapiGameEvent['type'] | null {
	if (statement.verb.id === 'http://adlnet.gov/expapi/verbs/launched') return 'game-started';
	if (statement.verb.id.endsWith('/verbs/tapped')) return 'ice-tapped';
	if (statement.verb.id.endsWith('/verbs/broken')) return 'ice-broken';
	if (statement.verb.id.endsWith('/verbs/upgraded')) return 'hammer-upgraded';
	return null;
}

export function toStatementRecords(statements: Statement[]): StatementRecord[] {
	return statements.flatMap((statement) => {
		const eventType = eventTypeFromStatement(statement);
		if (!eventType || !statement.id) return [];

		return [
			{
				id: statement.id,
				eventType,
				statement,
				recordedAt: statement.stored ?? statement.timestamp ?? new Date(0).toISOString()
			}
		];
	});
}
