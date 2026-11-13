# Wire Artifacts

*SITLA Protocol v0.2 — Minimum Interoperability Subset*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 14, 2026

## 1. Scope, Encoding and Version Boundary

*Independent implementations need identical bytes and rejection rules. A newer protocol does not rename a holder’s identity root.*

This subset fixes ID-1 descriptors/documents, KEY-2 operational authorization, evidence requests/envelopes, EVID-2 approvals and service assertions from [Core](protocol.md). Schemas do not authenticate an issuer, grant permission or establish real-world truth. Credential-format adapters, full operator discovery, live status and transport profiles remain separate.

**WIRE-1.** Use the linked JSON Schema draft 2020-12 schemas; reject unknown fields. Wire objects are canonical UTF-8 without BOM, using the RFC 8785 JCS subset: safe integers only (absolute value at most 2^53−1), no negative zero, no unpaired Unicode surrogates, no Unicode normalization, UTF-16 code-unit property ordering, JCS string escapes and preserved array order. Reject duplicate fields at every depth, whitespace and alternate wire spellings. Exact reserialization comparison after strict decoding can detect these ambiguities. Check byte/depth budgets before parsing and enforce collection, time and rate limits. Schema changes require a named profile/revision, not undocumented signed fields.

Digests are lowercase hexadecimal SHA-256, except the root’s explicitly named SHA3-512/base64url digest. Unpadded base64url must round-trip exactly, with zero unused bits. A challenge is 32–64 decoded bytes, at least 43 encoded characters; challenge generation, single-use consumption and caller binding are mandatory operational checks. Times use Gregorian years 0001–9999 in UTC `YYYY-MM-DDTHH:mm:ssZ`, without fractional seconds or leap seconds, with expiry after issuance. Schema pattern matches do not replace calendar checks.

v0.2 uses `sitla/0.2` and new native root contexts `SITLA/0.2/root`, `SITLA/0.2/continuity`, `SITLA/0.2/archive`; signed application payloads fix their own v0.2 domain below. A v0.1 signature is not relabeled v0.2. The root descriptor remains version 1, so the same root key still derives the same `did:sitla:v1` identifier. [v0.1 artifacts](../artifacts/v0.1/vectors/core.json) remain frozen regression inputs, not the current operational-key semantics.

## 2. Root Descriptor and Exact DID Document

*Resolve locally from the signing descriptor. No operator domain, communication key or endpoint enters the root hash.*

[Descriptor schema](../artifacts/v0.2/schemas/identity-descriptor.schema.json) allows exactly `version: 1`, `identitySuite: ML-DSA-44` and `identityPublicKey`, the 1,312-byte public key in unpadded base64url. Hash canonical descriptor bytes with SHA3-512, base64url-encode, and prepend `did:sitla:v1:`.

**WIRE-2.** Reconstruct exactly the [DID-document schema](../artifacts/v0.2/schemas/did-document.schema.json) and fixed document vector. For derived DID `D` and descriptor public key `P`, the document is:

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

`D` and `P` above are substitutions, not literal wire values. No extra/private JWK fields, communication methods, service endpoints or `keyAgreement` appear. This is a fixed JSON DID profile using RFC 9964’s **AKP JWK representation**; its explicit experimental verification-method type does not claim registration or a standard ML-DSA DIDComm/JSON-LD signature suite. Native nonempty-context root signatures still follow Core, not RFC 9964’s empty-context JWS encoding. An independent wallet needs the declared adapter, not a guess based on a JWK’s appearance. Root reconstruction requires neither fetching a context nor contacting the operator.

## 3. Complete Key Replacement and Terminal Revocation

*Every successor replaces the complete set. Removing all keys has an explicit, signed meaning.*

[KEY-2 schema](../artifacts/v0.2/schemas/operational-key-authorization.schema.json) fixes outer `payload`/`signature`. Sign only canonical payload bytes using pure ML-DSA-44 with fresh hedged randomness and native context `SITLA/0.2/root`. The 2,420-byte signature must be canonical base64url. Verify against an independently obtained descriptor whose derived DID equals `payload.root`.

**WIRE-3.** `replace-operational-keys` requires 1–16 keys and replaces, rather than adds to, the entire set for that root/series. Omitted keys lose authority under that series. `revoke-operational-keys` requires `keys: []` and permanently closes the series. No successor can reopen it; a later grant needs a new root-authorized series and separate explicit approval. This does not revoke unrelated grants or erase old signatures. The receiver retains known revocations and its highest accepted state; an offline peer may lack the latest record.

Each key has a unique ID, exact 32-byte canonical key, suite and role. Ed25519 is for authentication/assertion; X25519 is only for key agreement. Resolved operational methods must match the authorized bytes. The series fixes root, operational DID, audience and purpose; changing scope requires a new series. An old key’s independent authority from another series does not disappear by inference.

Sequence zero has null predecessor. A successor increments by exactly one and names SHA-256 of the previous **complete canonical signed record**, including its signature. Re-signing an old payload changes record identity. Require authenticated predecessor continuity or an explicitly accepted checkpoint, monotonic issuance time, retained anti-rollback state, current status and applicable expiry. Conflicting records at one sequence require review. Signature validity alone does not establish the latest authority.

## 4. Reproducible Requests and Evidence Envelopes

*Hash the exact request the receiver agreed to process. Report a failed verification as failed even when business policy accepts uncertainty.*

[Request schema](../artifacts/v0.2/schemas/request-evidence.schema.json) fixes protocol/operation, request ID, operator/subject, evidence level, audience/purpose/challenge, times, policy digest and `requirements`. For ZKP, requirements include exact package reference, manifest digest, circuit and scalar parameters; other evidence levels use an empty requirements array. This minimal schema does not define arbitrary predicate programs. Include all fields, including empty arrays, when hashing canonical request bytes with SHA-256.

**WIRE-4.** The [envelope schema](../artifacts/v0.2/schemas/evidence-envelope.schema.json), approved actions and service assertions bind that request digest and the same request ID, operator, audience, purpose, challenge and policy digest. Their issue/expiry interval is within the request interval. An envelope also matches the requested evidence level. A valid proof for another context is not a response to this request. The request is a context description, not itself payment authority.

`service-json` requires `not_independently_verified` and null evidence digest. Other levels permit only `valid`, `invalid` or `indeterminate`, and require the digest of the exact evidence artifact bytes. `invalid` cannot be combined with `accepted`. Policy may accept indeterminate status or service trust, but never rewrite an invalid verification. `status_observations` and `limitations` remain required arrays; missing required status becomes unknown/indeterminate, not an empty list of fresh checks.

`verified_by` names the actual verifier and method/implementation, not merely an asserted issuer or a server-supplied claim that the requester ran local code. The envelope is metadata, not an extra signature. When a detached artifact is JSON under this profile, its exact bytes are the canonical full artifact; adapters for other formats define their original byte identity.

## 5. User-Approved Actions and Service Assertions

*Verify who approved the exact action. A service assertion cannot impersonate user approval.*

**WIRE-5.** The [ApprovedAction schema](../artifacts/v0.2/schemas/approved-action.schema.json) is the `user-signed` artifact. Its payload includes `type: ApprovedAction`, `domain: SITLA/0.2/approval`, operation, actor, exact operational-authorization digest, external event reference, payload and terms digests, amount/currency, audience/purpose, request binding, times and session/recovery epochs. Sign canonical payload UTF-8 bytes with **Ed25519**, without an extra prehash or JWS wrapper. The signature names the exact authorized method and is 64 canonical base64url bytes. General wallet signing is distinct from an RP-bound WebAuthn ceremony; a passkey adapter needs its own profile.

For `authorize-payment`, amount is a nonnegative integer in the currency’s agreed minor unit, and currency is an explicit three-letter code. Both are null for an action with no monetary term; otherwise both are present. Currency exponent, payee, payer and execution terms must be in the reviewed payload whose digest is signed. Verifiers compare operation, actor/key binding, grant scope/status, both digests, amount/currency, resource, audience, challenge, expiry and current epochs against the pending action. They atomically consume the approval and bind idempotency before an effect. Changing an approved amount or substituting a service key fails authorization, even if some unrelated signature is valid. No generic opaque approval automatically executes an unfamiliar operation. Work-specific VC semantics remain market-defined.

**WIRE-6.** The [ServiceAssertion schema](../artifacts/v0.2/schemas/service-assertion.schema.json) is the `service-signed` artifact. Its payload fixes `type: ServiceAssertion`, `domain: SITLA/0.2/service`, operator, request/context/times/policy and `data_digest`. Sign canonical payload bytes with an independently accepted operator **Ed25519** key. The data digest identifies the exact separately supplied assertion-data bytes; those bytes are not an approval or independent issuer evidence. Clients verify the full artifact digest in the envelope, payload binding, signature and operator-key authority. Service signatures never establish fresh human approval.

Neither artifact signs the enclosing evidence envelope; this avoids a circular evidence digest. Complete signature wrappers, not just payloads, are hashed as supporting artifacts. Additional suites require named profiles rather than silent algorithm substitution.

## 6. Public Fixtures, Independent CI and Remaining Work

*Test each rejection layer independently. A cryptographically valid record can still be forbidden by its meaning.*

[v0.2 vectors](../artifacts/v0.2/vectors/core.json) include real public keys and signatures, fixed canonical strings/digests, local DID reconstruction, complete replacement and terminal revocation, request binding and both signed artifact types. Semantic-failure root records were signed **after** introducing their invalid condition with disposable fixture keys. Their signatures must verify before their calendar, predecessor, duplicate-key or encoding failure is asserted. Signature-substitution failures are separately labeled. Private signing keys were discarded and are not distributed.

Adversarial fixtures cover nonexistent calendar dates, uppercase digests, nonzero base64url unused bits, nested duplicate fields, unsafe integers, duplicated key IDs, suite/role swaps, contradictory evidence outcomes, changed amounts, wrong requests, old contexts and attempts to reopen revoked series. The operational `did:example` identifiers and fixture trust map are not live endpoints or proofs of real-world authority.

The docs repository’s push/PR CI runs Node.js/Ajv/native crypto and an independent Python implementation using `jsonschema`, `dilithium-py` and `cryptography`. It does not depend on application tests. See the [reference README](../reference/README.md) and repository test commands. The byte reference implements explicit byte/depth/traversal and calendar checks; deadlines, rate limiting, live state and authenticated service policy remain caller responsibilities.

The specification is a design draft, not a confidentiality label or complete production standard. Publishing schemas and passing these vectors does not establish full wallet/DIDComm interoperability, audited predicate correctness or deployment readiness. External contribution rights and grants follow [CONTRIBUTING.md](../CONTRIBUTING.md). Operator legal policies are separate from wire conformance.
