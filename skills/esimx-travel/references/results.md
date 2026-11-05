# Result rules

## Catalog scope and units

Results cover the eSIMX catalog, not live supplier inventory or a market-wide lowest-price search. Preserve `status`, `checked_at`, and returned notes where relevant. Use `structuredContent` when supplied; text content also carries the result. Treat `isError: true` as failure.

Prices are USD integer cents (`price_usd_cents` or `total_price_usd_cents`). Divide by 100 only for display. Zero is a valid price. Preserve null as unknown or unavailable; never replace it with zero. Data uses 1024 MB = 1 GB.

## Search

`plans` contains the returned shortlist. `matched_count`, `returned_count`, and `truncated` explain whether more matches exist. An ambiguous destination includes `candidates`; obtain a selection before continuing. A returned plan includes validity, allowance type, coverage, and public `product_url` where available.

## Trip comparison

`options` contains `single_plan` and `local_plans`. An option is complete only when `available` is true. An unavailable local option may still contain partial plans: do not present those plans as covering the whole trip. Preserve `unavailable_reasons` and `missing_country_codes`.

`recommended_option` and `reason_code` carry the catalog recommendation. `price_difference_usd_cents` equals local plans minus the single plan. A positive number means the single plan costs less; a negative number means local plans cost less. It is null when either option is unavailable. A tie may favor fewer installations; zero is not missing.

## Conditions and links

Keep unknown `tethering`, `throttle_speed`, `activation_type`, and `activation_desc` unknown. Unlimited data may have fair-use or speed limits; it does not establish unlimited high-speed data. Buying or installing early does not establish whole-trip validity: purchase, installation, or first-connection start rules can differ.

Use only the response's `product_url`; if absent, state that no product link was supplied. Do not construct checkout or affiliate URLs or claim that a plan has been purchased or activated.
