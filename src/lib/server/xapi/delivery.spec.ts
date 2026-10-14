import { describe, expect, it, vi } from 'vitest';
import type { Statement } from '@xapi/xapi';
import { resolveXapiServerConfig } from './config';
import { deliverStatement, readStatements } from './delivery';

const statement = {
	actor: { objectType: 'Agent', mbox: 'mailto:player@example.com' },
	verb: { id: 'http://adlnet.gov/expapi/verbs/launched' },
	object: { objectType: 'Activity', id: 'https://example.com/game' }
} satisfies Statement;

describe('xAPI delivery', () => {
	it('returns demo status without constructing an LRS client', async () => {
		const createSender = vi.fn();
		await expect(
			deliverStatement(statement, resolveXapiServerConfig({}), createSender)
		).resolves.toEqual({ status: 'demo', statementIds: [] });
		expect(createSender).not.toHaveBeenCalled();
	});

	it('reports successful LRS delivery and returned statement IDs', async () => {
		const createSender = vi.fn(() => ({
			sendStatement: vi.fn().mockResolvedValue({ data: ['statement-123'] })
		}));
		const config = resolveXapiServerConfig({ XAPI_LRS_ENDPOINT: 'https://lrs.example/xapi/' });

		await expect(deliverStatement(statement, config, createSender)).resolves.toEqual({
			status: 'delivered',
			statementIds: ['statement-123']
		});
	});

	it('reports a safe error status when the LRS rejects delivery', async () => {
		const createSender = vi.fn(() => ({
			sendStatement: vi.fn().mockRejectedValue(new Error('LRS unavailable'))
		}));
		const config = resolveXapiServerConfig({ XAPI_LRS_ENDPOINT: 'https://lrs.example/xapi/' });

		await expect(deliverStatement(statement, config, createSender)).resolves.toEqual({
			status: 'error',
			statementIds: [],
			error: 'LRS unavailable'
		});
	});

	it('reads only statements related to the Ice Breaker game activity', async () => {
		const statements = [{ ...statement, id: 'statement-123' }];
		const getStatements = vi.fn().mockResolvedValue({ data: { statements, more: '' } });
		const getMoreStatements = vi.fn();
		const createReader = vi.fn(() => ({ getStatements, getMoreStatements }));
		const config = resolveXapiServerConfig({
			XAPI_LRS_ENDPOINT: 'https://lrs.example/xapi/',
			XAPI_ACTIVITY_BASE_URL: 'https://buri.io/xapi/ice-breaker'
		});

		await expect(readStatements(config, createReader)).resolves.toEqual(statements);
		expect(getStatements).toHaveBeenCalledWith({
			activity: 'https://buri.io/xapi/ice-breaker/game',
			related_activities: true,
			limit: 100
		});
		expect(getMoreStatements).not.toHaveBeenCalled();
	});

	it('reads every page returned by the LRS', async () => {
		const first = { ...statement, id: 'statement-1' };
		const second = { ...statement, id: 'statement-2' };
		const third = { ...statement, id: 'statement-3' };
		const getStatements = vi
			.fn()
			.mockResolvedValue({ data: { statements: [first], more: '/xapi/statements?page=2' } });
		const getMoreStatements = vi
			.fn()
			.mockResolvedValueOnce({
				data: { statements: [second], more: '/xapi/statements?page=3' }
			})
			.mockResolvedValueOnce({ data: { statements: [third], more: '' } });
		const config = resolveXapiServerConfig({ XAPI_LRS_ENDPOINT: 'https://lrs.example/xapi/' });

		await expect(
			readStatements(config, () => ({ getStatements, getMoreStatements }))
		).resolves.toEqual([first, second, third]);
		expect(getMoreStatements).toHaveBeenNthCalledWith(1, {
			more: '/xapi/statements?page=2'
		});
		expect(getMoreStatements).toHaveBeenNthCalledWith(2, {
			more: '/xapi/statements?page=3'
		});
	});

	it('does not construct an LRS reader in demo mode', async () => {
		const createReader = vi.fn();
		await expect(readStatements(resolveXapiServerConfig({}), createReader)).resolves.toEqual([]);
		expect(createReader).not.toHaveBeenCalled();
	});
});
