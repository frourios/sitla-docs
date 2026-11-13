# Operator Profile

*SITLA Protocol v0.2 — Required Configuration and Interoperability Profile*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 14, 2026

## 1. Independent Deployment

*The protocol defines shared meanings. Each operator supplies its own addresses, policies and commercial conditions.*

This profile is part of [Core](protocol.md) conformance. Anyone can build a competing, commercial, public-sector, self-hosted or nonprofit implementation without permission from the founding operator. An operator need not use Frourio infrastructure, register with SITLA, accept its issuers or charge its fees. No central directory, package proxy or recovery authority is mandatory. This profile and its examples are CC0-1.0.

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
| Service authority | Signing/recovery keys and key histories, log/checkpoint endpoints and witness policy; no requirement to trust another operator’s keys |
| Policy | Versioned/digest-bound recovery, consent, evidence-acceptance and abuse policies; issuer scopes/provenance and emergency authorities |
| Operations | Status, export, notices, contest and review contacts, service calendar; never private recovery destinations or user data |
| Commerce | Optional quote/terms/fee and payment-capability references; currencies, supported provider flows and refund/dispute responsibilities |

An illustrative descriptor uses reserved example domains and symbolic digests; it is not a complete executable schema or a deployed discovery endpoint:

```json
{
  "protocol": "sitla/0.2",
  "operator_id": "https://operator.example",
  "descriptor_revision": "deployment-1",
  "issued_at": "2026-11-14T00:00:00Z",
  "expires_at": "2026-12-14T00:00:00Z",
  "profiles": [{"id":"core","version":"0.2","spec_digest":"<authenticated-spec-digest>"}],
  "endpoints": {"mcp":"https://operator.example/mcp"},
  "policy_refs": {"recovery":{"uri":"https://operator.example/policies/recovery","digest":"<authenticated-policy-digest>"}},
  "unsupported_profiles": ["disaster-offline", "proof-packages", "marketplace"]
}
```

**OP-3.** Policies publish bounded positive authentication/recovery timings, route recheck age, contest deadlines, intake windows, per-case/per-principal report limits, maximum unverified-report holds and business calendar. Disaster deployments also declare update/refresh/normal-use and drill bounds. Exact values are local choices; independent factors, frozen destinations, restricted recovery operations, contest freezes, truthful uncertainty, export rights and required authorization remain normative Core/profile controls. Reject missing or invalid bounds for a requested capability. Bind the policy revision/digest and resulting absolute deadlines to affected requests/receipts. A policy update cannot silently weaken an already authorized action or shorten an in-flight recovery. Verifiers can reject another deployment’s weaker or stale policies without treating its credentials as cryptographically invalid.

## 3. Cross-Operator Boundaries

*Portable identity is not a transferable login session or an obligation to trust another service.*

**OP-4.** Bind account references and service-signed evidence to `operator_id`; a handle or UUID alone is not a cross-service identity. Scope OAuth audiences, WebAuthn RP IDs, grants, idempotency and session/recovery epochs to their actual authority. A shared root DID may be enrolled at independent operators after local proof of control and consent. Do not auto-link accounts, export a root secret to a server, share bearer sessions or treat another service’s recovery as local authorization.

Exports retain original issuer signatures, status references and accepted key history without rewriting the issuer to the destination operator. Destination services choose accepted issuers, supported formats, mandates and continuity policies explicitly. Unsupported formats may be stored as opaque data, never reported as verified. Deleting a source account cannot revoke an external issuer’s qualification; revocation of a source delegation still limits that source’s authority.

**OP-5.** Negotiate exact common protocol/profile revisions, algorithms and signed package digests before an operation. Do not silently downgrade evidence, holder binding, requester authentication or privacy. Return `profile_unsupported` or `proof_required` as appropriate. A public specification URL authenticates neither a requester nor the safety of its package. Federation of discovery, common accounts, payment routing and cross-provider settlement are not implied by compatible credential exchange; each needs an explicit supported profile/agreement.

## 4. Conformance Tests and Publication Boundary

*Publish what independently interoperates, with the precise profiles and limitations tested.*

| Requirements | Independent-implementation test | Expected result |
| --- | --- | --- |
| OPEN-1, OP-1–2 | Run two differently branded operators with different origins, keys, trust lists and payment arrangements | No founding-service registration, key or fee is required; authentic discovery and unsupported capabilities remain explicit |
| OP-3 | Change recovery deadlines after opening a case; omit offline freshness bounds | Original protections persist; incomplete capability configuration is rejected |
| INTEROP-1, OP-4 | Export a supported issuer credential and verify in an independent wallet with the source offline | Original bytes, issuer, holder/status bindings and limits survive; no source session is needed |
| OP-4 | Present another operator’s token, local account UUID or continuity VC as local login authority | Wrong audience/authority is rejected; continuity needs explicit acceptance |
| OP-5 | Exchange incompatible profiles or matching package versions with different digests | Explicit mismatch, never a silent downgrade or substituted artifact |

Conformance statements identify Core and each optional profile/revision, actual compatible artifacts and independent test results. The [SITLA deployment](sitla-operator.md) is one operator’s provisional configuration; its implementation status is not the status of every protocol implementation. The specification remains v0.2 and is not yet a complete production wire standard.
