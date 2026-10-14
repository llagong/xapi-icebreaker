import {
	XAPI_ACTIVITY_BASE_URL,
	XAPI_LRS_ENDPOINT,
	XAPI_LRS_PASSWORD,
	XAPI_LRS_USERNAME
} from '$app/env/private';
import { resolveXapiServerConfig } from '../../../lib/server/xapi/config';
import { deliverStatement } from '../../../lib/server/xapi/delivery';
import { isXapiGameEvent } from '../../../lib/xapi/events';
import { buildStatement } from '../../../lib/xapi/statements';
import type { RequestHandler } from './$types';

const environment = {
	XAPI_LRS_ENDPOINT,
	XAPI_LRS_USERNAME,
	XAPI_LRS_PASSWORD,
	XAPI_ACTIVITY_BASE_URL
};

export const POST: RequestHandler = async ({ request }) => {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return Response.json({ message: 'Request body must be valid JSON.' }, { status: 400 });
	}

	if (!isXapiGameEvent(payload)) {
		return Response.json(
			{ message: 'Request body is not a valid Ice Breaker event.' },
			{ status: 400 }
		);
	}

	const config = resolveXapiServerConfig(environment);
	const statement = buildStatement(payload, config);
	const delivery = await deliverStatement(statement, config);

	return Response.json(
		{ statement, ...delivery },
		{ status: delivery.status === 'error' ? 502 : 200 }
	);
};
