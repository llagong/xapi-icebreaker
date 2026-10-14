import { describe, expect, it } from 'vitest';
import { resolveXapiServerConfig } from './config';

describe('xAPI server configuration', () => {
	it('uses safe demo defaults without an LRS endpoint', () => {
		expect(resolveXapiServerConfig({})).toEqual({
			endpoint: null,
			username: null,
			password: null,
			activityBaseUrl: 'https://buri.io/xapi/ice-breaker'
		});
	});

	it('normalizes configured values and the activity base URL', () => {
		expect(
			resolveXapiServerConfig({
				XAPI_LRS_ENDPOINT: ' https://lrs.example/xapi/ ',
				XAPI_LRS_USERNAME: 'demo',
				XAPI_LRS_PASSWORD: 'secret',
				XAPI_ACTIVITY_BASE_URL: 'https://activity.example/ice-breaker///'
			})
		).toEqual({
			endpoint: 'https://lrs.example/xapi/',
			username: 'demo',
			password: 'secret',
			activityBaseUrl: 'https://activity.example/ice-breaker'
		});
	});
});
