# Wire Artifacts

*SITLA Protocol v0.1 — Minimum Interoperability Subset*  
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)  
**Date:** November 14, 2026

## 1. Scope and Encoding

*Independent implementations need the same bytes and rejection rules, not just similar field names.*

This subset fixes ID-1 descriptors, KEY-2 signed authorization records and EVID-1 evidence envelopes from [Core](protocol.md). It does not yet specify every credential, discovery document, DIDComm adapter, approval record or HTTP API. JSON Schema validation is structural, not proof of a valid signature, accepted issuer or authorized action.

**WIRE-1.** Use the linked JSON Schema draft 2020-12 schemas and reject unknown fields. Wire objects are UTF-8, without BOM, serialized as the RFC 8785 JCS subset used here: finite safe integers only, no negative zero, no unpaired Unicode surrogates, no Unicode normalization, object keys ordered by UTF-16 code units, and JSON string escapes per JCS. Preserve array order. Reject duplicate properties at every depth and noncanonical wire encodings, including whitespace and alternate escapes; a parser can enforce this by exact byte comparison with canonical reserialization after parsing. Bound input bytes, nesting, collection sizes and processing time before parsing. Application metadata outside this subset must not silently enter signed payloads; extensions require a named revised schema/profile.

Digests are lowercase hexadecimal SHA-256 unless explicitly named otherwise; the DID digest alone uses SHA3-512 and unpadded base64url. Base64url MUST round-trip exactly with no padding or nonzero unused bits. Times use valid Gregorian UTC `YYYY-MM-DDTHH:mm:ssZ`, no fractions/leap seconds; `expires_at` must be later than `issued_at`. Local policy additionally checks clock confidence, expiry, audience and challenge consumption. Required semantics cannot be inferred from a JSON Schema match.

## 2. Identity and Operational Authorization

*The root hashes only its signing descriptor. The operational record is signed under that root, not by the replacement key.*

- [ID-1 descriptor schema](../artifacts/v0.1/schemas/identity-descriptor.schema.json): exactly `version`, `identitySuite`, `identityPublicKey`; the decoded ML-DSA-44 public key is 1,312 bytes. Hash the descriptor’s canonical UTF-8 bytes with SHA3-512, then append the unpadded base64url digest to `did:sitla:v1:`. No operator domain enters the hash.
- [KEY-2 authorization schema](../artifacts/v0.1/schemas/operational-key-authorization.schema.json): outer `payload` and `signature` objects. Sign **only** canonical `payload` UTF-8 bytes with pure ML-DSA-44, fresh hedged randomness and native FIPS 204 context `SITLA/0.1/root`. The signature is 2,420 bytes, unpadded base64url. No JWS wrapper or additional prehash is used. `root` must equal the DID derived from the independently obtained signing descriptor.

**WIRE-2.** Authenticate the root descriptor and verify the signature before accepting KEY-2 authority. The payload fixes operation, role, audience, purpose, exact public keys/roles, operational DID, authorization series, sequence, predecessor digest, issue/expiry, status reference and request ID. Key bytes for Ed25519 and X25519 are exactly 32 bytes and cannot swap roles. Key IDs must be unique; authorization must bind the resolved operational DID’s exact methods, not merely a DID-looking string.

For sequence zero, `predecessor_digest` is null. Later sequences increment by one and bind SHA-256 of the previous **complete canonical signed record**, including its signature. Re-signing the same payload produces a different record identity; do not substitute it into an existing chain. Receivers compare the same root and authorization series, verify predecessor continuity or accepted authenticated checkpoints, retain their highest known sequence, and reject conflicting records at one sequence for review. Status and current policy are still required; an isolated valid signature is not current authority.

## 3. Evidence Envelope

*Name who verified what, and keep the decision to accept it separate.*

[EVID-1 envelope schema](../artifacts/v0.1/schemas/evidence-envelope.schema.json) fixes context, operator URI, request ID and SHA-256 of the canonical request, audience/purpose/challenge, mode/times, evidence level, verifier identity/method/implementation, verification result, acceptance decision, policy digest, status observations, limitations and evidence digest. `status_observations` and `limitations` are required arrays, including when empty. A verifier reports missing required status as unknown/indeterminate, not as an empty list of fresh checks.

**WIRE-3.** `verification_result` is `not_independently_verified`, `valid`, `invalid` or `indeterminate`; detailed explanations belong in limitations and the supported evidence artifact. `acceptance_decision` is `not_evaluated`, `accepted` or `rejected` and names the relevant policy by digest. `service-json` requires `not_independently_verified` and a null `evidence_digest`. Other levels bind the exact supporting artifact bytes through `evidence_digest`; verification still requires the declared artifact-specific adapter, authority and holder/status checks. An envelope is not itself an extra signature or proof. Pin the bytes received; if it is signed by another profile, bind its complete canonical envelope and signing domain under that profile. Do not invent an EVID-1 signature algorithm.

`verified_by.authority` names the actual verifier, not the asserted issuer; `method` describes its check and `implementation` identifies the implementation/revision. An authenticated remote server cannot claim the requester ran a local verifier. Pairwise privacy and buyer risk acceptance follow Core; these schemas do not create unlinkability.

## 4. Fixed Vectors and Remaining Work

*Test both successful bytes and rejected substitutions. Passing these fixtures is a minimum, not full conformance.*

[Public vectors](../artifacts/v0.1/vectors/core.json) contain one real public ML-DSA descriptor with expected DID, canonical UTF-8 strings, payload/wire digests, a native-context authorization signature, an evidence envelope, schema-invalid cases, semantic failures, a signature-preserving audience substitution, and malformed wire inputs. The ML-DSA signing key was discarded; no private key is published. The operational `did:example` and illustrative method key bytes are fixtures, not a resolvable Peer DID or a usable delegation. These vectors test wire/signature handling, not deployment acceptance or active authority.

The [Apache-2.0 byte reference](../reference/README.md) is deliberately small. Application tests validate schemas, compare fixed bytes, derive the DID independently and verify the native signature with Node’s crypto implementation, including wrong-context/changed-message failures. Implementations in another language must reproduce those results before an interoperability claim. Full DID document encoding, production Peer DID resolution, all credential adapters, independent wallet exchanges, clock/status policy and device measurements remain deployment work.
