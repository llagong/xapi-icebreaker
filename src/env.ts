import { defineEnvVars } from '@sveltejs/kit/env';

const optionalString = (value: string | undefined) => value;

export const variables = defineEnvVars({
	XAPI_LRS_ENDPOINT: { schema: optionalString },
	XAPI_LRS_USERNAME: { schema: optionalString },
	XAPI_LRS_PASSWORD: { schema: optionalString },
	XAPI_ACTIVITY_BASE_URL: { schema: optionalString }
});
