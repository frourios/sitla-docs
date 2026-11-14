# Docs for SITLA

https://sitla.frourio.com

This public repository contains the English SITLA Protocol **v0.4 design draft**:

- [Core](pages/protocol.md): identity, access, evidence and recovery.
- [Account Lifecycle](pages/protocol-lifecycle.md): logout scopes, mandate withdrawal and account deletion states.
- [Account Identifiers](pages/protocol-identifiers.md): automatic DID-independent account identity and optional operator-namespaced handles.
- [Portability and Disaster](pages/protocol-portability.md): local operation, preparedness and degraded assurance.
- [Proof Packages](pages/protocol-packages.md): external specifications, artifact distribution and execution.
- [Marketplace](pages/protocol-marketplace.md): market-defined work and authorized payment handoffs.
- [Wire Artifacts](pages/protocol-wire.md): minimum schemas, canonical records and public vectors.
- [Operator Profile](pages/protocol-operators.md): independent configuration and interoperability requirements.
- [SITLA Deployment](pages/sitla-operator.md): founding-operator values, not conformance requirements.
- [Commercial Model](pages/business-model.md): separate, informational business conditions.

The application repository builds these Markdown sources into static pages through `vp run docs:build`. Relative links between these documents work on GitHub and are rewritten to their published routes during the HTML build. Generated Markdown copies are available alongside the HTML so a working draft does not misrepresent an older Git commit as its current source. Commit this submodule and publish its revision before publishing a parent revision that depends on it.

The protocol specifications are **CC0-1.0**. Anyone may implement, adapt and redistribute them commercially without permission or attribution. See [licensing scope](LICENSING.md) and [full license](LICENSE-CC0-1.0.txt). Software, legal policies, operator conditions and brand assets are outside that dedication. Shared protocol identifiers remain fixed; deployment origins, authorities, operational policies and fees are operator-specific.

Implementation assets: [CC0 schemas and vectors](artifacts/wire-v1/), [Apache-2.0 byte reference](reference/README.md), [trademark policy](TRADEMARKS.md), and [royalty-free specification patent grant](PATENTS.md).

The word “draft” describes technical maturity, not repository visibility or confidentiality. Hosting visibility is controlled separately by the repository owner. Publicly accessible copies may be reused under their stated licenses. Publishing this draft does not mean that all proposed service features are deployed. The terms/privacy documents are complete operator policies, not stub protocol examples; the application’s hardcoded `/commercial` disclosure is maintained outside this repository.

## Verify this repository independently

Use Node.js 26: `npm ci --ignore-scripts`, then `npm test`, `npm run test:mutation` and `npm run secretlint`. For the independent Python verifier, use Python 3.12, install `tests/requirements.txt` in a virtual environment, and run `python tests/verify_vectors.py`. CI runs both implementations on pushes and pull requests without the application repository. The stable wire/1 fixture set covers request hashes, DID documents, replacement/revocation chains, signed approvals/service assertions and schema/semantic/signature rejection layers. Python also reproduces the frozen v0.1 and legacy v0.2 DID/signatures. The document revision is 0.4; it is independent from `sitla-wire/1` and `SITLA/root/1`.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes, including its license allocation, contributor patent grant and sign-off requirements. A passing fixture suite is not a claim of a production wallet, complete standardization or full DIDComm interoperability.

The frozen core set has 8 schemas, 18 positive, 60 negative and 7 malformed-wire fixtures, including browser-shaped ES256 approval assertions. Targeted guard-removal tests detect 32 mutations. See [RELEASING.md](RELEASING.md) for wire compatibility, patent-version review, sign-offs and publication steps.

CI installs Python verification dependencies from `tests/requirements.lock` with `--require-hashes --only-binary=:all:`. The lock includes official PyPI wheel hashes for every pinned dependency; `tests/requirements.txt` is the readable version list. Regenerate and review hashes when changing dependency versions.

The recommended `sitla-account/1` profile automatically binds an immutable account URI to its current DID without a custom name. Optional `sitla-account-handle/1` credentials add memorable public addresses without changing the base identity. The former combined `sitla-account-id/1` artifacts remain unchanged for explicit legacy support. Subject/transition tests do not issue signed VCs or implement a uniqueness registry; accepted securing/status adapters and operator authority are still required.

`sitla-account-lifecycle/1` adds request/receipt schemas, synthetic signed examples and static freshness/binding tests. It specifies scope, deletion progress and retention exceptions; the reference does not execute logout, revoke a real grant or erase data. Existing wire/1 and account-profile bytes are unchanged.

## Verified scope and remaining gaps

“Independent verification” refers to the repository's Node/TypeScript and Python implementations, not an external audit or third-party Rust/Go implementation. No third-party Rust/Go reproduction has been performed by this project. Both implementations verify the original wire/1 set and the separate [synced-passkey supplement](artifacts/wire-v1/vectors/passkey-synced.json) (3 positive records, 3 signed semantic negatives, including BE=BS=1 and counter 0→0).

Python now also checks the three account subject schemas (6 unsigned examples and identifier/transition negatives) and the lifecycle schemas (7 synthetic signed cases plus binding, freshness, scope, retention and signature-tampering negatives). `tests/verify_profiles.py` is invoked by `tests/verify_vectors.py` in the existing CI command; it imports no TypeScript. This coverage does not issue/verify complete account VCs, test a live uniqueness registry, execute real deletion or settlement, validate cross-operator migration or certify hardware/browser behavior. Independent tests for other optional protocol profiles remain out of scope.

Account URIs remain operator-bound. Long-lived qualifications should use holder-controlled roots as subjects and account URIs only as auxiliary claims when possible; v0.4 defines no interoperable cross-operator migration credential. Export is not automatic transfer of issuer acceptance.
