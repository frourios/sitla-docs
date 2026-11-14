# SITLA Protocol

*Core: Portable Identity, Evidence, Authentication and Recovery*

**Version:** 0.4 — Design Draft\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 14, 2026\
**Author:** SITLA / Frourio, Inc.

## Abstract

SITLA Protocol defines interoperable online delegates for discovery and the circulation of identity, credentials, proofs and payments. Users retain portable roots and credentials, while requesters distinguish cryptographic verification from the decision to accept a counterparty. This draft defines the core trust boundaries, passkey-based access, evidence labels and constrained recovery. Optional profiles cover disconnected operation, externally published proof packages and open-market workflows.

- **Portable:** independent wallets can resolve roots and present supported credentials without the original operator.
- **Explicit assurance:** signatures, issuer assertions, ZKP and business acceptance have different meanings.
- **Bounded recovery:** earning accounts require an independent recovery route; email alone cannot restore payout authority.
- **Open ecosystem:** issuers and buyers select specifications, circuits and commercial conventions.

## 1. Reading Map and Example

*Start with the evidence you need. Add a profile only when the use case needs it.*

This document is the core. All technical documents are **v0.4 design drafts**; draft status describes maturity, not access restrictions. Publication does not implement them. The document revision (**0.4**) is distinct from the stable **`sitla-wire/1`** profile and its cryptographic contexts. Editorial revisions do not invalidate signed records. Legacy `sitla/0.1` and `sitla/0.2` artifacts remain verifiable under their explicitly selected legacy profiles, never by relabeling them.

| Document | Responsibility |
| --- | --- |
| [Core](protocol.md) | Identity, authentication, evidence, custody and recovery |
| [Account Lifecycle](protocol-lifecycle.md) | Logout, all-device logout, mandate withdrawal and account deletion |
| [Account Identifiers](protocol-identifiers.md) | Automatic stable account references, current controller binding and optional public handles |
| [Portability and Disaster](protocol-portability.md) | Independent wallets, local DIDComm, cache freshness and degraded acceptance |
| [Proof Packages](protocol-packages.md) | External specifications/circuits, mirrors, locks and execution boundaries |
| [Marketplace](protocol-marketplace.md) | Market-defined work, issuance requests and payment instructions |
| [Wire Artifacts](protocol-wire.md) | Minimum JSON schemas, canonical records and fixed test vectors |
| [Operator Profile](protocol-operators.md) | Operator-neutral configuration and cross-operator requirements |
| [SITLA Deployment](sitla-operator.md) | Founding operator values, outside protocol conformance |
| [Commercial Model](business-model.md) | Founding operator business terms, outside protocol conformance |

A buyer's agent can search using service JSON, ask for an issuer credential or a named proof, validate it independently, negotiate work, obtain any agreed signatures, and authorize payment. For an informal question, the buyer may accept an unverified description. A consequential task may require evidence from specific authorities. The marketplace profile expands these examples; it does not prescribe a work lifecycle.

AMT is the architectural ideal: locally resolvable identity and a separation between evidence and service operation. SITLA makes independent choices about custody, authentication and recovery and claims no AMT conformance. The cited edition is Frourio, Inc., *AMATELUS Protocol Spec*, September 22, 2026, 81 PDF pages, retrieved November 14, 2026, SHA-256 `c4cce877f1cc01306a732f4655a010c90a3d19df731ef3590c86c3e3b2dc6e82` ([blueprint](https://amatelus.com/blueprint.pdf)). The URL may change; the digest identifies the edition consulted.

## 2. Responsibility, Threats and Limits

*The service operates evidence and payment functions. The buyer decides whether those results are enough for the task.*

**MUST**, **MUST NOT**, **SHOULD** and **MAY** describe this proposed design. Requirement IDs identify tests, not deployed assurances. An issuer makes claims, a holder possesses credentials, a verifier checks them, and a buyer applies an acceptance policy. Those roles can differ, as in the [W3C VC model](https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/).

**TRUST-1.** Verification MUST report its actual authority, subject binding, status evidence and limitations. An operator is not an oracle about nationality, legal identity, competence, truthful testimony, human reasoning, work quality or physical events. A valid signature authenticates a statement; a sound ZKP establishes its specified relation. Neither establishes the real-world truth of an issuer's investigation. Account registration, a DID, payment or a public package does not supply missing external authority.

An online custodian can read explicitly entrusted plaintext/witnesses and may generate presentations under a mandate. It cannot thereby prove fresh human participation. Requester privacy, privacy from the custodian, software safety, legal authorization and commercial success are separate properties. Independent verification reduces particular dependencies, not all dependence on an operator. These limits apply throughout the document set and are not repeated in every profile.

| Threat | Main controls | Remaining dependency |
| --- | --- | --- |
| Mailbox compromise plus lost keys | Independent recovery route, restrictions, notices, human dispute review | Recovery-route security and operator judgment |
| Malicious requester or seller | Scoped authority, subject binding, consent, untrusted-content handling | Issuer honesty and buyer risk policy |
| Compromised operator or insider | User-held roots, exports, isolated keys, receipts and witnessed recovery log | Entrusted plaintext and authorized custody operations |
| Relayed login or stolen token | WebAuthn checks, authenticated client handoff, sender-constrained tokens | Correct client/session binding and signing endpoint |
| Cloud outage or network partition | Portable wallet and prepared local verifier | Cache age, trusted time and incomplete shared state |
| Malicious package or issuer | Pinned artifacts, independent adoption and constrained execution | Correct implementation and accepted issuer scope |

An account may buy and sell. Sellers need not be Japanese or hold official credentials. Users can create independent keys and accounts without an operator classifying their purposes or proving that they belong to one person. Voluntary portfolio links are explicit assertions. Service restrictions and payment-provider controls still apply; no global person-uniqueness claim follows.

## 3. Stable Roots and Replaceable Communication Keys

*Keep the identity root stable. Rotate a communication key without changing the identity root.*

**ID-1.** The experimental `did:sitla:v1:<digest>` root is derived only from this fixed descriptor:

```json
{
  "version": 1,
  "identitySuite": "ML-DSA-44",
  "identityPublicKey": "<unpadded-base64url-public-key>"
}
```

Serialize with [JCS, RFC 8785](https://www.rfc-editor.org/rfc/rfc8785), UTF-8 encode, hash with SHA3-512, and encode the digest as unpadded base64url. The DID is not its own hash input. Reconstruct the exact signing-only document locally using the fixed AKP JWK representation in [Wire Artifacts](protocol-wire.md); reject duplicate/extra fields, unknown versions, invalid key lengths, noncanonical encodings and altered relationships. The [wire artifacts](protocol-wire.md) provide derivation schemas and fixed byte vectors; independent wallet interoperation remains a deployment prerequisite. This experimental method is not registered or an AMT identifier.

**KEY-1.** A wallet MUST retain the root secret under user control and support encrypted backup/export. An operator receives scoped presentation authority, not implicit access to a root secret. Hardware-wrapped software storage is not native ML-DSA hardware signing; synced passkeys have separate provider/recovery assumptions. A future ML-DSA passkey profile may declare actual authenticator/browser/server support; v0.4 does not assume it. Hosted-only root custody is outside the portable-holder profile.

**KEY-2.** Root-signed `OperationalKeyAuthorization` records carry replaceable communication or application keys outside the immutable root descriptor. Each `replace-operational-keys` record replaces the entire key set for its fixed authorization series; omitted keys lose that authority. A `revoke-operational-keys` record has an empty set and terminates the series. Reauthorization requires a new root-approved series, never resurrection of an older record. A record binds the root, operational/pairwise DID, exact public keys and roles, audience/purpose, authorization-series ID, sequence, predecessor-record digest, issue/expiry times and status reference. Signing and agreement keys are independent. An agreement-key rotation creates a new record or pairwise DID, not a new root or credential-continuity event. Receivers retain the highest authenticated sequence per root and authorization series they know, without conflating unrelated scopes; offline evidence may omit later changes. Static-key replacement alone does not establish forward secrecy for past ciphertext.

**KEY-3.** Sensitive local interactions default to fresh **pairwise communication DIDs for transport only** with independent conventional signing and X25519 keys. The baseline uses [Peer DID method 2](https://identity.foundation/peer-did-method-spec/#method-2-multiple-inception-key-without-doc) (`did:peer:2`) with its clarified encoding and independently generated Ed25519 verification and X25519 encryption keys. No persistent service endpoint is required; local invitations negotiate delivery. Resolver vectors and independent-wallet tests must pin the method revision. A root DID is not automatically a DIDComm endpoint. A wallet may hold a root-signed delegation privately, but sending that delegation to every peer would disclose a common root and defeat the intended privacy.

Pairwise transport does not promise unlinkable qualification presentation. v0.4 defines no general ZKP that hides a root-bound subject while transferring its binding to an arbitrary pairwise key. Deployments MUST advertise only a supported presentation route, not infer privacy from a new DID.

| Presentation route | Qualification/presenter binding | Linkability and availability |
| --- | --- | --- |
| Root-bound VC plus disclosed root delegation | Root and exact peer key are checked | Linkable to the root; requires explicit disclosure consent |
| Issuer-preissued single-use peer-key VC | Issuer signs the exact disposable key; peer proves possession with a fresh challenge | Can avoid a common root in verifier-visible fields if issuer format/payload/status identifiers also avoid stable correlators; issuer can still correlate issuance |
| Issuer-preissued bearer VC | Issuer signature only; no fresh holder-key binding | No holder assurance; copying/sharing/repeated serials remain possible; not interchangeable with key-bound evidence |
| Root-hiding ZKP / anonymous credential | Must prove accepted subject-to-peer-key relation | Not specified by v0.4; unavailable unless a separately identified, reviewed package actually implements it |
| Anonymous assistance | No qualification-to-person binding | Only explicitly permitted low-assurance decisions; never label as verified qualification |

A practical issuer route pre-enrolls independently generated one-time signing keys while connected, authenticates the subject under its own process, and issues separate minimal credentials for those keys. Each credential binds its own key, issuer, narrow claims, expiry and status policy without repeating the root, account handle, batch ID or other unnecessary common subject fields. The holder caches original signed credentials and proves possession of the selected key over the audience, request/challenge, purpose and credential digest. This is a format-specific issuer capability, not a new universal VC format. Verifiers must inspect remaining identifiers, claim combinations, issuance timestamps and status-access metadata; batch issuance does not guarantee anonymity from the issuer or colluding parties. Reuse is linkable and an offline verifier cannot guarantee global single use. If no accepted route exists, explicitly consent to a linkable presentation, use permitted anonymous assistance, or refuse. No silent privacy downgrade or invented holder assurance is allowed. Public professional DIDs remain optional; their use is not the default for patients or evacuees.

## 4. Cryptographic and DIDComm Boundaries

*PQC protects selected root and archival operations. Conventional transport and proofs retain their own declared assumptions.*

**CRYPTO-1.** Native root records use pure ML-DSA-44 via the [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) external interface with hedged signing and fresh 32-byte randomness. Failure of randomness fails signing. HashML-DSA and silent deterministic fallback are excluded. Context bytes are `SITLA/root/1`, `SITLA/continuity/1` or `SITLA/archive/1`, according to record class. Sign the full domain-separated canonical record, with operation, role, scope, recipient, nonce/request ID and expiry; do not add an undocumented prehash.

**CRYPTO-2.** Long-lived authority/continuity records can use a declared hybrid profile requiring independently checked conventional and PQC signatures over the same payload. Attaching a PQC signature is not verification. A circuit checking only the conventional component reports a classical proof. Issuer formats, native signatures, in-circuit verification and device storage require separate measurements. A supported signed Boolean credential may suffice without general-purpose proving. End-to-end quantum resistance and quantum-resistant encryption are not claimed.

**COMM-1.** The [DIDComm v2.1 signed-envelope section](https://identity.foundation/didcomm-messaging/spec/v2.1/) lists EdDSA, ES256 and ES256K. The baseline DIDComm adapter uses the conventional algorithms of the pinned [DIDComm v2.1](https://identity.foundation/didcomm-messaging/spec/v2.1/) profile: EdDSA/Ed25519 for signed messages and independently generated X25519 keys under its selected encryption mode. `kid` values resolve to the exact permitted methods. No ML-DSA key is substituted for an agreement or ordinary DIDComm signing key.

PQC authorizations and continuity records travel as **application-layer attachments**, with their record type, canonical payload, signature bytes and native context profile. The receiving application verifies them separately and binds the relevant attachment digest, intended recipient and operation into the protected exchange. The native signature above is not relabeled as an interoperable JWS signature.

As checked November 14, 2026, [RFC 9964](https://www.rfc-editor.org/rfc/rfc9964) and the [IANA JOSE](https://www.iana.org/assignments/jose/) / [COSE](https://www.iana.org/assignments/cose/) registries define ML-DSA-44/65/87; the COSE values are -48/-49/-50. RFC 9964 uses an empty ML-DSA context. A future JOSE/COSE adapter must follow that encoding and sign its prescribed structure; it cannot reuse a native nonempty-context signature. Algorithm registration does not itself add ML-DSA support to DIDComm. Independent-wallet tests must cover both layers.

## 5. Authentication and Accountable Clients

*Use passkeys for routine access and explicit root authorization for root operations. Tokens belong to an approved client and session key.*

**AUTH-1.** Registration records terms/privacy consent, verifies the primary notification/recovery email, enrolls a DID and proves relevant key control. The internal UUIDv7 and mutable account handle are not universal VC subjects. Email is not normal login, but can become an effective root through account recovery. An earning account is **payout-enabled or seeking its first payout**, not an undefined label such as high assurance; its additional requirements are in Section 8.

**AUTH-2.** WebAuthn passkeys are enrolled under explicit account/root authorization. Verify challenge, expected origin, RP ID hash, credential binding and required UP/UV flags. Challenges have at least 256 random bits, expire within the operator’s published short-lived `challengeMaxAgeSeconds` bound and are consumed atomically. Counter anomalies are risk signals, not a universal rejection of zero counters. Cross-origin ceremonies require a separate profile. The reference is [WebAuthn Level 3, Recommendation, August 25, 2026](https://www.w3.org/TR/2026/REC-webauthn-3-20260825/), checked November 14, 2026.

**AUTH-3.** Bind the authenticated handoff to a client-generated session-key thumbprint, intended client, resource and scopes. The sender-constrained profile verifies [DPoP, RFC 9449](https://www.rfc-editor.org/rfc/rfc9449), including method/target, token hash, timing, replay IDs and server nonce where required. Wallet/native DID login additionally authenticates the calling application/channel and displays the relying party. An origin string supplied by an arbitrary caller is insufficient. DPoP does not stop a user authorizing a malicious client.

**AUTH-4.** Protected HTTP MCP follows the pinned [2025-11-25 MCP authorization profile](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) and [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700). WebAuthn is a ceremony at the authorization server, not a new OAuth grant. `RequesterAuth-OAuthDPoP-v1` means an accountable operator's valid audience/scoped OAuth authorization plus verified DPoP key possession. It does not mean reputable, harmless or legally authorized for every task. Unsupported clients get an explicit error or a separately named restricted profile, never a hidden downgrade.

**AUTH-5.** Apply [Account Lifecycle](protocol-lifecycle.md) semantics to the capabilities an operator provides: current-session logout, all-session logout, explicit mandate revocation and authorized account deletion are distinct. Publish their scopes and completion/retention rules, enforce revocation on token refresh and execution, and provide an appropriately authorized completion/status path after the original session ends. An optional exchange profile does not require a specific HTTP route or MCP tool name.

## 6. Credentials, Consent and Status

*Preserve the issuer's original statement. A custody mandate grants only its stated use.*

**PORT-1.** Preserve original signed bytes, subject/holder bindings, securing-format versions, selective-disclosure material, expiry, issuer scope, status and accepted continuity/delegation evidence. An issuer's identity and authority are accepted under the requester's policy; public registration creates no anchor. Without accepted official or other independent issuer evidence, a claim may remain a self-description. The buyer may accept that limitation.

**ISSUE-1.** Parties define their own VC types and can issue them only through issuer approval or a specific issuance mandate. Unknown business semantics do not automatically prevent safe storage/transport, but unsupported cryptography cannot be labeled verified. Schemas and proof implementations can be published externally as in the [Proof Package Profile](protocol-packages.md).

**CONSENT-1.** Mandates state exact claims/predicates, audiences, purposes, expiry and cancellation in plain language and machine scopes. Example: "For task eligibility, disclose only the specified age/nationality Booleans for seven days to requesters authenticated under RequesterAuth-OAuthDPoP-v1." The requester must also be within the mandate's approved audience; authentication alone is not permission. Require step-up for financial execution, expanded disclosure, recovery and payout changes. Parties choose work-specific approvals.

Withdrawal of a mandate stops future authority and its dependent grants under [Account Lifecycle](protocol-lifecycle.md); it is not inferred merely from logout and does not undo completed disclosures or contracts.

**CONSENT-2.** Users can inspect/export private presentation receipts showing recipient, purpose, exact disclosure/predicate, evidence level, authority, time and grant/approval. Independently retained receipts supplement the operator's activity screen. Profiles/messages/attachments remain untrusted agent input even when signed; they grant no tool, token or payment authority. Apply parsing limits, scoped execution, reporting and abuse controls in both directions.

**STATUS-1.** Report each issuer/delegation's authenticated state observation, `status_as_of`, snapshot age/expiry, clock confidence and known revocation separately. Preserve original status references through extraction and recovery. A fresh challenge does not refresh a snapshot. Old positive evidence cannot roll back a known newer state or confirmed revocation. Missing/stale/unknown status is reported as such; acceptance is a separate policy, including in the [disaster profile](protocol-portability.md).

## 7. Evidence and Machine-Readable Results

*Evidence labels describe the statement actually checked. They do not rank every transaction by a single trust score.*

**EVID-1.** Application responses carry `evidence_level`, `verified_by`, `verification_result`, `acceptance_decision`, status observations and limitations. Label heterogeneous items separately.

| Level | Established statement | Main trust dependency |
| --- | --- | --- |
| `service-json` | A service supplied data | Named service and transport |
| `service-signed` | A service key signed exact bytes | Service assertion and key operation |
| `user-signed` | An authorized user key approved a bound record | Key/subject binding, ceremony and recovery |
| `issuer-credential` | An issuer secured a disclosed claim | Issuer scope/truthfulness, holder binding and status |
| `zkp` | An approved circuit's predicates/bindings verified | Accepted circuit, proof assumptions and issuers |

**EVID-2.** The [ApprovedAction wire record](protocol-wire.md) under `SITLA/approval/1` binds operation, actor, external event/contract reference, terms or payload digest, amount/currency if applicable, audience, challenge, expiry and session/recovery epoch. The baseline supports an Ed25519 artifact and the `SITLA/webauthn-approval/1` browser artifact, whose challenge is SHA-256 of the same canonical approval payload. Verify RP enrollment, actor/grant binding, origin, UP/UV and current authority; a login assertion is not automatically transaction approval. A custody key cannot replace a required user key. A signature does not prove human authorship or reasoning; see Section 2.

The minimum request schema and bound response are fixed in [Wire Artifacts](protocol-wire.md). This fixture requests `service-json`; a ZKP request instead names package/circuit digests and parameters. These are wire artifacts, not deployed MCP tool names. `policy_digest` hashes the exact published policy-resource bytes, including its final newline; the fixture resource and byte identity are provided with the vectors.

```json
{
  "protocol": "sitla-wire/1",
  "operation": "request-evidence",
  "request_id": "evidence-request-1",
  "operator_id": "https://operator.example",
  "subject_reference": "did:sitla:v1:MXEvdrCXg_SR8h1mF1U8MUtwyaTF8cqatgV0n6rVuPZpi5--IquMBNmp_xySiNC86dr8PeRCXj19ZsLBWezTSA",
  "evidence_level": "service-json",
  "audience": "https://requester.example",
  "purpose": "work-transaction",
  "challenge": "__79_Pv6-fj39vX08_Lx8O_u7ezr6uno5-bl5OPi4eA",
  "issued_at": "2026-11-14T00:02:00Z",
  "expires_at": "2026-11-14T00:07:00Z",
  "policy_digest": "2b4edcd3dc6c8740e7c4f54b39434ffb41fcc5c1a26e47b408a8ea24959da333",
  "requirements": []
}
```

Its matching response includes SHA-256 of the canonical request. It reports service trust without inventing independent issuer verification:

```json
{
  "protocol": "sitla-wire/1",
  "profile": "core-evidence-v1",
  "operator_id": "https://operator.example",
  "request_id": "evidence-request-1",
  "request_digest": "02f224acc0dd7c7c4f3465d1c321414277aa67a3b3813e3dfdb4175ec26a0694",
  "mode": "online",
  "audience": "https://requester.example",
  "purpose": "work-transaction",
  "challenge": "__79_Pv6-fj39vX08_Lx8O_u7ezr6uno5-bl5OPi4eA",
  "issued_at": "2026-11-14T00:02:00Z",
  "expires_at": "2026-11-14T00:07:00Z",
  "evidence_level": "service-json",
  "verified_by": {
    "authority": "https://operator.example",
    "method": "authenticated-response",
    "implementation": "format-fixture-v0.2"
  },
  "verification_result": "not_independently_verified",
  "acceptance_decision": "not_evaluated",
  "policy_digest": "2b4edcd3dc6c8740e7c4f54b39434ffb41fcc5c1a26e47b408a8ea24959da333",
  "status_observations": [],
  "limitations": [
    "Format fixture; no independent real-world or current-status assertion."
  ],
  "evidence_digest": null
}
```

A client records its own verifier outcome; it must not trust a server claiming `requester-local`. A hosted verification API reports that host. Buyer acceptance of uncertainty does not turn a failed proof into a valid one.

**API-1.** Bind responses to their request ID/digest, protocol/profile, mode, audience and purpose. Suggested application errors include `proof_required`, `profile_unsupported`, `package_integrity_failed`, `subject_binding_failed`, `status_stale`, `status_unknown`, `time_untrusted`, `recovery_pending`, `recovery_restricted`, `consent_required`, `quota_exceeded` and `idempotency_conflict`. OAuth/MCP errors retain their own semantics. Mutations and billable work bind idempotency keys to actor, operation and canonical request; authorization is rechecked on retry.

## 8. Recovery and Independent Routes

*Waiting is not proof of rightful ownership. A payout account needs a route that survives loss of both its root key and primary mailbox.*

**REC-1.** Before enabling or executing a first payout, an earning account MUST enroll and verify an **independent second route**: prefer a separately secured secondary mailbox or pre-enrolled trusted recovery contact. A verified telephone or reviewed equivalent MAY be accepted with documented risk controls. Telephone/SMS has at most medium independence assurance in this policy because SIM swaps, number recycling and carrier recovery can defeat it; possession alone does not establish strong identity. Independence of any route remains conditional on its actual security and recovery chain. Two addresses controlled by the same compromised login/recovery chain are not independent. Record the route's type, verified destination, enrollment authority and independence assumptions; test reachability at enrollment, before the first payout and after route changes, with periodic checks within the operator’s published `routeRecheckMaxAgeSeconds`. A failed/stale check blocks restoration of payout authority until repaired through established authorization or review.

For earning accounts, recovery requires primary-route verification **and** confirmation through that pre-enrolled independent route, or a reviewed alternative with comparable independent evidence. A new key, new passkey or new contact created during the attempt is not the missing factor. Legacy earning accounts without a route cannot cure this solely from the contested primary email. Email-only recovery for non-earning accounts remains explicitly lower assurance; it cannot enable payouts without completing earning-account enrollment.

**REC-2.** Reverification by the original payment provider MAY support the reviewed alternative only if the provider actually offers an authorized process that ties the person to the same pre-existing beneficiary/account. A stored `payouts_enabled` flag, access to the operator's provider API, or a new provider account is not fresh identity evidence. Do not copy identity documents into the operator by assumption. Provider refusal/unavailability leaves financial authority blocked; the protocol cannot waive the provider's controls.

**REC-3.** A recovery binds the predecessor from protected account history, new-root control, staged passkey, request ID, epoch, scope and factors. Serialize competing attempts. A published, versioned recovery policy sets positive `pendingSeconds` and `restrictedSeconds`; the policy and exact deadlines are bound to the attempt. The [SITLA deployment](sitla-operator.md) gives one concrete policy, not universal timing. Changes cannot shorten an in-flight attempt’s protections. Pending/restricted sessions cannot approve disbursements, change beneficiaries, create/expand mandates or agent grants, view paid/private data, export the private vault, issue credentials, or approve irreversible account deletion. Status/contest actions are allowed; the profile may permit explicitly listed nonsensitive functions during restricted control. Ordinary portable export is not an exception for an attacker holding only recovery access.

**REC-4.** Send notices to the frozen primary route, the pre-enrolled independent route and existing device channels. An "old-DID channel" means an explicitly enrolled mailbox/relay subscription or locally paired device association whose endpoint and recipient key were authorized before recovery; a DID string itself has no delivery address. Do not resolve or invent an endpoint from the identifier. Notices record dispatch/delivery observations; mailbox delivery does not establish that the rightful person read it. Lack of a notice response is not consent, and cannot replace the independent factor. Known delivery failures require review rather than automatic activation.

**REC-5.** Distinguish an unverified report from an admitted contest. For an earning account, admitting a contest requires confirmation through a pre-enrolled independent route or independently reviewed evidence comparable to REC-1; possession of the primary mailbox alone cannot repeatedly trigger a freeze. Offer a bounded human intake for lost-factor reports without treating them as authenticated contests. Credible compromise evidence may trigger a documented temporary risk hold under operator policy; it is not renewed by repeating the same report. An admitted contest freezes activation and risky functions for both sides. Deduplicate by account/case and evidence fingerprint, impose published positive per-case/per-principal intake and review limits, and apply abuse controls before expensive review; IP limits alone are insufficient. Repeated reports without materially new evidence do not restart deadlines or extend holds. A reviewer can admit new independent evidence or a separately handled appeal, with an auditable reason; rate limits must preserve that path for a locked-out legitimate user. A human case owner acknowledges within the published `contestAckSeconds`, gives an initial disposition or named missing-evidence plan within `contestInitialBusinessDays`, and updates within `contestUpdateBusinessDays` until resolution. The published service calendar defines business days. These positive bounds are operator commitments bound to the case, not protocol constants. Deadlines are service obligations, never automatic approval rules. A reviewer examines enrollment history, factor provenance and, when authorized, original issuer/provider reverification. A different reviewer handles an appeal. Neither primary-email possession nor an allegedly compromised old signature wins by itself. If evidence remains insufficient, authority stays frozen with a documented reason; do not publish private claimant evidence.

**REC-6.** After factors, review if required, timing and new-key checks succeed, atomically activate the successor/epoch, invalidate old sessions/incompatible mandates and record continuity. Preserve prior restrictions and consumed rights. Notify the enrolled channels and give an exportable receipt. Email changes and second-route changes require established control or the same independent-review standard, separate delayed notices and no retroactive rewriting of recovery destinations.

## 9. Continuity and Monitored Authority

*Recovery restores an account under a named authority. It does not rewrite the issuer's old credential or restore a lost secret.*

**REC-7.** A continuity credential binds predecessor/successor, private account reference, recovery method, factors/assurance profile, epoch, scope, request ID, issue/expiry times, status and recovery-record commitment. Authority keys are isolated in a non-exportable hardware or independently controlled threshold boundary with declared algorithm support. The archival hybrid profile checks both components; missing support is explicit, not an unlabeled application-file key fallback.

**REC-8.** Pending and completed recoveries enter an append-only Merkle log with inclusion/consistency receipts and independently witnessed checkpoints. User agents compare retained checkpoints; gossip can expose split views when communication resumes. Blind each public record commitment with at least 256 random secret bits; publish no root/email/account identifiers or guessable hashes. Provide openings only to affected users/authorized reviewers. Checkpoint consistency is not proof that a recovery was rightful. Missing receipts leave the operation pending or explicitly downgraded under a published non-financial policy.

An operator-issued continuity VC attests account recovery, not universal same-person identity. Original VCs keep their subjects, signatures, expiry, status and restrictions. Third-party key-bound credentials may require their original issuer's approval/reissuance, potentially in most cases. Other wallets can inspect accepted continuity, but are not forced to trust that operator's decision. Old keys may remain usable outside the service; offline peers may not know a later revocation. A communication-key update from Section 3 is not a root-recovery event.

## 10. Core Conformance and Implementation Status

*Test the failure boundaries before advertising a capability. A published draft is not a deployed feature.*

| Requirements | Test | Required result |
| --- | --- | --- |
| ID-1, KEY-2, CRYPTO-1–2 | Resolve root offline, rotate X25519 key, replay an older authorization or swap native/JOSE contexts | Root DID unchanged; no credential-continuity chain for transport rotation; known newer state retained and wrong signature profile rejected |
| KEY-1, PORT-1 | Export and use an independent wallet with the source operator unavailable | Supported original evidence remains usable under issuer policy |
| KEY-3, COMM-1 | Exchange pairwise messages; substitute root/attachment/recipient; inspect revealed identifiers | Explicit key/record binding; no silent stable-root disclosure or ML-DSA-in-DIDComm assumption |
| AUTH-1–5 | Relay a ceremony to another client/key, alter RP/origin/resource/DPoP | Wrong binding rejected; no transferable session from an unbound challenge |
| TRUST-1, EVID-1–2, API-1 | Substitute a hosted verdict, mutate a signed amount or retry under revoked authority | Actual verifier and unchanged evidence outcome reported; no duplicate effect/bypass |
| AUTH-5, LIFE-1–5 | Race logout/token refresh, revoke a parent grant, delete during recovery or mislabel an accepted deletion as completed | Correct session/mandate scope; no recovery bypass, resurrection or global-erasure claim |
| REC-1–2 | Compromise primary email and lose root; omit the pre-enrolled factor or show old provider flags | Earning-account financial recovery blocked; no new factor enrolled from contested email alone |
| REC-3–6 | Attempt restricted operations, simulate failed notices and opposing claims | Restrictions hold; human-review deadlines recorded; no time-based default win |
| REC-7–8 | Forge predecessor, omit log receipt, show split checkpoints or override issuer recovery | Invalid continuity rejected/pending; external issuer conditions preserved |
| CONSENT-1–2, STATUS-1 | Inject tool instructions or replace stale status with a favorable label | No content-derived authority; status uncertainty and buyer acceptance stay separate |

Current deployed capabilities include email-code authentication, profile disclosure, seller discovery, paid disclosure checkout and payment onboarding. The identity, passkey/OAuth/DPoP, recovery/log, VC and optional-profile facilities specified here are **proposed**. Runtime authentication is unchanged by this document rewrite. Publish measured phone/server resources, interoperability results and independent reviews before claiming conformance.

## 11. Open Specification and Independent Operators

*Anyone can implement this protocol. An operator is a replaceable service, not a universal identity or recovery authority.*

**OPEN-1.** The specification text, embedded examples and original data definitions in Core and its technical profiles are dedicated under **CC0-1.0**. Commercial use, copying, modification, redistribution and independent implementations require no SITLA subscription, approval, royalty or attribution. See [licensing scope](../LICENSING.md), the complete [CC0 text](../LICENSE-CC0-1.0.txt), [trademark policy](../TRADEMARKS.md) and separate [patent grant](../PATENTS.md). The scoped [reference implementation](../reference/README.md) uses Apache-2.0; application code is outside that grant. Referenced standards, external packages, implementation software and brand assets retain their own terms; CC0 does not grant trademark or patent rights. Descriptive, accurate conformance statements do not imply endorsement or permission to impersonate an operator.

**INTEROP-1.** Conformance is to an exact version and declared profiles, not membership in a central registry. Independent operators MUST apply the [Operator Profile](protocol-operators.md), preserve portable signed artifacts, and test compatible producers/consumers from independently maintained implementations. No operator’s origin, accounts, fees, trust list, signatures, package registry or payment provider is a global prerequisite. A recovery authority can restore only its own account authority; accepting its continuity elsewhere requires an explicit verifier/issuer policy.

The `did:sitla:v1` method name, `sitla-wire/1`, evidence labels and the defined `SITLA/{purpose}/1` contexts cryptographic contexts are shared protocol identifiers. For a claim of compatibility with this exact byte-level profile, these identifiers MUST remain unchanged. This is a conformance/terminology rule, not a CC0 license restriction: anyone may rename or fork the text, but changed identifiers describe a different profile. Origins, RP IDs, OAuth issuers, endpoints, service keys, policy values and local identifiers are deployment parameters. The [Wire Artifacts](protocol-wire.md) fix schemas, canonical bytes and positive/negative vectors for ID-1, KEY-2, request/evidence binding and EVID-2 approvals/service assertions. They are a minimum interoperability subset; complete securing-format adapters, discovery schemas, independent implementations and production reviews remain outstanding.

## References and Publication Notes

*References were rechecked on November 14, 2026. Algorithm registries and implementations can evolve independently of this draft.*

- [AMATELUS Protocol Spec](https://amatelus.com/blueprint.pdf), edition/date/digest recorded in Section 1.
- [DID Core v1.0](https://www.w3.org/TR/2022/REC-did-core-20220719/), W3C Recommendation, July 19, 2022.
- [VC Data Model v2.0](https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/), W3C Recommendation, May 15, 2025.
- [WebAuthn Level 3](https://www.w3.org/TR/2026/REC-webauthn-3-20260825/), W3C Recommendation, August 25, 2026.
- [RFC 9901](https://www.rfc-editor.org/rfc/rfc9901), *Selective Disclosure for JSON Web Tokens*, November 2025; the base mechanism is not every SD-JWT VC profile.
- [RFC 9964](https://www.rfc-editor.org/rfc/rfc9964), *ML-DSA for JOSE and COSE*, May 2026; its empty-context encoding differs from native records above.
- [DIDComm Messaging v2.1](https://identity.foundation/didcomm-messaging/spec/v2.1/), Working Group Approved; the page labels itself an Editor’s Draft. Its signed-message algorithms were checked against the specification, not inferred from an implementation.
- The linked FIPS, JCS, DPoP, OAuth/MCP and DIDComm documents identify the pinned profiles. No standard method registration, circuit audit or independent-wallet conformance is asserted by a link alone.
