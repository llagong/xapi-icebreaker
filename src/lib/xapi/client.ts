import type { XapiGameEvent } from './events';

let deliveryQueue: Promise<void> = Promise.resolve();

async function sendEvent(event: XapiGameEvent): Promise<void> {
	try {
		await fetch('/api/xapi', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(event)
		});
	} catch {
		// Tracking must never interrupt the game when the server or LRS is unavailable.
	}
}

export function emitXapiEvent(event: XapiGameEvent): Promise<void> {
	const task = deliveryQueue.then(() => sendEvent(event));
	deliveryQueue = task.catch(() => undefined);
	return task;
}
