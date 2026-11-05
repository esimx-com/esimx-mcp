# Publishing procedure

## 1. Define the release target

**Warning:** local checks do not authorize a commit, push, public release, Registry submission, domain change, deployment, or user-wide client installation. Obtain approval for the exact revision and destination before that action.

The delivered project is usable locally. The remaining publication inputs are separate:

| Target | Required input |
| --- | --- |
| Repository or source release | Canonical source: https://github.com/esimx-com/esimx-mcp. MIT is approved; retain the license and third-party notices. A tagged release remains a separate action. |
| Private vulnerability reporting | A verified private reporting route. Do not invent an email or direct sensitive reports into public issues. |
| Claude plugin/marketplace | The known eSIMX brand is the author/owner. No personal maintainer is required for local use. Public listing claims need separate approval. |
| MCP Registry | Actual ownership proof for the proposed `com.esimx` namespace, followed by explicit submission authorization. |
| Glama | Real GitHub repository and approved GitHub maintainer usernames. A brand name is not a GitHub login. |

Keep unknown values null or empty in `project.json`. `com.esimx/mcp` is a proposed domain-based name, not proof of control or an existing registration. No automated publication-blocker flags are needed to use native packages locally.

## 2. Set local metadata

1. To regenerate metadata for the canonical repository, run:

   ```sh
   npm run metadata -- --repository https://github.com/esimx-com/esimx-mcp
   ```

   For a fork, replace the URL deliberately. This changes `project.json` and generated local metadata only. It does not change a git remote or contact a directory.
2. Enter only approved GitHub usernames in `project.json`'s `maintainers` array. For a GitHub repository, generation emits `glama.json` only when this array is nonempty. Until then, `configs/glama.template.json` is a template, not a submission.
3. Enter an approved private `securityContact` and update `SECURITY.md` with the actual reporting procedure. Do not advertise an unverified contact.
4. MIT is the approved project license. Keep `project.json`, `package.json`, the root entry in `package-lock.json`, `pyproject.toml`, and `LICENSE` consistent. Retain the separate third-party terms in [Third-party notices](../THIRD_PARTY_NOTICES.md).
5. For a version change, update `project.json`, `package.json`, and `pyproject.toml`, then refresh both lockfiles deliberately. Run `npm run generate`.
6. Run all offline checks and strict plugin validation in [Maintenance](maintenance.md). Review the exact files and any nonblocking listing advisories.

**Expected result:** native manifests, source metadata, and versions agree. `server.json` describes the existing remote service only. Do not add npm/PyPI server packages or Docker deployment just to fill a listing shape.

## 3. Prepare and publish a source release

The manual `release.yml` workflow runs offline checks and uploads a source archive and `SHA256SUMS`. It has read-only repository permissions. Artifact access follows the repository and GitHub Actions permissions; do not treat an artifact in a public repository as confidential. It does **not** create a tag, GitHub release, Registry entry, or marketplace listing.

1. After an authorized remote repository exists and the reviewed revision is on its default branch, open **Actions > Prepare release archive > Run workflow**.
2. Select the default branch. Enter the exact `project.json` version and `PREPARE`.
3. Download the `esimx-mcp-release` workflow artifact. Check the recorded commit and verify its checksum with `sha256sum -c SHA256SUMS` on Linux or `shasum -a 256 -c SHA256SUMS` on macOS.
4. Inspect the archive. It must include source, native packages, docs, schemas, examples, tests, and lockfiles. It must exclude `.local/`, credentials, dependency directories, build output, and private backend files.
5. Only with separate release authorization, create a tag for that exact reviewed commit and create a **draft** release in the repository's Releases UI. Attach the verified archive/checksum and reviewed release notes. Do not call the draft a public release.
6. Review the destination, version, rights, and content. Publish the draft only with approval for public release.
7. Read back the release and download its files. Confirm their checksums and record the actual release URL in the changelog.

**Corrective action:** stop if the revision, license, or artifact content is wrong. Fix and verify a new preparation run; do not edit an unreviewed archive manually.

## 4. Publish the remote Registry entry

This route is manual by design. The repository contains no Registry credentials or unverified publisher installation job.

1. Read the [official Registry documentation](https://github.com/modelcontextprotocol/registry/tree/main/docs) and [remote-server format](https://modelcontextprotocol.io/registry/remote-servers). Confirm the current domain-proof procedure and publisher flags for the selected exact version.
2. Use the real domain `esimx.com` only after its owner approves DNS or HTTP ownership verification. Follow the current documented key-generation and proof procedure. Keep its private key outside the repository and logs. A GitHub OIDC login cannot prove this domain namespace.
3. Obtain an exact official publisher release. The official workflow example pins `v1.8.1` and verifies a Sigstore bundle before extraction. An authorized operator can use this verification sequence in a new empty download directory, with a separately trusted `cosign` installation:

   ```sh
   version=v1.8.1
   os=$(uname -s | tr '[:upper:]' '[:lower:]')
   arch=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
   archive="mcp-publisher_${os}_${arch}.tar.gz"
   base="https://github.com/modelcontextprotocol/registry/releases/download/$version"
   curl --fail --location --output "$archive" "$base/$archive"
   curl --fail --location --output "$archive.sigstore.json" "$base/$archive.sigstore.json"
   cosign verify-blob \
     --bundle "$archive.sigstore.json" \
     --certificate-identity "https://github.com/modelcontextprotocol/registry/.github/workflows/release.yml@refs/tags/$version" \
     --certificate-oidc-issuer https://token.actions.githubusercontent.com \
     "$archive" &&
     tar xzf "$archive" mcp-publisher
   ```

   Stop if verification fails. Review compatibility before changing the version; do not substitute a mutable `latest` URL or trust a checksum fetched from an unrelated source. Use only the verified binary, and do not execute code from the download directory.
4. From a separate trusted working directory, inspect that binary's `--help` and `login --help`. Follow the current DNS or HTTP proof instructions. The official DNS login form is `mcp-publisher login dns --domain esimx.com --private-key KEY`; supply the approved key securely, with shell tracing off. Do not put literal keys in documentation or workflow files.
5. From the reviewed repository root, inspect `server.json` against its declared schema and the publisher's supported validation procedure. Confirm `name`, version, repository, and the single `streamable-http` remote. No extra auth header is required by the service.
6. Only after explicit authorization for the real Registry, invoke the verified binary's documented `publish` command from that root. Stop on failure; do not repeatedly resubmit or switch namespaces to bypass proof.
7. Read back the public entry through the Registry UI/API. Confirm the exact namespace, version, repository, endpoint, and transport. Record the real entry URL. Registry submission does not publish this repository to npm or PyPI.

Reference: [official verified publisher workflow](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/github-actions.mdx). A namespace proof change is an owner operation, not part of local generation.

## 5. Distribute client packages and listings

- **Claude Code:** distribute the complete repository as the marketplace source. `./plugins/esimx` resolves from its root. A manifest-only URL does not deliver sibling plugin files. Use the canonical source `esimx-com/esimx-mcp`; the exact install commands are in the [Claude Code guide](clients/claude-code.md). A public listing may also require an approved icon and production privacy-policy URL, which are not invented by this project.
- **Gemini CLI:** distribute the repository containing `gemini-extension.json`, `GEMINI.md`, and skill references. It uses `httpUrl`. Authorize repository/extension-directory publication separately.
- **ChatGPT and Claude hosted connectors:** users configure the remote endpoint through their product UI. This is not upload or approval of the Claude Code package. See the respective [ChatGPT](clients/chatgpt.md) and [Claude](clients/claude-desktop.md) guides.
- **Glama:** generate `glama.json` only with the real approved GitHub maintainer usernames. Follow the directory's current submission procedure after repository publication. The template is not a listed badge or approval claim.

For any later credential-bearing CI publication job, create a protected environment first. Restrict refs to reviewed release/default-branch code, require a trusted human reviewer, and store credentials only as environment secrets. An `environment:` name alone does not create those protections. Never execute untrusted PR code with publication credentials.
