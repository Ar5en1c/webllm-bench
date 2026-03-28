# Live Usage Counter Setup (Optional)

This project can show live counters in the header:
- `Users (24h)`
- `Runs (24h)`

Counters are **off by default**. No tracking runs unless you configure an endpoint.

## 1) Client config

Add this block before `bench.js` is loaded in `bench.html`:

```html
<script>
  window.WEBLLM_BENCH_ANALYTICS = {
    endpoint: "https://YOUR-ANALYTICS-ENDPOINT",
    siteId: "webllm-bench",
    apiKey: "YOUR_PUBLIC_OR_SERVER_VALIDATED_KEY"
  };
</script>
```

Contract expected by the client:
- `POST {endpoint}/event`
- `GET {endpoint}/stats?site_id=webllm-bench`

## 2) Event payload sent by client

```json
{
  "site_id": "webllm-bench",
  "event_name": "visit|benchmark_run|compare_run|sweep_run",
  "ts": "2026-03-28T23:00:00.000Z",
  "session_id": "sess_*",
  "installation_id": "inst_*",
  "page": "/bench.html",
  "platform": "MacIntel",
  "user_agent": "Mozilla/..."
}
```

## 3) Stats response expected by client

```json
{
  "site_id": "webllm-bench",
  "unique_users_24h": 123,
  "benchmark_runs_24h": 456
}
```

The client accepts fallbacks:
- `visits_24h` instead of `unique_users_24h`
- `runs_24h` instead of `benchmark_runs_24h`

## 4) Privacy defaults (recommended)

- Do not store IP addresses.
- Do not store full raw user-agent strings beyond short retention.
- Use random installation/session IDs only.
- Publish this as aggregate product telemetry only.

## 5) Supabase reference implementation

Use any backend you want. For Supabase, create:
- table: `bench_telemetry_events`
- endpoint/function with two routes:
  - `POST /event` -> insert event
  - `GET /stats?site_id=...` -> aggregate 24h users/runs

Reference files in this repo:
- [`ops/analytics/supabase/schema.sql`](../ops/analytics/supabase/schema.sql)
- [`ops/analytics/supabase/edge-function.ts`](../ops/analytics/supabase/edge-function.ts)

You can also front this with your own `youxai.app` API route and keep DB credentials server-side.
