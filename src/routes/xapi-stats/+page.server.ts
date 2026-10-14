import {
	XAPI_ACTIVITY_BASE_URL,
	XAPI_LRS_ENDPOINT,
	XAPI_LRS_PASSWORD,
	XAPI_LRS_USERNAME
} from '$app/env/private';
import { resolveXapiServerConfig } from '../../lib/server/xapi/config';
import { readStatements } from '../../lib/server/xapi/delivery';
import { aggregateXapiStats } from '../../lib/xapi/stats';
import type { PageServerLoad } from './$types';

const environment = {
	XAPI_LRS_ENDPOINT,
	XAPI_LRS_USERNAME,
	XAPI_LRS_PASSWORD,
	XAPI_ACTIVITY_BASE_URL
};

function parseUtcOffset(value: string | null): number {
	const offset = Number(value);
	return Number.isInteger(offset) && offset >= -720 && offset <= 840 ? offset : 0;
}

export const load: PageServerLoad = async ({ url }) => {
	const config = resolveXapiServerConfig(environment);
	const utcOffsetMinutes = parseUtcOffset(url.searchParams.get('utcOffset'));
	if (!config.endpoint) {
		return {
			mode: 'demo' as const,
			stats: aggregateXapiStats([], utcOffsetMinutes),
			utcOffsetMinutes,
			error: null
		};
	}

	try {
		const statements = await readStatements(config);
		return {
			mode: 'live' as const,
			stats: aggregateXapiStats(statements, utcOffsetMinutes),
			utcOffsetMinutes,
			error: null
		};
	} catch (error) {
		return {
			mode: 'live' as const,
			stats: aggregateXapiStats([], utcOffsetMinutes),
			utcOffsetMinutes,
			error: error instanceof Error ? error.message : 'Unable to calculate xAPI statistics.'
		};
	}
};
