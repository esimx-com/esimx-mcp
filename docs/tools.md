# Tool reference

## 1. Select the operation

The service exposes two read-only tools. Neither creates an order, reserves inventory, buys a plan, or accesses an account. The exact input contract is [schemas/tools.json](../schemas/tools.json); unknown properties are rejected.

| Tool | Use |
| --- | --- |
| `search_plans` | Find qualifying public catalog plans for one destination. |
| `compare_trip_options` | Compare one whole-trip plan with one local plan per country for an ordered itinerary. |

Before calling either tool, collect the destination, days, and data requirement needed for the request. Ask whether the data amount is total or per day. Do not infer a daily requirement from a total amount.

## 2. Search plans

| Argument | Requirement |
| --- | --- |
| `destination` | Required nonblank string, 1–100 characters. A country/area code, slug, or name can resolve a destination. |
| `days` | Optional integer, 1–365. Require enough validity for this duration. |
| `min_data_mb` | Optional integer, 1–1,048,576 MB. Its meaning follows `data_mode`. |
| `data_mode` | `total` by default; or `daily`. Daily mode requires both `days` and `min_data_mb`. |
| `limit` | Integer, 1–20; default 10. |

Example arguments, not a production price claim:

```json
{
  "destination": "Japan",
  "days": 7,
  "min_data_mb": 5120,
  "data_mode": "total",
  "limit": 5
}
```

1. Call `search_plans` with the agreed criteria.
2. If `status` is `needs_clarification`, present the returned candidates and ask the user to choose. Repeat with the chosen code.
3. If `status` is `ok`, present the supplied plan names, prices, validity, allowance type, and known restrictions. Use returned product URLs only.
4. If `status` is `no_match`, ask which constraint the user wants to change. Do not silently reduce days or data.

**Expected result:** qualifying catalog plans sorted by ascending USD price. `matched_count`, `returned_count`, and `truncated` distinguish all matches from the returned subset. Search is not proof of live inventory.

A total allowance can meet a daily request when it covers the full `days × min_data_mb` requirement. A daily allowance is evaluated as daily data, not an interchangeable whole-trip pool. Unlimited plans can qualify, but high-speed quota and fair-use limits may be unknown.

## 3. Compare a trip

| Argument | Requirement |
| --- | --- |
| `stops` | Required array of 2–10 stops in travel order. |
| `stops[].destination` | Required nonblank country string, 1–100 characters. |
| `stops[].days` | Required integer, 1–365. Combined trip duration must not exceed 365 days. |
| `stops[].min_data_mb` | Required integer, 1–1,048,576 MB. |
| `data_mode` | `total` by default; or `daily`, applied to every stop. |

At least two distinct resolved countries are required. A region is not a substitute for a country stop. Repeated visits are allowed; keep them in their original order.

```json
{
  "stops": [
    {"destination": "Japan", "days": 4, "min_data_mb": 3072},
    {"destination": "South Korea", "days": 3, "min_data_mb": 2048}
  ],
  "data_mode": "total"
}
```

1. Call `compare_trip_options` with all stops.
2. Resolve any destination ambiguity before choosing an option. `stop_index` is zero-based.
3. Check each option's `available` field. Recommend only a complete option.
4. Show the recommended option, installation count, total USD cost, supplied links, and unresolved plan rules.
5. If no complete option exists, explain the returned missing countries or reasons. Do not present a partial local-plan subtotal as a complete trip price.

**Expected result:** `single_plan` covers every country for the whole trip; `local_plans` uses one qualifying local plan per distinct country. A repeated country's validity spans its first arrival through its last departure, including intervening visits elsewhere. Data needs are combined per country. In daily mode, total-plan checks use the summed daily requirements and daily-plan checks use the applicable maximum daily requirement.

When both options qualify, the lower catalog total is recommended. A price tie favors one plan to reduce installations. See [Data interpretation](data.md) for the price-difference sign and null handling.

## 4. Handle an unsuccessful result

- `destination_not_found`: ask for a different name or a known code.
- `needs_clarification`: use the supplied candidates; do not choose by guesswork.
- `no_match`: no qualifying complete result under the current criteria.
- `catalog_empty`: the public catalog has no usable entries for this response; do not replace it with invented offers.
- `isError: true`: read the error payload. Correct `invalid_arguments`; report `catalog_unavailable` without turning it into a no-match result.
- HTTP 429: honor `Retry-After`; use bounded behavior as described in [Protocol](protocol.md).
