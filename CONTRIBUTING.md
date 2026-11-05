# Contributing

## 1. Prepare the change

**Prerequisites:** local checkout, Node.js 24, npm, Python 3.11+, and uv. Review the [MIT license](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md) before contributing or redistributing material.

1. Define the public behavior or documentation error to correct.
2. Read [AGENTS.md](AGENTS.md) for source ownership and task-specific references.
3. Keep the change inside this repository. Use public schemas and synthetic examples, not private backend code, credentials, or customer records.
4. Write all repository documentation and descriptions in English. Maintain one version; do not add translations.

## 2. Implement and verify

1. Install locked dependencies with `npm ci` and `uv sync --locked`.
2. Change the authoritative source. Regenerate derived files with `npm run generate` instead of editing their copies.
3. Add an offline test for changed behavior. Use the official SDK with the loopback fixture for protocol/client changes.
4. Run the applicable checks in [Maintenance](docs/maintenance.md).
5. Check commands, relative links, and native client syntax in changed documentation.

**Expected result:** tests exercise the changed behavior, generated files match their sources, and no test makes an automatic production call. A fixture pass is not evidence that a vendor's application was tested live.

## 3. Prepare the review

Use the [pull request template](.github/pull_request_template.md). State scope, verification, and owner-dependent decisions. Redact logs. Use the issue templates only for non-sensitive bugs and requests; follow [SECURITY.md](SECURITY.md) for vulnerabilities.

Submitting work does not authorize a commit, push, release, Registry entry, deployment, or global client configuration change. Publication requires the separate owner gates in [Publishing](docs/publishing.md).
