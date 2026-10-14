export interface XapiEventBase {
	registration: string;
	timestamp: string;
}

export interface GameStartedEvent extends XapiEventBase {
	type: 'game-started';
	hammerName: string;
}

export interface IceTappedEvent extends XapiEventBase {
	type: 'ice-tapped';
	iceId: string;
	hammerName: string;
	hitNumber: number;
}

export interface IceBrokenEvent extends XapiEventBase {
	type: 'ice-broken';
	iceId: string;
	hammerName: string;
	points: number;
	durationMs: number;
	hitCount: number;
}

export interface HammerUpgradedEvent extends XapiEventBase {
	type: 'hammer-upgraded';
	previousHammer: string;
	newHammer: string;
	cost: number;
	remainingPoints: number;
}

export type XapiGameEvent =
	GameStartedEvent | IceTappedEvent | IceBrokenEvent | HammerUpgradedEvent;

export type XapiEventPayload =
	| Omit<GameStartedEvent, keyof XapiEventBase>
	| Omit<IceTappedEvent, keyof XapiEventBase>
	| Omit<IceBrokenEvent, keyof XapiEventBase>
	| Omit<HammerUpgradedEvent, keyof XapiEventBase>;

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
	return Number.isInteger(value) && typeof value === 'number' && value > 0;
}

export function isXapiGameEvent(value: unknown): value is XapiGameEvent {
	if (typeof value !== 'object' || value === null) return false;

	const event = value as Record<string, unknown>;
	if (!isNonEmptyString(event.registration) || !isNonEmptyString(event.timestamp)) return false;

	switch (event.type) {
		case 'game-started':
			return isNonEmptyString(event.hammerName);
		case 'ice-tapped':
			return (
				isNonEmptyString(event.iceId) &&
				isNonEmptyString(event.hammerName) &&
				isPositiveInteger(event.hitNumber)
			);
		case 'ice-broken':
			return (
				isNonEmptyString(event.iceId) &&
				isNonEmptyString(event.hammerName) &&
				isNonNegativeNumber(event.points) &&
				isNonNegativeNumber(event.durationMs) &&
				isPositiveInteger(event.hitCount)
			);
		case 'hammer-upgraded':
			return (
				isNonEmptyString(event.previousHammer) &&
				isNonEmptyString(event.newHammer) &&
				isNonNegativeNumber(event.cost) &&
				isNonNegativeNumber(event.remainingPoints)
			);
		default:
			return false;
	}
}
