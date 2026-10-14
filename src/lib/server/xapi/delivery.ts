import XAPI, { type Statement, type StatementsResponse } from '@xapi/xapi';
import type { XapiServerConfig } from './config';

interface DeliveryResult {
	status: 'demo' | 'delivered' | 'error';
	statementIds: string[];
	error?: string;
}

interface StatementSender {
	sendStatement(params: { statement: Statement }): PromiseLike<{ data: string[] }>;
}

interface StatementReader {
	getStatements(params: {
		activity: string;
		related_activities: true;
		limit: number;
	}): PromiseLike<{ data: StatementsResponse }>;
	getMoreStatements(params: { more: string }): PromiseLike<{ data: StatementsResponse }>;
}

type StatementSenderFactory = (config: XapiServerConfig) => StatementSender;

function createStatementSender(config: XapiServerConfig): StatementSender {
	if (!config.endpoint) throw new Error('An LRS endpoint is required.');

	const auth =
		config.username && config.password
			? XAPI.toBasicAuth(config.username, config.password)
			: undefined;
	return new XAPI({ endpoint: config.endpoint, auth });
}

function createStatementReader(config: XapiServerConfig): StatementReader {
	if (!config.endpoint) throw new Error('An LRS endpoint is required.');

	const auth =
		config.username && config.password
			? XAPI.toBasicAuth(config.username, config.password)
			: undefined;
	const client = new XAPI({ endpoint: config.endpoint, auth });
	return {
		getStatements: async (params) => {
			const response = await client.getStatements(params);
			return { data: response.data };
		},
		getMoreStatements: async (params) => {
			const response = await client.getMoreStatements(params);
			return { data: Array.isArray(response.data) ? response.data[0] : response.data };
		}
	};
}

function messageFromError(error: unknown): string {
	if (error instanceof Error && error.message.trim()) return error.message;
	return 'The LRS request failed.';
}

export async function deliverStatement(
	statement: Statement,
	config: XapiServerConfig,
	createSender: StatementSenderFactory = createStatementSender
): Promise<DeliveryResult> {
	if (!config.endpoint) return { status: 'demo', statementIds: [] };

	try {
		const response = await createSender(config).sendStatement({ statement });
		return { status: 'delivered', statementIds: response.data };
	} catch (error) {
		return { status: 'error', statementIds: [], error: messageFromError(error) };
	}
}

export async function readStatements(
	config: XapiServerConfig,
	createReader: (config: XapiServerConfig) => StatementReader = createStatementReader
): Promise<Statement[]> {
	if (!config.endpoint) return [];

	const reader = createReader(config);
	let response = await reader.getStatements({
		activity: `${config.activityBaseUrl}/game`,
		related_activities: true,
		limit: 100
	});
	const statements = [...response.data.statements];
	const visitedPages = new Set<string>();

	while (response.data.more && !visitedPages.has(response.data.more)) {
		visitedPages.add(response.data.more);
		response = await reader.getMoreStatements({ more: response.data.more });
		statements.push(...response.data.statements);
	}

	return statements;
}
