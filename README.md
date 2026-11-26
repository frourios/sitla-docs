# Docs for SITLA

https://sitla.frourio.com

This public repository contains the English SITLA Protocol **v0.13 design draft**:

- [Credential Direct Messages](pages/protocol-dm.md): opt-in DID inboxes, original signatures, delivery receipts and email notification without work or payment.
- [Online MCP circulation](pages/protocol-online.md): standard MCP/OAuth, public issuer DIDs, complete signed VCs, private vault and external trust-reference publication.
- [Core](pages/protocol.md): identity, access, evidence, fresh accounts after key loss and external continuity.
- [Media References](pages/protocol-media.md): external URLs, content integrity and optional hosting; no media store is required.
- [Account Lifecycle](pages/protocol-lifecycle.md): logout scopes, mandate withdrawal and account deletion states.
- [Account Identifiers](pages/protocol-identifiers.md): automatic DID-independent account identity.
- [Portability and Disaster](pages/protocol-portability.md): local operation, preparedness and degraded assurance.
- [Proof Packages](pages/protocol-packages.md): external specifications, artifact distribution and execution.
- [Collection Agency](pages/protocol-collection-agency.md): seller receipt authority across paid profiles and work payments, capture-time price debt discharge and prospective withdrawal.
- [Conditional Payment Instructions](pages/protocol-conditional-payments.md): bilateral deposit, acceptance, refund and settlement VCs; captured-charge/deferred-transfer adapter and fixed expiry refunds.
- [Stripe Japan Adapter](pages/protocol-stripe-jp.md): optional provider/currency binding, provider limits and connected-seller payment entry.
- [Public Payment Wire Artifacts](pages/protocol-payment-wire.md): online schemas, signed assertions and evidence pages with Node/Python checks.
- [Portable Payment Records](pages/protocol-payments.md): operator-signed financial facts for both parties and independently usable evidence exports.
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

Use Node.js 26: `npm ci --ignore-scripts`, then `npm test`, `npm run test:mutation` and `npm run secretlint`. For the independent Python verifier, use Python 3.12, install `tests/requirements.txt` in a virtual environment, and run `python tests/verify_vectors.py` and `python tests/verify_sd_jwt.py`. CI runs both implementations on pushes and pull requests without the application repository. The stable wire/1 fixture set covers request hashes, DID documents, replacement/revocation chains, signed approvals/service assertions and schema/semantic/signature rejection layers. Python also reproduces the frozen v0.1 and legacy v0.2 DID/signatures. The document revision is 0.13; it is independent from `sitla-wire/1` and `SITLA/root/1`.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes, including its license allocation, contributor patent grant and sign-off requirements. A passing fixture suite is not a claim of a production wallet, complete standardization or full DIDComm interoperability.

The frozen core set has 8 schemas, 18 positive, 60 negative and 7 malformed-wire fixtures, including browser-shaped ES256 approval assertions. Targeted guard-removal tests detect 42 mutations (32 core/WebAuthn, 3 payment, 3 historical SD-JWT, 1 export and 3 whole-VC policy guards). See [RELEASING.md](RELEASING.md) for wire compatibility, patent-version review, sign-offs and publication steps.

CI installs Python verification dependencies from `tests/requirements.lock` with `--require-hashes --only-binary=:all:`. The lock includes official PyPI wheel hashes for every pinned dependency; `tests/requirements.txt` is the readable version list. Regenerate and review hashes when changing dependency versions.

The recommended `sitla-account/1` profile automatically binds an immutable account URI to its current DID without a custom name. The retired `sitla-account-handle/1` artifacts remain historical verification fixtures only; current deployments provide no public aliases. The former combined `sitla-account-id/1` artifacts remain unchanged for explicit legacy support. Subject/transition tests do not issue signed VCs or implement a uniqueness registry; accepted securing/status adapters and operator authority are still required.

`sitla-account-lifecycle/1` adds request/receipt schemas, synthetic signed examples and static freshness/binding tests. It specifies scope, deletion progress and retention exceptions; the reference does not execute logout, revoke a real grant or erase data. Existing wire/1 and account-profile bytes are unchanged.

## Verified scope and remaining gaps

“Independent verification” refers to the repository's Node/TypeScript and Python implementations, not an external audit or third-party Rust/Go implementation. No third-party Rust/Go reproduction has been performed by this project. Both implementations verify the original wire/1 set and the separate [synced-passkey supplement](artifacts/wire-v1/vectors/passkey-synced.json) (3 positive records, 3 signed semantic negatives, including BE=BS=1 and counter 0→0).

Python now also checks the three account subject schemas (6 unsigned examples and identifier/transition negatives) and the lifecycle schemas (7 synthetic signed cases plus binding, freshness, scope, retention and signature-tampering negatives). `tests/verify_profiles.py` is invoked by `tests/verify_vectors.py` in the existing CI command; it imports no TypeScript. This coverage does not issue/verify complete account VCs, test a live uniqueness registry, execute real deletion or settlement, validate cross-operator migration or certify hardware/browser behavior. Payment tests add the scope described below; other optional profiles remain outside independent verification.

Account URIs remain operator-bound. Long-lived qualifications should use holder-controlled roots as subjects and account URIs only as auxiliary claims when possible; v0.13 defines no interoperable cross-operator migration credential. Export is not automatic transfer of issuer acceptance.

Payment operators implement the provider-neutral payment duties. The optional [online payment artifacts](pages/protocol-payment-wire.md) now publish **6 frozen CC0 schemas, 15 signed positive and 35 negative synthetic records, 2 signed evidence pages and 5 bundle negatives**, plus the deferred-destination v2 schema and the separate WebAuthn attachment supplement. Node and independent Python check operator JWS, original Ed25519 holder approvals authorized by ML-DSA roots, reviewed scope/amount/destination, event reconciliation/history and manifest member integrity. CI runs these through the existing commands. No TypeScript or private application is imported by Python. Work-specific schemas remain market-defined.

These fixtures do not reproduce Stripe Sandbox, current provider/account/dispute state, live state-machine execution, live deployment exports, cross-page completeness or a legal opinion. The reference checks listed bytes and historical claims; callers supply issuer trust/status/acceptance policy. The application implements private transaction-scoped binding/dispute summaries through `get_counterparty_payment_history`; they are not a public registry, complete historical record or part of the independent public payment-VC fixtures. Third-party Rust/Go reproduction remains outstanding; do not infer production approval or end-to-end PQC security from fixture success.

The [Online MCP Adapter](pages/protocol-online.md) declares an optional executable online subset and its securing/status conventions. Application Worker, SMTP and Stripe integration tests are maintained in the application repository; they do not extend this repository's independently verified fixture scope.

The current online securing profile is `SITLA-vc-jwt/1`, with signed whole-object license and recipient policy. SD-JWT is refused by the current MCP. Legacy direct-JWS payment fixtures stay frozen and do not certify the new runtime envelope. Independent Python verification of existing wire/account/lifecycle/payment vectors remains distinct from the new selective-disclosure fixture checks. Neither suite certifies an arbitrary wallet or draft-standard conformance.

All new payment paths require seller connection before collection, in both live and Sandbox mode. The former pre-connection collection legal-review gate has been removed along with that flow. See [Stripe Japan](pages/protocol-stripe-jp.md).

The circulation fixture supplement adds 1 positive and 11 rejection cases to the original 2 positive and 4 negative cases. The payment WebAuthn supplement adds 1 positive and 1 signed semantic negative with independently supplied synthetic RP enrollment. The historical SD-JWT export supplement below additionally covers the former SD-JWT serialization; no synthetic fixture proves live enrollment history or runtime export completeness.


### Third-party reproduction milestone

An external implementation should publish its repository revision, language/toolchain version, selected profiles, fixture file digests and positive/negative results. It must independently reproduce canonical bytes, root and holder signature verification, payment semantics, enrollment-bound WebAuthn approval and selective disclosure rather than call the bundled reference or an operator endpoint. Record unsupported profiles and discrepancies separately. Live provider, legal, custody and application-state claims remain out of scope of fixture reproduction. No external Rust/Go implementation or audit is claimed until independently published results are available.


The [historical SD-JWT WebAuthn export vectors](artifacts/payments-v2/sd-jwt-passkey-export.json) add one positive export and five negative exports: invalid manifest signature, missing approval attachment, altered disclosure, substituted VC copy and an issuer-signed amount mismatch against the original passkey approval. The [reference verifier](reference/payment-export.ts) checks manifest member digests, original SD-JWT issuer/disclosures, root-authorized issuer key, payment scope and the WebAuthn approval against independently accepted RP enrollment. Node and Python verify the same bytes independently. Keys embedded in an export alone establish no trust. This covers synthetic historical SD-JWT export verification; live provider execution, enrollment-history availability, status freshness and omitted pages still require deployment checks.

## Internal-use data permission

[SITLAシステム内部利用許諾 1.0](LICENSE-SITLA-INTERNAL-1.0.md) defines the limited permission for private DID documents, email registration credentials and other internal-use records. Identifier: `LicenseRef-SITLA-Internal-1.0`. It follows the service terms and privacy policy and grants no public reuse rights. Public availability and licensing are separate decisions. This document introduces permission wording; automatic runtime assignment is not implemented by adding it.


The current [complete-VC policy vectors](artifacts/circulation-v2/credentials.json) contain 3 signed positive and 14 negative cases, including incompatible licenses, forbidden configuration/public policies, hidden SD-JWT structures, expiry, holder binding and allowlist tampering. The [complete-VC WebAuthn export vectors](artifacts/circulation-v2/passkey-export.json) add 1 positive and 6 negatives. Node and Python independently check signatures, policies, manifests and the passkey approval; neither interprets opaque ciphertext or ZKP payloads. Historical SD-JWT suites remain regression checks only. The current MCP rejects that format.


## TLA+ protocol models

[`formal/README.md`](formal/README.md) maps four bounded state-machine models to conditional payment decisions, uncertain provider effects, collection-authority withdrawal and one-time approval execution. Java 21 and Python 3.10+ run `npm run test:formal` (or `python3 formal/check.py`). The runner verifies a SHA-256-pinned TLC 1.7.4 JAR, exhaustively checks the configured safety/temporal properties, and requires eight guard-removal variants to produce named counterexamples. This repository's CI runs the checker; the parent application's CI tests its implementation separately. These are model results under explicit bounds and environment assumptions, not proofs that application code or a payment provider implements the models.
