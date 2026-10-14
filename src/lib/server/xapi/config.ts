import type { StatementConfig } from '../../xapi/statements';

export interface XapiServerConfig extends StatementConfig {
	endpoint: string | null;
	username: string | null;
	password: string | null;
}

type Environment = Record<string, string | undefined>;

function optionalValue(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export function resolveXapiServerConfig(environment: Environment): XapiServerConfig {
	return {
		endpoint: optionalValue(environment.XAPI_LRS_ENDPOINT),
		username: optionalValue(environment.XAPI_LRS_USERNAME),
		password: optionalValue(environment.XAPI_LRS_PASSWORD),
		activityBaseUrl:
			optionalValue(environment.XAPI_ACTIVITY_BASE_URL)?.replace(/\/+$/, '') ??
			'https://buri.io/xapi/ice-breaker'
	};
}
