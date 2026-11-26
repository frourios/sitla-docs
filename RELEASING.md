# Revising and releasing the specification

The prose revision and wire contract are separate. Record the document revision (currently 0.10) in document metadata and review notes. The stable wire profile is `sitla-wire/1`; cryptographic contexts/domains and subprofile identifiers have their own explicit versions. An editorial release must not modify these values, signed field sets or previously published fixture bytes merely to match a new document number.

Before publication:

1. Classify each change as editorial clarification, a compatible implementation fix, or an incompatible wire/meaning/algorithm change. Re-run frozen vectors. For incompatible changes, define a new wire/subprofile ID and artifact directory, schemas, explicit negotiation and migration policy. Do not relabel old signatures or imply that an editorial release revokes them. Existing records retain their own expiry/status/authority rules.
2. Preserve `artifacts/v0.1/` and legacy `artifacts/v0.2/` byte-for-byte. The current wire/1 fixtures belong in `artifacts/wire-v1/`; preserve published byte contracts when introducing later profiles. Record which prose revisions describe each profile.
3. Update active document metadata, reference links, README and published-site metadata together. Do not insert the prose revision into a signed payload or native context. A policy-resource byte change legitimately changes its own digest; a specification typo fix does not change that resource by implication.
4. Check `PATENTS.md`: its covered specification versions are currently v0.1, v0.2, v0.3, v0.4, v0.5, v0.6, v0.7, v0.8, v0.9 and v0.10. Before a new numbered specification release, extend the explicit version list and confirm the grants for all contributors with normative changes. Keep prior grants in force; do not remove older versions. A stable wire ID is not a patent license. Recheck the CC0/Apache scope and provenance/sign-offs in `CONTRIBUTING.md`.
5. Run `npm ci --ignore-scripts`, `npm test`, `npm run test:mutation`, `npm run secretlint` and the independent Python verifier with `tests/requirements.txt`. Confirm that expected semantic-failure signatures still verify and that positive and adversarial policy/request/approval byte identities remain reproducible. Additional mutation coverage is welcome; report its limits.
6. Submit PR commits with matching author `Signed-off-by` trailers. PR CI verifies each commit. Review the entire change; a sign-off is a rights certification, not a security audit. Do not rewrite unrelated authors' commits or silently sign on their behalf.
7. Check repository/site visibility, all local/public artifact links, rendered legal/operator pages and the implementation-status statements. Draft denotes technical maturity, not secrecy. Publish the docs revision before updating an application submodule reference. Release, deployment and repository-visibility changes require their own operator authorization.

The reference's supported JSON DID representation is `application/did+json`, not JSON-LD. A future JSON-LD or different WebAuthn algorithm/extension adapter must be explicitly profiled and tested; do not hide a representation/algorithm change inside an editorial release.

CI installs Python verification dependencies from `tests/requirements.lock` with `--require-hashes --only-binary=:all:`. The lock includes official PyPI wheel hashes for every pinned dependency; `tests/requirements.txt` is the readable version list. Regenerate and review hashes when changing dependency versions.

Document revision 0.10 describes `sitla-wire/1` and the account and lifecycle profiles linked from Core. Existing wire identifiers, signature contexts and fixture bytes are retained; v0.10 does not relabel legacy v0.1/v0.2 records or change their validity.
