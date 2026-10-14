import {
	XAPI_ACTIVITY_BASE_URL,
	XAPI_LRS_ENDPOINT,
	XAPI_LRS_PASSWORD,
	XAPI_LRS_USERNAME
} from '$app/env/private';
import { resolveXapiServerConfig } from '../../lib/server/xapi/config';
import { readStatements } from '../../lib/server/xapi/delivery';
import { toStatementRecords } from '../../lib/xapi/records';
import type { PageServerLoad } from './$types';

const environment = {
	XAPI_LRS_ENDPOINT,
	XAPI_LRS_USERNAME,
	XAPI_LRS_PASSWORD,
	XAPI_ACTIVITY_BASE_URL
};

export const load: PageServerLoad = async () => {
	const config = resolveXapiServerConfig(environment);
	if (!config.endpoint) return { mode: 'demo' as const, records: [], error: null };

	try {
		const statements = await readStatements(config);
		return { mode: 'live' as const, records: toStatementRecords(statements), error: null };
	} catch (error) {
		return {
			mode: 'live' as const,
			records: [],
			error: error instanceof Error ? error.message : 'Unable to read statements from the LRS.'
		};
	}
};
