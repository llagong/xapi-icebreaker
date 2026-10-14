# Ice Breaker xAPI Statement Examples

These examples use the safe values from `.env.example`. Each game session gets a pseudonymous actor derived from its registration. The actor remains stable for that session and changes with the next session. Statement IDs, registrations, actor names, ice IDs, timestamps, durations, scores, and hammer details will vary at runtime.

## Game started

```json
{
	"id": "2a6d1407-cc73-4b7e-badb-361518f05363",
	"actor": {
		"objectType": "Agent",
		"name": "Sparkling Heron 8CB1",
		"account": {
			"homePage": "https://buri.io",
			"name": "ice-breaker-8cb1b606-4eb0-4e23-beda-51f967ded708"
		}
	},
	"verb": {
		"id": "http://adlnet.gov/expapi/verbs/launched",
		"display": { "en-US": "launched" }
	},
	"object": {
		"objectType": "Activity",
		"id": "https://buri.io/xapi/ice-breaker/game",
		"definition": {
			"name": { "en-US": "Ice Breaker" },
			"description": { "en-US": "A speed-based ice-breaking game." }
		}
	},
	"result": {
		"extensions": {
			"https://buri.io/xapi/ice-breaker/extensions/hammer-name": "Wooden Mallet"
		}
	},
	"context": {
		"registration": "8cb1b606-4eb0-4e23-beda-51f967ded708",
		"platform": "Ice Breaker"
	},
	"timestamp": "2026-10-08T08:00:00.000Z"
}
```

## Ice tapped

```json
{
	"id": "84cbf7fd-834d-4811-914c-0eef9dad5373",
	"actor": {
		"objectType": "Agent",
		"name": "Sparkling Heron 8CB1",
		"account": {
			"homePage": "https://buri.io",
			"name": "ice-breaker-8cb1b606-4eb0-4e23-beda-51f967ded708"
		}
	},
	"verb": {
		"id": "https://buri.io/xapi/ice-breaker/verbs/tapped",
		"display": { "en-US": "tapped" }
	},
	"object": {
		"objectType": "Activity",
		"id": "https://buri.io/xapi/ice-breaker/ice/ice-123",
		"definition": { "name": { "en-US": "Ice block" } }
	},
	"result": {
		"extensions": {
			"https://buri.io/xapi/ice-breaker/extensions/hammer-name": "Wooden Mallet",
			"https://buri.io/xapi/ice-breaker/extensions/hit-number": 3
		}
	},
	"context": {
		"registration": "8cb1b606-4eb0-4e23-beda-51f967ded708",
		"platform": "Ice Breaker"
	},
	"timestamp": "2026-10-08T08:00:00.120Z"
}
```

## Ice broken

```json
{
	"id": "f9591a23-56e7-4406-baf2-27591d1f1129",
	"actor": {
		"objectType": "Agent",
		"name": "Sparkling Heron 8CB1",
		"account": {
			"homePage": "https://buri.io",
			"name": "ice-breaker-8cb1b606-4eb0-4e23-beda-51f967ded708"
		}
	},
	"verb": {
		"id": "https://buri.io/xapi/ice-breaker/verbs/broken",
		"display": { "en-US": "broke" }
	},
	"object": {
		"objectType": "Activity",
		"id": "https://buri.io/xapi/ice-breaker/ice/ice-123",
		"definition": { "name": { "en-US": "Ice block" } }
	},
	"result": {
		"completion": true,
		"duration": "PT0.280S",
		"score": {
			"raw": 44,
			"min": 10,
			"scaled": 0.8
		},
		"extensions": {
			"https://buri.io/xapi/ice-breaker/extensions/hammer-name": "Wooden Mallet",
			"https://buri.io/xapi/ice-breaker/extensions/hit-count": 5,
			"https://buri.io/xapi/ice-breaker/extensions/break-duration-ms": 280
		}
	},
	"context": {
		"registration": "8cb1b606-4eb0-4e23-beda-51f967ded708",
		"platform": "Ice Breaker"
	},
	"timestamp": "2026-10-08T08:00:00.280Z"
}
```

## Hammer upgraded

```json
{
	"id": "5683aa59-18c7-4d1b-b28f-7fd691375e37",
	"actor": {
		"objectType": "Agent",
		"name": "Sparkling Heron 8CB1",
		"account": {
			"homePage": "https://buri.io",
			"name": "ice-breaker-8cb1b606-4eb0-4e23-beda-51f967ded708"
		}
	},
	"verb": {
		"id": "https://buri.io/xapi/ice-breaker/verbs/upgraded",
		"display": { "en-US": "upgraded" }
	},
	"object": {
		"objectType": "Activity",
		"id": "https://buri.io/xapi/ice-breaker/hammer/stone-cracker",
		"definition": { "name": { "en-US": "Stone Cracker" } }
	},
	"result": {
		"extensions": {
			"https://buri.io/xapi/ice-breaker/extensions/previous-hammer": "Wooden Mallet",
			"https://buri.io/xapi/ice-breaker/extensions/new-hammer": "Stone Cracker",
			"https://buri.io/xapi/ice-breaker/extensions/upgrade-cost": 50,
			"https://buri.io/xapi/ice-breaker/extensions/remaining-points": 12
		}
	},
	"context": {
		"registration": "8cb1b606-4eb0-4e23-beda-51f967ded708",
		"platform": "Ice Breaker"
	},
	"timestamp": "2026-10-08T08:00:01.000Z"
}
```
