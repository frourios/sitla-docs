# Operator Profile

*SITLA Protocol v0.10 — Required Configuration and Interoperability Profile*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 15, 2026

## 1. Independent Deployment

*The protocol defines shared meanings. Each operator supplies its own addresses, policies and commercial conditions.*

This profile is part of [Core](protocol.md) conformance. Anyone can build a competing, commercial, public-sector, self-hosted or nonprofit implementation without permission from the founding operator. An operator need not use Frourio infrastructure, register with SITLA, accept its issuers or charge its fees. No central directory, package proxy or continuity-issuer trust policy is mandatory. This profile and its examples are CC0-1.0.

**OP-1.** Publish an authenticated, versioned operator description through a documented discovery URL. This draft does not reserve a universal well-known path. Clients obtain the initial origin/authority through an independently trusted configuration or authenticated invitation, then validate HTTPS identity, expected authorization metadata and any descriptor signature against that authority. An embedded key cannot authenticate itself. Offline deployments use a previously authenticated signed copy. An ordinary operator descriptor is not a trust-anchor certificate.

An example invitation is `https://operator.example/invite#descriptor=https%3A%2F%2Foperator.example%2Fprotocol%2Foperator.json&sha256=<authenticated-descriptor-digest>`. This illustrates a UI link, not a standardized OAuth redirect or deployed URL. The inviter’s authenticated channel or out-of-band check must bind the expected origin and digest before retrieval. Decode once, require HTTPS and the approved origin, reject credentials, redirects to unapproved origins and private-network targets, and enforce byte/time limits. A hash or origin from an untrusted invitation provides integrity only, not operator trust. Do not include credentials, root secrets or private user data in invitations.

## 2. Configuration Contract

*Discover capabilities and policy before choosing a service. Never infer trust or authority from a brand name.*

**OP-2.** The descriptor declares the fields below. Fields for an unsupported optional capability are absent and the capability is explicitly unsupported; omissions never activate a default belonging to SITLA. Exact machine schemas and media types remain deployment prerequisites in this draft.

| Configuration group | Required declaration when applicable |
| --- | --- |
| Identity and revision | `operator_id` (absolute operator-controlled URI), protocol/version, descriptor revision, issuance/expiry, authenticated digest |
| Capabilities | Supported profiles and exact revisions/digests, securing formats, algorithms, key roles, proof packages, limits and unsupported operations |
| Online access | Service/MCP endpoints, allowed origins, WebAuthn RP IDs, OAuth resource and authorization-server metadata; independently validated under those standards |
| Service authority | Signing keys and key histories, log/checkpoint endpoints and witness policy; no requirement to trust another operator’s keys |
| Policy | Versioned/digest-bound recovery, consent, evidence-acceptance and abuse policies; issuer scopes/provenance and emergency authorities |
| Operations | Status, export, notices, contest and review contacts, service calendar; never private recovery destinations or user data |
| Media | Explicit external-reference support/unsupported status, retrieval/embedding/cache policy and provider restrictions; optional hosting types, quotas, retention/export/deletion and access-URL behavior as defined in [Media References](protocol-media.md) |
| Commerce | Optional quote/terms/fee and payment-capability references; currencies, actual custody/hold mechanisms, supported provider flows and refund/dispute responsibilities; [payment-event VC](protocol-payments.md) securing/schema adapters, bilateral issuance deadlines, export/verification material, corrections and post-closure access/retention when intermediating payments |

An illustrative descriptor uses reserved example domains and symbolic digests; it is not a complete executable schema or a deployed discovery endpoint:

```json
{
  "protocol": "sitla-wire/1",
  "specification_revision": "0.10",
  "wire_profiles": ["sitla-wire/1", "SITLA/webauthn-approval/1"],
  "operator_id": "https://operator.example",
  "descriptor_revision": "deployment-1",
  "issued_at": "2026-11-14T00:00:00Z",
  "expires_at": "2026-12-14T00:00:00Z",
  "profiles": [{"id":"core","version":"0.10","spec_digest":"<authenticated-spec-digest>"}],
  "endpoints": {"mcp":"https://operator.example/mcp"},
  "policy_refs": {"recovery":{"uri":"https://operator.example/policies/recovery","digest":"<authenticated-policy-digest>"}},
  "unsupported_profiles": ["disaster-offline", "proof-packages", "marketplace"]
}
```

**OP-3.** Publish supported capabilities and limits, including whether account recovery is absent. Core does not require human recovery reviewers, second recovery routes, waiting periods or an operator recovery log. A provider-portability extension publishes its supported provider authentication, callback/mode and proof-expiry rules, unique active binding and historical retention behavior. External continuity acceptance is a verifier policy, never a universal authority assigned to the founding operator. Unsupported extensions are explicit.

`specification_revision` describes the reviewed prose; `wire_profiles` declares exact byte/algorithm contracts. A document-revision change does not rename an existing wire profile or revoke signatures. Compatible operators negotiate the wire/profile IDs and accepted artifact bytes, not numerical equality of editorial versions.

Every `policy_refs.*.digest` is SHA-256 of the exact published UTF-8 policy-resource bytes after HTTP transfer/content decoding, without text normalization, reserialization, BOM removal or newline conversion. The corresponding `uri` must resolve to those bytes. `policy_digest` in a request pins the agreed verification/acceptance policy resource, or one policy manifest pinning all constituent resources. A recipient must authenticate policy authority separately, verify every required referenced digest and apply bounds before adopting it. A hash fetched next to untrusted policy bytes is not an authority. See the [policy byte fixture](../artifacts/wire-v1/policies/example-policy.json).

## 3. Cross-Operator Boundaries

*Portable identity is not a transferable login session or an obligation to trust another service.*

**OP-4.** Bind account references and service-signed evidence to `operator_id`; a UUID alone is not a cross-service identity. Scope OAuth audiences, WebAuthn RP IDs, grants, idempotency and session/recovery epochs to their actual authority. A shared root DID may be enrolled at independent operators after local proof of control and consent. Do not auto-link accounts, export a root secret to a server, share bearer sessions or treat another service’s recovery as local authorization.

Exports retain original issuer signatures, status references and accepted key history without rewriting the issuer to the destination operator. Destination services choose accepted issuers, supported formats, mandates and continuity policies explicitly. Unsupported formats may be stored as opaque data, never reported as verified. Deleting a source account cannot revoke an external issuer’s qualification; revocation of a source delegation still limits that source’s authority.

**OP-5.** Negotiate exact common protocol/profile revisions, algorithms and signed package digests before an operation. Do not silently downgrade evidence, holder binding, requester authentication or privacy. Return `profile_unsupported` or `proof_required` as appropriate. A public specification URL authenticates neither a requester nor the safety of its package. Federation of discovery, common accounts, payment routing and cross-provider settlement are not implied by compatible credential exchange; each needs an explicit supported profile/agreement.

## 4. Conformance Tests and Publication Boundary

*Publish what independently interoperates, with the precise profiles and limitations tested.*

| Requirements | Independent-implementation test | Expected result |
| --- | --- | --- |
| OPEN-1, OP-1–2 | Run two differently branded operators with different origins, keys, trust lists and payment arrangements | No founding-service registration, key or fee is required; authentic discovery and unsupported capabilities remain explicit |
| OP-3 | Replay expired provider ownership evidence; omit offline freshness bounds | Stale ownership/unsupported capabilities rejected; deployment policy and limits remain explicit |
| INTEROP-1, OP-4 | Export a supported issuer credential and verify in an independent wallet with the source offline | Original bytes, issuer, holder/status bindings and limits survive; no source session is needed |
| OP-4 | Present another operator’s token, local account UUID or continuity VC as local login authority | Wrong audience/authority is rejected; continuity needs explicit acceptance |
| OP-5 | Exchange incompatible profiles or matching package versions with different digests | Explicit mismatch, never a silent downgrade or substituted artifact |

Conformance statements identify Core and each optional profile/revision, actual compatible artifacts and independent test results. The [SITLA deployment](sitla-operator.md) is one operator’s provisional configuration; its implementation status is not the status of every protocol implementation. The specification remains v0.10 and is not yet a complete production wire standard.

Optional [Account Identifiers](protocol-identifiers.md) use the canonical operator origin to scope automatically assigned account references. The `sitla-account/1` profile requires no human-selected name. No custom public alias capability is provided. Default profile URLs/QR payloads use the immutable account URI and preserve the user’s disclosure/access settings. A short display prefix such as `sitla` is only a locally authenticated alias. Declaring this optional profile also declares its accepted VC securing/status adapters and issuer namespace authority; it does not change the mandatory wire/1 schema contracts.

[Account Lifecycle](protocol-lifecycle.md) semantics apply to each supported session/grant/account capability. Declare `sitla-account-lifecycle/1` only when the exchange is supported, along with revocation enforcement bounds, fresh-approval policy, deletion/status authorization, retention/backup rules and settlement responsibilities. Independent mandates surviving logout must be visible; offline/global instant erasure must not be advertised.

Operators SHOULD publish `deletionCancellationGraceSeconds` and independent-route deletion notice/cancellation policy under [DELETE-SAFETY-1](protocol-lifecycle.md), and independent payment-notification behavior under [PASSKEY-NOTICE-1](protocol-wire.md). These recommendations do not silently add cancellation operations to the lifecycle wire schema.

[Media handling](protocol-media.md) does not require upload or operator storage. A reference-only deployment remains conformant; it declares upload/hosting unsupported and must not imply that paid link disclosure controls access at the destination. Media capabilities have no new wire profile ID in this prose-only specification.

## Payment deployment declarations

Payment operators declare the chosen provider binding, jurisdictions/currencies, actual funds mechanism, collection trigger, reservation/hold/refund limits, fee/refund/liquidity policy and legal/provider assessment status. Unsupported or unassessed flows cannot be implied by a successful API test. Include key-loss handling and the availability/coverage/privacy policy of any REC-6 binding/dispute summary. Missing history is unknown, not a clean record. The [Stripe Japan adapter](protocol-stripe-jp.md) is optional; the founding service's monetary/timing values remain in [deployment](sitla-operator.md) and commercial terms.
