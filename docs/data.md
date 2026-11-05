# Data interpretation

## 1. Keep the scope clear

Results describe the public eSIMX catalog at `checked_at`. They are not supplier inventory, a reservation, or a market-wide lowest-price guarantee. The common fields are `status`, `scope` (`esimx_catalog`), `currency` (`USD`), `checked_at`, and `notes`. Preserve the notes when presenting a recommendation.

## 2. Read plan fields

| Fields | Meaning |
| --- | --- |
| `package_id`, `package_code`, `package_name` | Public plan identifiers and display name. Keep identifiers as returned. |
| `area_code`, `area_slug`, `area_name` | Catalog area associated with the plan. |
| `price_usd_cents`, `price_usd`, `currency` | Integer USD cents, formatted USD amount, and currency. Use cents for arithmetic. |
| `validity_days` | Catalog validity. It does not by itself establish the activation start time. |
| `allowance_type` | `total`, `daily`, `unlimited`, or `unknown`. |
| `total_data_mb`, `daily_data_mb` | Data amount for the stated allowance type. An inapplicable field can be null. |
| `coverage_country_codes` | Countries advertised for the plan. |
| `throttle_speed`, `tethering` | Known restrictions or capabilities. Null/unknown is not a promise. |
| `billing_type`, `activation_type`, `activation_desc`, `additional_desc` | Supplied catalog rules and explanatory text. Do not fill missing rules from assumptions. |
| `product_url` | Supplied public product link, or null if unavailable. Do not synthesize a replacement purchase URL. |

1024 MB equals 1 GB. A 5120 MB requirement is 5 GB. An unlimited allowance is not a guarantee of unlimited full-speed data. Fair use and throttling may apply; high-speed quota can remain unknown.

Prices of zero are valid values. Null means unknown, unavailable, or not applicable according to the field; it is not zero. Avoid truthiness tests such as `price || fallback` when zero has meaning.

## 3. Read comparison fields

- `stops` preserves travel order, resolved destinations, days, data amounts, and inclusive `start_day`/`end_day` positions.
- `total_days` is the sum of all stop durations.
- `options` contains `single_plan` and `local_plans`.
- Each option has `available`, `plans`, `installation_count`, `total_price_usd_cents`, `total_price_usd`, `unavailable_reasons`, and `missing_country_codes`.
- Each option's plan entry includes the plan, covered `country_codes`, and inclusive trip-day span.
- `recommended_option` is an option name or null. `reason_code` explains the selection.

Reason codes include `lowest_catalog_price`, `same_price_fewer_installations`, `only_complete_option`, and `no_complete_option`. Unavailable-option reasons include `no_qualifying_whole_trip_plan` and `missing_local_plan`.

```text
price_difference_usd_cents = local_plans total − single_plan total
```

- Positive: the single plan is cheaper by that amount.
- Negative: local plans are cheaper by the absolute amount.
- Zero: the totals are equal.
- Null: at least one complete option is unavailable; a price difference cannot be stated.

Unavailable local options may still contain some matching plan entries. Their total is null, not a complete-trip subtotal. Use `available`, not array length or price truthiness, to decide whether an option is complete.

## 4. Present a safe recommendation

1. State the destination, duration, data mode, and catalog scope.
2. Display a known price as USD with two decimal places. Preserve null and zero in program output.
3. State unknown activation, tethering, or throttle information explicitly where it affects the decision.
4. Use the supplied link only. If it is null, explain that a product link is unavailable.
5. Ask the traveler to verify the plan rules before purchase. Early purchase or installation does not guarantee whole-trip coverage; the start rule may depend on purchase, installation, or first connection.

**Expected result:** the recommendation is traceable to returned data. No missing field becomes an invented benefit or purchase instruction.
