# Tool inputs

## `search_plans`

| Argument | Rule |
| --- | --- |
| `destination` | Required nonempty string, at most 100 characters. |
| `days` | Integer, 1–365. |
| `min_data_mb` | Integer, 1–1048576. |
| `data_mode` | `total` (default) or `daily`. Daily mode requires both `days` and `min_data_mb`. |
| `limit` | Integer, 1–20; default 10. |

For example, a synthetic request for 5 GB total over 7 days in Japan is `{"destination":"Japan","days":7,"min_data_mb":5120,"data_mode":"total","limit":5}`. This is an input example, not a product or price claim.

## `compare_trip_options`

- `stops`: 2–10 entries in travel order. Each entry requires `destination` (same length bounds), `days` (1–365), and `min_data_mb` (1–1048576).
- `data_mode`: `total` (default) or `daily`; it applies to the whole request.
- Total trip duration is at most 365 days, with at least two distinct resolved countries.
- Preserve repeat-country visits. Local-plan validity spans from the country's first visit through its last visit, including time spent elsewhere between visits.
- Daily mode means the supplied data requirement is per day; total mode means total data for each stop.

For example, `{"stops":[{"destination":"Japan","days":4,"min_data_mb":2048},{"destination":"South Korea","days":3,"min_data_mb":1024}],"data_mode":"total"}` is a synthetic itinerary, not a catalog result.

## Schema snapshot

[tools.json](tools.json) is the public input-schema snapshot shipped with this skill. Discover the live tool definitions before calling; if they differ, use the discovered supported inputs and report the mismatch for maintenance.
