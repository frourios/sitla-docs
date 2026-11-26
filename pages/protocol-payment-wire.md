# Public Payment Wire Artifacts

**SITLA Protocol v0.16 — optional online binding `sitla-payments-online/1`**\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)

**Compatibility boundary:** the `payments-v1` securing vectors below are a frozen legacy direct-JWS fixture profile. Current online issuance uses [SITLA-vc-jwt/1](protocol-online.md), operator DID issuers and complete payment subject claims. Business subject fields/meaning remain applicable, but the legacy securing wrapper and export-envelope assertions are not the runtime complete-VC encoding. Do not relabel or regenerate historical signatures. See the whole-VC circulation profile for the current securing layer; frozen payment fixtures independently test legacy semantics.

## 1. Scope

*Independent implementations can reproduce signed payment assertions without the private application.*

These artifacts bind the provider-neutral [payment-record duties](protocol-payments.md), [collection authority](protocol-collection-agency.md) and [conditional instructions](protocol-conditional-payments.md) to the current [Stripe Japan online adapter](protocol-stripe-jp.md). This supplemental profile does not alter frozen `sitla-wire/1` bytes, root derivation or signature contexts. Work, delivery, milestone, evaluation and qualification VC schemas remain market-defined. Other providers publish a separately identified binding rather than substituting meanings into these Stripe/JPY records.

| Public schema | Purpose |
| --- | --- |
| [CollectionAuthorization subject](../artifacts/payments-v1/schemas/collection-authorization.schema.json) | Historical profile/work seller receipt grant (new grants are work-only), scope, destination/mode, fee/refund policy and original approval digest |
| [Deferred collection authorization v2](../artifacts/payments-v2/schemas/collection-authorization.schema.json) | Explicitly unassigned destination; schema only, not provider approval |
| [Conditional instruction subject](../artifacts/payments-v1/schemas/conditional-instruction.schema.json) | Transaction-specific collection authorization, deposit, acceptance, refund and settlement; settlement requires inspection and performance digest |
| [Payment-event subject](../artifacts/payments-v1/schemas/payment-event.schema.json) | Allocation-scoped historical provider/operator observation with amounts, role, stage, confirmation, predecessor and optional collection fact |
| [Online VC](../artifacts/payments-v1/schemas/online-vc.schema.json) | Operator issuer, typed subject, validity and status reference |
| [Export manifest](../artifacts/payments-v1/schemas/export-manifest.schema.json) | Signed page scope, record/attachment digests, key/schema digests, observed statuses and pagination |
| [Evidence bundle](../artifacts/payments-v1/schemas/evidence-bundle.schema.json) | Original records, typed attachments and signed manifest with verification metadata |

**PAY-WIRE-1.** Validate schema and semantic bindings before using these records. Schema validation alone is neither signature verification nor authority. Reject unknown fields in these fixed shapes; a new incompatible claim encoding requires a new binding. Strings and array/resource budgets are explicit; enforce stricter published application budgets as needed. Amounts are safe nonnegative integer minor units, JPY exponent zero. Calendar dates must exist. Check gross = fee + net and per-item sums for each allocation. Do not add aggregate and allocation values twice. Unknown allocation amount is null with the explicit unallocated basis, never a fabricated zero. A provider-confirmed fact names the provider reference; it does not carry a provider signature.

## 2. Original secured bytes

*The operator signature secures its assertion. The holder's original approval supplies separate authority.*

**PAY-WIRE-2.** The `SITLA-online-vc-jws/1` record is `{id, vc, secured, format, digest}`. `secured` is compact JWS with exactly `alg: EdDSA`, the independently accepted operator `kid`, and `typ: vc+jwt`. Its payload is the exact restricted-canonical UTF-8 VC object, **not** JWT registered claims with a nested `vc`. `format` is `application/vc+jwt`; `digest` is lower-case SHA-256 of those canonical VC bytes. The payload includes the published VC 2.0 context and explicit `urn:sitla:online:claims:1:` extension context. Do not interpret this narrow adapter as generic JWT-VC or arbitrary JSON-LD interoperability. Check the credential type against its subject profile, expected issuer/key authority, credential ID/status namespace and original payload copy. Key material embedded in an export is not a trust anchor.

**PAY-WIRE-3.** Approval attachments preserve the original signed wire/1 payload, signature, request, reviewed context, exact policy bytes, arguments, root descriptor and operational grant. Recompute `approval.evidenceDigest`, request/context/policy digests and actor/operation/arguments. Verify the root ML-DSA authorization and the exact permitted assertion method before verifying holder approval. The online grant's declared `sitla-online-account` purpose permits the adapter's enumerated operations; it is not silently reinterpreted as a generic wire/1 per-operation grant. Historical issuance/expiry, provider/account scope, keys, status and execution-time replay/epoch decisions remain separate checks. A wrapper signature alone never proves fresh user consent.

The repository's payment reference verifies the Ed25519 holder path and native ML-DSA root signature. A new [supplemental WebAuthn fixture](../artifacts/payments-v2/passkey-settlement.json) checks the browser-shaped `WebAuthn-P256` attachment and a payment-amount mismatch using the frozen direct-JWS wrapper, with an independently trusted, synthetic RP enrollment record supplied to the verifier. The separate historical SD-JWT export vectors described below cover the serialization path; neither fixture establishes that a live deployment archives all necessary enrollment history.

A conforming independently verifiable payment attachment must preserve or reference an independently accepted RP enrollment record, the credential identifier, authorized P-256 assertion key, RP/origin policy, user-handle binding and pre-assertion counter/backup state. The original browser assertion must bind the exact payment approval payload digest and satisfy the wire/1 WebAuthn checks. Verify all payment amount, parties, deadlines, agreement and predecessor bindings identically to the Ed25519 path. Without the necessary independently accepted enrollment history, report the attachment as unverified; never establish trust from a key merely embedded in the payment export. The public fixtures contain no signing secrets or real user data.

For historical profile grants, check the reviewed offer against profile revision, offer digest, scope, seller, mode/destination and fees. No new profile grants are issued. Check work scope/budget against the accepted review. For instructions, check transaction, parties, amount/currency, agreement, deadlines and predecessor policy; compare settlement inspection and performance digests with the original buyer approval. The static reference does not reconstruct the live deposit/accept/refund state machine or establish that a predecessor was accepted: authentic history and current execution state remain mandatory before any financial effect.

## 3. Payment observations and evidence pages

*Capture, transfer and refund are different facts, even when every signature is valid.*

**PAY-WIRE-4.** Only a provider-confirmed successful `capture` event may carry `collection` with `discharged-on-valid-stripe-capture`. Its amount covers this seller allocation's gross, not the whole cart. Manual authorization, pending refund and seller transfer are not this trigger. Inspect `outcome` and `providerConfirmed` separately. Verify the recipient role/account, allocation scope, item reconciliation, stream sequence, predecessor digest (SHA-256 of the entire prior secured record), and observation order. A refund appends a new fact; it does not make the earlier capture false or authorize another buyer charge.

**PAY-WIRE-5.** Sign restricted-canonical manifest bytes in compact JWS with `typ: sitla-export+jws`, `alg: EdDSA` and the independently accepted operator key. Manifest record digests hash each entire secured record object, not only its VC; attachment digests hash `{kind, reference, document}`. `schemaDigest` and `keyMaterialDigest` hash the exact canonical metadata objects. Verify every listed member, duplicates, scope, expected operator and signed page/cursor indicators. `complete` means the operator asserts this query has no further page at export time; it is not cryptographic proof that no event was omitted or later event exists. Follow all cursors and retain conflicts/status history. Missing original terms/approvals must be reported, never reconstructed from a summary.

The bundle verifier checks manifest signature and listed byte integrity. It does not automatically trust status observations, approve attachment schemas, verify every attachment's holder signature, establish cross-page completeness, contact Stripe or prove that funds moved. Call the credential/holder/history helpers and the verifier's own policy as appropriate. Operator time is not an independent trusted timestamp. Ed25519 operator/payment evidence is classical and currently server-stored in the founding deployment; PQC roots do not make it quantum-resistant or HSM-backed.

## 4. Public conformance and remaining work

*Both languages check synthetic historical assertions; neither executes a payment.*

[CC0 vectors](../artifacts/payments-v1/vectors/payments.json) include 15 signed positive records, 35 negative records, two signed bundle pages and five bundle negatives. The separate WebAuthn supplement adds one positive and one signed semantic negative, plus a missing-trusted-enrollment rejection in the Node tests. The original vectors cover both collection-grant scopes, all five instruction actions, both recipient roles, authorization/capture/transfer/refund distinctions, unknown allocation, original holder authorization, fee/allocation reconciliation, issuer trust, altered instructions/destinations/deadlines/amounts, signature failures, history and missing/substituted export members. Semantic negatives are re-secured with a valid operator signature so rejection is not merely a broken wrapper. Tests also reject unknown issuer keys.

Run `npm test` and the existing `npm run test:python` after installing locked dependencies. [Node reference](../reference/payments.ts) and [Python verifier](../tests/verify_payments.py) use separate cryptographic/validation implementations; Python imports no TypeScript or private application. CI runs both. [Fixture generation](../tests/generate-payments.ts) uses fresh throwaway signing keys and is manual; private material is never written. Vectors are stable repository data, not regenerated during CI.

These are repository-maintained independent implementations, not third-party Rust/Go reproduction, an audit, a legal assessment, a live-provider test, an archival/status service or assurance that every runtime output matches the profile. Application tests must additionally validate emitted records against these schemas. Live custody, disputed payments, account-binding histories and provider retries need separate application/integration testing. Statutory admissibility and evidential weight are not guaranteed.


The [historical SD-JWT WebAuthn export vectors](../artifacts/payments-v2/sd-jwt-passkey-export.json) add one positive export and five negative exports: invalid manifest signature, missing approval attachment, altered disclosure, substituted VC copy and an issuer-signed amount mismatch against the original passkey approval. The [reference verifier](../reference/payment-export.ts) checks manifest member digests, original SD-JWT issuer/disclosures, root-authorized issuer key, payment scope and the WebAuthn approval against independently accepted RP enrollment. Node and Python verify the same bytes independently. Keys embedded in an export alone establish no trust. This covers synthetic historical SD-JWT export verification; live provider execution, enrollment-history availability, status freshness and omitted pages still require deployment checks.


## Current indivisible VC policy

The SD-JWT fixtures above are frozen historical fixtures. They do not establish current MCP acceptance. Current exports advertise `SITLA-vc-jwt/1` and `application/vc+jwt`; original credentials include signed `licenses` and `didAllowList`. Policy, audience, whole-object handling and mutually agreed opaque payloads follow [Online MCP §4](protocol-online.md#4-complete-signed-credentials-and-policy). Verify current full-VC signatures and export digests; never rewrite a legacy record to claim a new license.


Current [whole-VC WebAuthn export vectors](../artifacts/circulation-v2/passkey-export.json) cover one positive and six negatives: manifest signature, missing approval, changed license copy, changed JWS recipient list, substituted record and signed payment-amount mismatch. Node and independent Python verify these bytes and the supplied trusted RP enrollment. [Whole-VC policy vectors](../artifacts/circulation-v2/credentials.json) separately cover accepted policies and rejected disclosure/license combinations. They are synthetic verification fixtures, not evidence of live deployment or provider execution.


## New work-currency admission boundary

[MONEY-1–3](protocol-payments.md) requires units inside each newly supported work-flow VC and currently admits JPY/0 only. Frozen `payments-v1`, `payments-v2` and prior circulation fixtures keep their original bytes and may not contain the new explicitly signed exponent fields. They are not certification of this new admission contract. Before claiming reference operator support, publish the versioned monetary subject/adapter schema changes and corresponding issuance/verification updates; do not retrofit metadata into old signatures. The new [job-request schema](../artifacts/job-requests-v1/schemas/job-request.schema.json) already defines explicit units for its expense/reward groups. Its unsigned shape/projection tests do not add a new cryptographic-interoperability claim.
