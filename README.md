# xAPI Ice Breaker

A browser-based ice-breaking game that sends gameplay statements to a remote xAPI Learning Record Store (LRS).

## Remote LRS integration

The browser sends game events to the SvelteKit server at `/api/xapi`. The server creates the xAPI statement and delivers it to the configured remote LRS with `@xapi/xapi`, keeping the LRS credentials out of the browser bundle.

Set these environment variables where the SvelteKit server is deployed:

```sh
XAPI_LRS_ENDPOINT=https://your-lrs.example/xapi/
XAPI_LRS_USERNAME=your-key-or-username
XAPI_LRS_PASSWORD=your-secret
XAPI_ACTIVITY_BASE_URL=https://buri.io/xapi/ice-breaker
```

`XAPI_LRS_ENDPOINT` must be the provider's xAPI endpoint, not its dashboard URL. Basic authentication is added when both username and password are set. No local LRS is required.

When configured, game events are delivered to the remote LRS. The `/xapi-stream` page reads related statements back from the LRS in its server load. It does not use browser storage as a statement cache. If delivery fails, the API reports the error and gameplay continues uninterrupted.

Each arena load creates a new registration and a stable pseudonymous actor for that session. The actor uses an xAPI account identifier under `https://buri.io`; all statements in the session share that actor and registration.

### Statistics page

`/xapi-stats` reads all paginated Ice Breaker statements from the remote LRS and presents hourly activity as a line graph alongside player, ice-break, and hammer-upgrade totals. The graph covers complete local days from 00:00 through 23:00 and fills inactive hours with zero values. It also groups players by their latest observed hammer and lists the pseudonymous users at every level.

Hourly buckets use UTC. Players are counted by their xAPI inverse functional identifier, preferring the actor account used by this application.

## Run the application

```sh
npm install
npm run dev
```

The application uses the remote LRS configured in `.env` during development or the deployment environment variables in production. It does not start or require a local LRS.

## Quality checks

```sh
npm run lint
npm run check
npm test
npm run build
```

## xAPI events

| Game event      | Verb                                              |
| --------------- | ------------------------------------------------- |
| Game started    | `http://adlnet.gov/expapi/verbs/launched`         |
| Ice tapped      | `https://buri.io/xapi/ice-breaker/verbs/tapped`   |
| Ice broken      | `https://buri.io/xapi/ice-breaker/verbs/broken`   |
| Hammer upgraded | `https://buri.io/xapi/ice-breaker/verbs/upgraded` |

See [XAPI_STATEMENT_EXAMPLES.md](./XAPI_STATEMENT_EXAMPLES.md) for complete statement examples.
