# Wire Artifacts

*SITLA Protocol v0.17 — Minimum Interoperability Subset*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 27, 2026

## 1. Scope, Encoding and Version Boundary

*Independent implementations need identical bytes and rejection rules. A newer protocol does not rename a holder’s identity root.*

This frozen subset fixes the historical version-1 descriptor/root projection and original key authorization, evidence requests/envelopes, EVID-2 Ed25519/passkey approvals and service assertions from [Core](protocol.md). Schemas do not authenticate an issuer, grant permission or establish real-world truth. Credential-format adapters, full operator discovery, live status and transport profiles remain separate.

**WIRE-1.** Use the linked JSON Schema draft 2020-12 schemas; reject unknown fields. Wire objects are canonical UTF-8 without BOM, using the RFC 8785 JCS subset: safe integers only (absolute value at most 2^53−1), no negative zero, no unpaired Unicode surrogates, no Unicode normalization, UTF-16 code-unit property ordering, JCS string escapes and preserved array order. Reject duplicate fields at every depth, whitespace and alternate wire spellings. Exact reserialization comparison after strict decoding can detect these ambiguities. Check byte/depth budgets before parsing and enforce collection, time and rate limits. Schema changes require a named profile/revision, not undocumented signed fields.

Digests are lowercase hexadecimal SHA-256, except the root’s explicitly named SHA3-512/base64url digest. Unpadded base64url must round-trip exactly, with zero unused bits. A challenge is 32–64 decoded bytes, at least 43 encoded characters; challenge generation, single-use consumption and caller binding are mandatory operational checks. Times use Gregorian years 0001–9999 in UTC `YYYY-MM-DDTHH:mm:ssZ`, without fractional seconds or leap seconds, with expiry after issuance. Schema pattern matches do not replace calendar checks.

**WIRE-VERSION-1.** Document revision **0.17** and wire profile **`sitla-wire/1`** are independent. The protocol field in signed/request records is `sitla-wire/1`; native root contexts are `SITLA/root/1`, `SITLA/continuity/1` and `SITLA/archive/1`. Application domains are `SITLA/approval/1` and `SITLA/service/1`; the browser proof profile is `SITLA/webauthn-approval/1`. An editorial revision does not change any of these identifiers, record bytes, schema contracts or signature validity. An incompatible byte, meaning or algorithm change needs a new wire/subprofile identifier and explicit negotiation, not a silent upgrade based on the prose version.

The frozen descriptor remains version 1 under its original method. Current identity/history uses version-2 descriptors, `did:sitla:v2`, `sitla-key-history/2` and `sitla-did-history/2` under [DID History](protocol-did-history.md); its deterministic native contexts are `SITLA/root/2` and `SITLA/continuity/2`. A v1 identity is not relabeled as v2. Frozen [v0.1](../artifacts/v0.1/vectors/core.json) and [legacy v0.2](../artifacts/v0.2/vectors/core.json) artifacts retain their original `sitla/0.x` fields/contexts. They can still be verified under their explicitly selected legacy profiles, subject to ordinary status/expiry/authority policy; they are not rewritten or relabeled as wire/1. Unsupported legacy operations fail explicitly. Merely publishing this revision does not revoke an old grant.

## 2. Root Descriptor and Immutable Document Projection

*Resolve locally from the signing descriptor. No operator domain, communication key or endpoint enters the root hash.*

[Descriptor schema](../artifacts/wire-v1/schemas/identity-descriptor.schema.json) allows exactly `version: 1`, `identitySuite: ML-DSA-44` and `identityPublicKey`, the 1,312-byte public key in unpadded base64url. Hash canonical descriptor bytes with SHA3-512, base64url-encode, and prepend `did:sitla:v1:`.

**WIRE-2.** Reconstruct exactly the immutable root projection represented by the frozen [DID-document schema](../artifacts/wire-v1/schemas/did-document.schema.json) and fixed document vector. This schema is a component fixture, not the full current DID-document admission contract. For derived DID `D` and descriptor public key `P`, the root projection is:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "D",
  "verificationMethod": [{
    "id": "D#root",
    "type": "urn:sitla:verification-method:akp-jwk-v1",
    "controller": "D",
    "publicKeyJwk": {"kty":"AKP","alg":"ML-DSA-44","pub":"P"}
  }],
  "authentication": ["D#root"],
  "assertionMethod": ["D#root"],
  "capabilityDelegation": ["D#root"]
}
```

`D` and `P` above are substitutions, not literal wire values. This historical projection does not define the current full document. The version-2 document adds public license and subset-history metadata under [Portable DID Document History](protocol-did-history.md). The descriptor and this immutable projection remain derivable offline; mutable signed history is supplied and verified separately. A missing history is not accepted as the current document, and the frozen schema is not used to reject the required current extension. No extra/private JWK fields, communication methods, service endpoints or `keyAgreement` appear. **DID-REP-1.** Resolution produces **`application/did+json`**, using the [DID Core JSON representation](https://www.w3.org/TR/2022/REC-did-core-20220719/#json). Consumers MUST preserve and process the named properties as JSON; they MUST NOT apply JSON-LD expansion, compaction, term dropping or context retrieval to this profile. The literal `@context` member is retained in the fixed JSON shape but does not select `application/did+ld+json`. That representation is unsupported and a resolver must return `representationNotSupported` rather than fabricate a JSON-LD view.

This is a fixed JSON DID profile using RFC 9964’s **AKP JWK representation**; its explicit experimental verification-method type does not claim registration or a standard ML-DSA DIDComm/JSON-LD signature suite. Native nonempty-context root signatures still follow Core, not RFC 9964’s empty-context JWS encoding. An independent wallet needs the declared adapter, not a guess based on a JWK’s appearance. Root reconstruction requires neither fetching a context nor contacting the operator.

## 3. Complete Key Replacement and Terminal Revocation

*Every successor replaces the complete set. Removing all keys has an explicit, signed meaning.*

[KEY-2 schema](../artifacts/wire-v1/schemas/operational-key-authorization.schema.json) fixes outer `payload`/`signature`. Sign only canonical payload bytes using pure ML-DSA-44 with fresh hedged randomness and native context `SITLA/root/1`. The 2,420-byte signature must be canonical base64url. Verify against an independently obtained descriptor whose derived DID equals `payload.root`.

**WIRE-3.** `replace-operational-keys` requires 1–16 keys and replaces, rather than adds to, the entire set for that root/series. Omitted keys lose authority under that series. `revoke-operational-keys` requires `keys: []` and permanently closes the series. No successor can reopen it; a later grant needs a new root-authorized series and separate explicit approval. This does not revoke unrelated grants or erase old signatures. The receiver retains known revocations and its highest accepted state; an offline peer may lack the latest record.

Each key has a unique ID, suite and role. Ed25519 and X25519 use exact 32-byte canonical keys; Ed25519 is for authentication/assertion and X25519 only for agreement. The browser-approval profile additionally permits `P-256` for authentication/assertion, encoded as the 65-byte uncompressed SEC1 point `0x04 || X || Y`, where X/Y are 32-byte coordinates. Validate the point on P-256. This does not add P-256 to a separately pinned DIDComm adapter by implication. Resolved operational methods must match the authorized bytes. The series fixes root, operational DID, audience and purpose; changing scope requires a new series. An old key’s independent authority from another series does not disappear by inference.

Sequence zero has null predecessor. A successor increments by exactly one and names SHA-256 of the previous **complete canonical signed record**, including its signature. Re-signing an old payload changes record identity. Require authenticated predecessor continuity or an explicitly accepted checkpoint, monotonic issuance time, retained anti-rollback state, current status and applicable expiry. An exact retry of the same complete signed record is idempotent. Different signed bytes at the same root/series/sequence are `sequence_conflict` and require review; do not silently choose the most recently received record. Signature validity alone does not establish the latest authority.

## 4. Reproducible Requests and Evidence Envelopes

*Hash the exact request the receiver agreed to process. Report a failed verification as failed even when business policy accepts uncertainty.*

[Request schema](../artifacts/wire-v1/schemas/request-evidence.schema.json) fixes protocol/operation, request ID, operator/subject, evidence level, audience/purpose/challenge, times, policy digest and `requirements`. For ZKP, requirements include exact package reference, manifest digest, circuit and scalar parameters; other evidence levels use an empty requirements array. This minimal schema does not define arbitrary predicate programs. Include all fields, including empty arrays, when hashing canonical request bytes with SHA-256.

**WIRE-4.** The [envelope schema](../artifacts/wire-v1/schemas/evidence-envelope.schema.json), approved actions and service assertions bind that request digest and the same request ID, operator, audience, purpose, challenge and policy digest. Their issue/expiry interval is within the request interval. An envelope also matches the requested evidence level. A valid proof for another context is not a response to this request. The request is a context description, not itself payment authority.

**POLICY-BYTES-1.** `policy_digest` is SHA-256 of the **exact published policy-resource bytes**, not a reserialized JSON object, rendered HTML, prose revision number or guessed set of settings. For HTTP, hash the body after transfer/content decoding and before any character, BOM, whitespace or newline transformation. The [fixture policy](../artifacts/wire-v1/policies/example-policy.json) is UTF-8 JSON with indentation and a final LF; both verifiers hash the file bytes directly. If several policies apply, publish one agreed policy manifest pinning constituent byte digests. The same raw-byte rule applies to every operator `policy_refs.*.digest`. Authenticate policy authority and semantics separately; a co-fetched hash does not establish trust. Changing a policy's bytes changes its digest, while editing this specification does not.

The policy fixture's byte string and digest are also in the vector header. `data_digest` hashes exact assertion-data bytes; `terms_digest` hashes the agreed terms-resource bytes. For an action's `payload_digest`, the application must supply the exact reviewed byte sequence and format before approval; it cannot substitute rendered or reserialized content later.

`service-json` requires `not_independently_verified` and null evidence digest. Other levels permit only `valid`, `invalid` or `indeterminate`, and require the digest of the exact evidence artifact bytes. `invalid` cannot be combined with `accepted`. Policy may accept indeterminate status or service trust, but never rewrite an invalid verification. `status_observations` and `limitations` remain required arrays; missing required status becomes unknown/indeterminate, not an empty list of fresh checks.

`verified_by` names the actual verifier and method/implementation, not merely an asserted issuer or a server-supplied claim that the requester ran local code. The envelope is metadata, not an extra signature. When a detached artifact is JSON under this profile, its exact bytes are the canonical full artifact; adapters for other formats define their original byte identity.

## 5. User-Approved Actions and Service Assertions

*Verify who approved the exact action. A service assertion cannot impersonate user approval.*

**WIRE-5.** The [ApprovedAction schema](../artifacts/wire-v1/schemas/approved-action.schema.json) is the `user-signed` artifact. Its payload includes `type: ApprovedAction`, `domain: SITLA/approval/1`, operation, actor, exact operational-authorization digest, external event reference, payload and terms digests, amount/currency, audience/purpose, request binding, times and session/recovery epochs. Sign canonical payload UTF-8 bytes with **Ed25519**, without an extra prehash or JWS wrapper. The signature names the exact authorized method and is 64 canonical base64url bytes. General wallet signing is distinct from an RP-bound WebAuthn ceremony; a passkey adapter needs its own profile.

For `authorize-payment`, amount is a nonnegative integer in the currency’s agreed minor unit, and currency is an explicit three-letter code. Both are null for an action with no monetary term; otherwise both are present. Currency exponent, payee, payer and execution terms must be in the reviewed payload whose digest is signed. Verifiers compare operation, actor/key binding, grant scope/status, both digests, amount/currency, resource, audience, challenge, expiry and current epochs against the pending action. They atomically consume the approval and bind idempotency before an effect. Changing an approved amount or substituting a service key fails authorization, even if some unrelated signature is valid. No generic opaque approval automatically executes an unfamiliar operation. Work-specific VC semantics remain market-defined.

**WIRE-6.** The [ServiceAssertion schema](../artifacts/wire-v1/schemas/service-assertion.schema.json) is the `service-signed` artifact. Its payload fixes `type: ServiceAssertion`, `domain: SITLA/service/1`, operator, request/context/times/policy and `data_digest`. Sign canonical payload bytes with an independently accepted operator **Ed25519** key. The data digest identifies the exact separately supplied assertion-data bytes; those bytes are not an approval or independent issuer evidence. Clients verify the full artifact digest in the envelope, payload binding, signature and operator-key authority. Service signatures never establish fresh human approval.

Neither artifact signs the enclosing evidence envelope; this avoids a circular evidence digest. Complete signature wrappers, not just payloads, are hashed as supporting artifacts. Additional suites require named profiles rather than silent algorithm substitution.

## 6. Browser/Passkey Approval

*Bind the browser ceremony to the same reviewed payload. An ordinary login assertion is not an action approval.*

**PASSKEY-1.** The [passkey artifact schema](../artifacts/wire-v1/schemas/passkey-approved-action.schema.json) has the same `payload` as ApprovedAction and a `proof` containing profile `SITLA/webauthn-approval/1`, suite `WebAuthn-ES256`, `credential_id`, original `client_data_json`, `authenticator_data`, DER `signature` and nullable `user_handle`. Binary fields are canonical unpadded base64url. Do not carry an asserted public key in this proof. The RP uses its independently enrolled credential record, approved origins/RP ID, actor binding, root-authorized P-256 method, user handle, prior counter and backup eligibility. Enrollment/recovery must establish that authority; a credential ID or DID alone does not.

The application presents the exact operation, recipient, payload/terms, amount/currency and scope before invoking `navigator.credentials.get`. The challenge is the **32 raw bytes of SHA-256 of canonical approval payload UTF-8**; the browser's JSON challenge value is that digest in unpadded base64url. The payload already includes a fresh request challenge, audience, purpose and deadline. Reusing a login challenge or hashing a different UI object is invalid. A signature indicates a ceremony, not that the human understood the terms or authored the work.

**PASSKEY-2.** Verify under the pinned [WebAuthn Level 3 assertion procedure](https://www.w3.org/TR/2026/REC-webauthn-3-20260825/#sctn-verifying-assertion), including:

1. Bound input sizes before decoding. Look up the credential under the expected RP/account, never from proof-supplied keys. Strictly parse original clientDataJSON, rejecting duplicate keys even at nested depths; do not require its property order/whitespace to be JCS and do not reserialize it for signing.
2. Require `type: webauthn.get`, challenge equality, and an exact configured origin. This baseline rejects cross-origin ceremonies, `topOrigin`, AppID and unrecognized extensions; separately named profiles are required for those uses.
3. Verify `rpIdHash = SHA-256(expected RP ID UTF-8)`. Require both UP and UV. Reject reserved bits, AT and ED in this extension-free assertion profile; authenticatorData is exactly 37 bytes. Preserve and check BE/BS consistency and enrolled backup eligibility. Supporting other authenticator extensions requires explicit parsing, not truncation.
4. Verify ES256 with the stored P-256 key over **authenticatorData || SHA-256(original clientDataJSON bytes)**. The ECDSA signature uses ASN.1 DER encoding, not raw 64-byte R/S. Apply ECDSA/SHA-256 as defined by ES256 and reject malformed DER. A correct signature does not override a failed RP/origin/challenge check.
5. Check the returned user handle when present, method-to-credential/public-point binding, assertion role, actor/root, grant digest/scope/status, exact action and terms, amount/currency, accepted policy, times and current epochs. Apply WIRE-4 request binding. Neither an authentication-only key nor a service key can approve an action.
6. Check/update counters under RP policy. Zero followed by zero is permitted; a non-increasing counter when either is nonzero is a risk signal requiring refusal/review in this baseline, not proof of a clone. Counter checking does not replace single-use challenges. Atomically consume the request/approval and update current counter/epochs before an effect; independently valid concurrent assertions must not execute twice.

**PASSKEY-NOTICE-1.** For payment approvals, the RP SHOULD send a complementary notification through a pre-enrolled route independent of the approval UI, recording the committed amount/currency, recipient, transaction reference and a safe reporting route. Derive those details from the exact authorized/committed transaction, not untrusted page text. Where practical, also notify at approval time before an irreversible commitment; a post-commit notice only supports detection and response. Minimize notification content and never include a bearer approval or secret. WebAuthn authenticates the challenge at the RP origin, not the truth of displayed wording or human understanding; this recommendation does not create trusted-display attestation, a second approval factor or a guaranteed cancellation window. Publish unavailable/failed delivery behavior and any stronger risk-based hold/review policy. An independent notification is not an independent cryptographic verifier.

The [wire/1 fixtures](../artifacts/wire-v1/vectors/core.json) include a root-authorized P-256 key, enrolled RP record, signed browser-shaped data and negative cases with valid cryptographic signatures but wrong RP/origin/challenge/flags/role/time. These are synthetic interoperability fixtures, not a hardware attestation or browser end-to-end certification. The reference verifies the static ceremony; production RP storage, enrollment, trusted time, UI integrity and atomic effects remain caller responsibilities. Routine passkey login and peer/offline signing retain their separate profiles.

## 7. Public Fixtures, Independent CI and Remaining Work

*Test each rejection layer independently. A cryptographically valid record can still be forbidden by its meaning.*

[wire/1 vectors](../artifacts/wire-v1/vectors/core.json) include real public keys and signatures, fixed canonical strings/digests, local DID reconstruction, complete replacement and terminal revocation, request binding and both signed artifact types. Semantic-failure root records were signed **after** introducing their invalid condition with disposable fixture keys. Their signatures must verify before their calendar, predecessor, duplicate-key or encoding failure is asserted. Signature-substitution failures are separately labeled. Private signing keys were discarded and are not distributed.

Adversarial fixtures cover nonexistent calendar dates, uppercase digests, nonzero base64url unused bits, nested duplicate fields, unsafe integers, duplicated key IDs, suite/role swaps, contradictory evidence outcomes, changed amounts, wrong requests, old contexts and attempts to reopen revoked series. The operational `did:example` identifiers and fixture trust map are not live endpoints or proofs of real-world authority.

The docs repository’s push/PR CI runs Node.js/Ajv/native crypto and an independent Python implementation using `jsonschema`, `dilithium-py` and `cryptography`. It does not depend on application tests. A targeted mutation suite disables 32 security checks individually and requires the fixed vectors to detect every mutation; syntax/import failures do not count as detected security errors. This is bounded coverage, not proof of a complete verifier. See the [reference README](../reference/README.md) and repository test commands. The byte reference implements explicit byte/depth/traversal, duplicate-field, ceremony and calendar checks; deadlines, rate limiting, live state and authenticated service policy remain caller responsibilities.

The specification is a design draft, not a confidentiality label or complete production standard. Publishing schemas and passing these vectors does not establish full wallet/DIDComm interoperability, audited predicate correctness or deployment readiness. External contribution rights and grants follow [CONTRIBUTING.md](../CONTRIBUTING.md). Operator legal policies are separate from wire conformance.

## 8. Verification Coverage Boundary

The original [core set](../artifacts/wire-v1/vectors/core.json) is frozen at 8 schemas, 18 positive, 60 negative and 7 malformed-wire fixtures. The separate [synced-passkey set](../artifacts/wire-v1/vectors/passkey-synced.json) adds 3 positive records and 3 cryptographically valid semantic negatives without changing those bytes. It includes a root-signed P-256 authorization, BE=1/BS=1 and a 0→0 counter assertion; a missing origin, counter rollback and BS without BE are rejected. Node and Python each validate these records and signatures.

Independent verification here means two repository-maintained implementations: Node/TypeScript and Python. Account-profile coverage is unsigned subject schemas and identifier/transition relationships; lifecycle coverage is synthetic signed receipts, schemas, canonical request binding, scope, freshness, retention and negative cases. It does not cover live issuer authority, registry uniqueness, actual deletion/settlement, cross-operator migration, complete signed account VCs, hardware/browser end-to-end behavior or independent Rust/Go/third-party implementations. No such third-party reproduction has been performed by this project. Keep these limits with any claim of independent verification; test counts alone do not extend the covered behavior.

## Supplemental payment artifacts

[Public Payment Wire Artifacts](protocol-payment-wire.md) define separate online schemas and synthetic signed records/bundles. Their operator JWS, holder-evidence bindings and historical event checks are exercised by Node and independent Python without the private application. They do not change the frozen `sitla-wire/1` set or establish current provider execution/status, legal compliance or third-party Rust/Go reproduction.
