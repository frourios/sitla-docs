# Portable DID Document History

*SITLA Protocol v0.17 — `sitla-did-history/2`*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 27, 2026

## 1. Purpose and Method Choice

The holder supplies its root descriptor and DID document, including the signed history relevant to a verifier's request. Verification requires local method code and the supplied evidence, not an external resolver service, a SITLA deployment, a domain name or a mandatory public registry. A hash-only DID does not reveal its public key: the descriptor remains necessary. Availability of evidence and knowledge of its latest state are separate from signature verification.

The comparison baseline is [did:webvh v1.0](https://identity.foundation/didwebvh/v1.0/), not its diverging editor's draft. It provides HTTPS discovery, a genesis-derived SCID and signed history, with optional pre-rotation, witnesses and watchers. Its portability preserves verifiable linkage while allowing the DID string to change. Supplied log bytes can also be verified locally; an external resolver service is not intrinsically required.

| Design choice | did:webvh v1.0 | did:sitla with this profile |
| --- | --- | --- |
| Discovery | DID-to-HTTPS mapping | Holder-supplied descriptor and evidence; no domain encoded in the DID |
| Identity anchor | SCID bound to the initial log | Hash of the immutable ML-DSA root descriptor |
| Evolution | Authorized DID-document log updates | Root-authorized scoped key histories; dual-root links between distinct DIDs |
| Extra observation | Optional witnesses/watchers | Verifier-retained heads; optional independently accepted observations outside this profile |
| Integration | Existing implementations and test suite | Custom adapters and independent interoperability work remain necessary |

SITLA chooses a custom method to make domain-independent root derivation and its native ML-DSA authority rules explicit. Adding history is not, by itself, a reason to reject webvh: it already supplies history. Nor does this choice establish greater security than webvh. A deployment whose priority is web discovery and existing resolver integration should consider webvh instead.

The cost is maintaining a complete method specification, cryptographic adapters, fixtures, security review and independent implementations. Existing webvh software cannot be assumed to accept these documents or proofs. Native ML-DSA root proofs do not make conventional operational signatures, server custody or an entire service post-quantum secure. Automatic method conversion and cross-method authority inheritance are not defined.

## 2. Current Document Representation

**HIST-1.** The current DID document MUST contain `history`, including when all history arrays are empty. Its representation is `application/did+json`, with profile `sitla-did-history/2` identified inside `history`. JSON-LD processing and remote context retrieval remain unsupported. The exact top-level members are the fixed root-document members in [Wire Artifacts](protocol-wire.md), plus `licenses` and `history`. The root verification method and all three root relationships remain exactly derived from the descriptor; historical operational methods MUST NOT be promoted into those relationships.

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
  "capabilityDelegation": ["D#root"],
  "licenses": ["CC0-1.0"],
  "history": {
    "profile": "sitla-did-history/2",
    "coverage": "subset",
    "rootDescriptor": {
      "version": 2,
      "identitySuite": "ML-DSA-44",
      "identityPublicKey": "P"
    },
    "keyHistories": [],
    "rootTransitions": []
  }
}
```

`D` and `P` are explanatory substitutions, not literal identifiers or keys. This is a structural example, not a signed positive fixture. `history` has exactly the five members shown. No `didAllowList` member is allowed, even with an empty array.

**HIST-2.** Derive `D` only from canonical `rootDescriptor` using ID-1. Neither `history`, its heads, timestamps, license metadata nor document serialization enters the root hash. This version intentionally changes the descriptor version and DID prefix; a v1 descriptor is not silently upgraded or accepted as a v2 identity. The optional `nextRootCommitment` is included in the root hash when present. No deployed-user migration is required for this empty-service cutover. The root descriptor's version and `did:sitla:v2` identify that derivation algorithm; `sitla-did-history/2` identifies this new document contract.

The outer document is a container, not an aggregate root signature. Authenticate each embedded record and its binding separately. The root fields are reconstructed and compared exactly. A root-document signature or TLS connection alone cannot establish the history's integrity, completeness or freshness. An empty history proves only the descriptor-to-DID relationship; it proves neither that operational keys never existed nor that the root has no predecessor or successor.

## 3. Operational-Key Histories

**HIST-3.** Each `keyHistories` member has exactly:

| Member | Meaning |
| --- | --- |
| `rootDescriptor` | Descriptor of the root signing this series |
| `series` | Exact `authorization_series_id` of every included KEY-2 payload |
| `records` | Nonempty array of complete signed KEY-2 records, from sequence zero through the presented head, in ascending sequence order |
| `headDigest` | Lowercase hexadecimal SHA-256 of the canonical complete final signed record |

Use the [current key-history authorization schema](../artifacts/did-history-v2/schemas/operational-key-authorization.schema.json), pure ML-DSA-44 verification and native context `SITLA/root/2`. Apply KEY-2 and WIRE-3 to every record, not merely to the last one. Require sequence zero with null predecessor, increments of exactly one, exact predecessor digests, invariant root/operational DID/audience/purpose/series and nondecreasing issue times. Verify all signatures and enforce schema/key/role rules. **HIST-SIGN-1.** Signers MUST use FIPS 204 deterministic ML-DSA (`rnd` is 32 zero bytes; the native context is still applied) for `sitla-key-history/2` authorizations and `sitla-did-history/2` root transitions. Persist the exact reviewed payload and complete signed record before transmission. Retry those bytes; do not regenerate timestamps, request IDs, keys or other payload fields. A conforming re-signature of the same payload is byte-identical and is an idempotent retry, including after restoring the same key and payload from backup. Different payloads at the same position remain genuine conflicts.

The signature mode cannot be inferred from a single public signature. If two verified records have identical canonical payloads but different signatures, report `history_signature_profile_mismatch` and refuse that presentation without creating a sticky authority conflict or changing accepted heads. Keep the prior accepted record. This refusal does not endorse randomized issuance; it prevents a nonconforming retry from permanently freezing authority. Original wire/1 hedged records retain their historical context and schema; they are not relabeled as current records.

The history's root MUST be the document root or an endpoint on its verified root-transition path. At most one history for each `(root, series)` is allowed in a document. An unconnected root's key history is rejected. No ordering between independent series is inferred from their sequence values. A revocation with no keys terminates its series; a successor after it is invalid. Complete replacement removes omitted keys from that series without changing unrelated grants.

Historical records can be expired at verification time: verify their signature and structural issuance/expiry interval to authenticate the chain, then evaluate the requested operation at its relevant time and apply current known revocation/status policy separately. Do not reject an otherwise valid archive solely because an intermediate grant has since expired; do not treat that archive as permission to execute now.

Initial presentations include the entire relevant series from genesis. This profile defines no shortened-chain/checkpoint wire format. A larger archive may be transferred separately, but its bytes must be available and verified before declaring the series valid; a URL or digest alone is not verification. Any future checkpoint profile needs explicit independently accepted checkpoint authority and scope, rather than trusting a checkpoint supplied by the presenter.

## 4. Root Changes Between Distinct DIDs

**HIST-4.** Changing the root key creates a new DID. `rootTransitions` is an ordered, connected path of complete dual-signed `DIDRootTransition` records. It may be empty. Otherwise the document's DID MUST occur on the path, no DID may occur twice, consecutive endpoints MUST match and every included root must derive from its descriptor. An incoming link connects a predecessor to this root; an outgoing link identifies a successor. Neither rewrites the document's `id`.

Each transition has exactly `payload`, `predecessorSignature` and `successorSignature`. Its payload has exactly:

```json
{
  "protocol": "sitla-did-history/2",
  "type": "DIDRootTransition",
  "predecessor": "<predecessor did:sitla>",
  "successor": "<different successor did:sitla>",
  "predecessorDescriptor": {"version":2,"identitySuite":"ML-DSA-44","identityPublicKey":"<old key>"},
  "successorDescriptor": {"version":2,"identitySuite":"ML-DSA-44","identityPublicKey":"<new key>"},
  "previousTransitionDigest": null,
  "successorAuthorizationDigest": "<SHA-256 of complete successor KEY-2 record>",
  "issuedAt": "2026-11-27T00:00:00Z",
  "purpose": "root-continuity"
}
```

Both roots sign the same canonical payload UTF-8 bytes using pure ML-DSA-44 and native context `SITLA/continuity/2`; both signatures are canonical unpadded base64url encoding of exactly 2,420 bytes. Root descriptors have exactly the ID-1 fields. Validate distinct endpoints, both DID derivations, both proofs and the timestamp. A valid signature from the new root alone cannot claim somebody else's DID as its predecessor.

The first transition has `previousTransitionDigest: null`; each next transition names SHA-256 of the complete canonical preceding record, including both signatures. Chains presented in this profile start at their transition genesis; no prefix omission is permitted within the presented path. A previously unknown incoming transition can still exist outside the path: genesis here means the start declared by this signed chain, not a proof that the first root has no other history.

`successorAuthorizationDigest` MUST identify a complete record present in `keyHistories` for that exact successor root. Verify its series from genesis. It MUST be a nonempty replacement grant issued no later than the transition time and unexpired at that time, covering `root-continuity` for audience equal to the predecessor DID. This proves the exact initial successor authorization both roots approved. It conveys no account, issuance or payment scope; those require their own grants. Any different successor grant, audience, purpose or digest invalidates the transition. A later terminal revocation remains effective and cannot be undone by replaying this transition.

Both signatures prove authorization by the two keys, not that the same human or legal person controlled them, understood the request or was free of compromise. A transition also does not revoke every grant under its predecessor or automatically disable its root. This profile provides scoped operational revocation, not a global root-deactivation record. Do not report `deactivated: true` without an independently defined authenticated deactivation policy.

The operator-specific `OperatorRootTransition`/`OperatorContinuity` records remain distinct application evidence; they cannot be inserted here by changing their type or stripping their domain/successor-grant binding. Operator identity publication must use this general history format as well as any operator-specific continuity evidence it advertises.

### Optional next-root commitment

**HIST-PRECOMMIT-1.** A version-2 descriptor MAY contain `nextRootCommitment`, exactly the lowercase hexadecimal SHA-256 of the canonical **complete successor descriptor**, including any successor commitment. Absent means no pre-rotation protection; an empty value is invalid. The field is part of the immutable descriptor and therefore the DID. It cannot be added, removed or replaced while keeping that DID.

Before accepting a dual-root transition, the verifier MUST compare the committed digest with the supplied successor descriptor. A transition signed by the stolen old key and an attacker's own new key is rejected when it violates the pinned commitment. Both root signatures and the exact successor grant are still required. Neither a new signature by the old root nor a third-party VC overrides the commitment. This protection assumes an independently accepted predecessor DID/descriptor; first-use discovery does not supply identity trust or reveal unseen forks.

Generate the next root in advance and keep its private key offline or under custody independent from the active key. Only the public descriptor/digest is supplied to the operator. Keeping both secrets on the same compromised host defeats that protection. Because the commitment covers the whole next descriptor, a finite precommitted chain is prepared backwards and ends at an uncommitted descriptor; protection does not silently extend beyond that chain. Users must plan that boundary explicitly. The reference operator's automatically generated signing root is uncommitted by default and advertises no offline-key protection.

This is protection against active-key compromise, not lost-key recovery. If either required root key is lost, a valid dual-root transition cannot be produced; the existing new-account and separately evaluated continuity-VC rules still apply. No service account, balance or private vault is recovered by a commitment.

## 5. Verification and Retained State

**HIST-5.** A verifier performs the following before using history:

1. Require the declared profile and exact fields. Reject duplicate JSON keys, noncanonical encodings, unknown suites/versions and malformed calendar times. Apply WIRE-1 canonicalization to signed objects and digests. Bound bytes, depth, records and signature work before verification. The default canonical document limit is **192 KiB**, depth 32, 100,000 JSON nodes, 128 total key-authorization records and 16 transitions. All bounds apply together; the count ceiling does not promise that 128 signatures fit the byte budget. The reference operator has a separate **256 KiB total HTTP request ceiling**, reserving room for the request envelope. Advertise smaller receiving limits explicitly. Exceeding a limit returns `history_resource_limit`; never accept a silently truncated prefix. Each signed KEY-2 payload/record still obeys its own wire limits.
2. Derive and compare the requested root DID and reconstruct the immutable root fields. Verify all presented root transitions and their connected path, then each key series and head. References are local to the document; do not fetch proof-provided URLs or substitute proof-provided conventional verification keys.
3. Compare authenticated evidence with independently retained state. Index key heads by exact `(root, authorization_series_id)` and retain complete-record digest plus sequence, scope and terminal revocation. Store root-transition digests and endpoints, including known conflicting successors. Compare intermediate records too: an extension must include the known head at its original position, not merely claim a higher sequence.
4. An identical complete record is an idempotent repeat. Reject a lower presented head as `history_rollback`. Different complete records at the same sequence or incompatible predecessors/transition successors are `history_conflict`. Do not choose the latest received or greatest self-declared timestamp. Retain conflict evidence and block authority affected by that conflict pending an explicit external resolution policy; unrelated series remain separately scoped. A terminal series never reopens.
5. Stage state changes until the entire requested document validates, then atomically compare-and-update retained state. Concurrent verification must not overwrite a higher head, erase revocation or hide a conflict. Invalid evidence must not poison accepted heads. A valid conflicting signed record may be retained separately as conflict evidence.
6. Evaluate the exact requested authority using the relevant root/series, audience, purpose, key role, time, status and local acceptance policy. The caller supplies the expected scope and any previously accepted series; the presenter cannot replace a revoked series with a newly invented one to bypass that policy. A new series needs explicit acceptance of its root authorization under that scope's enrollment policy.

**HIST-6.** Report `rootVerification`, `historyVerification` and `acceptanceDecision` separately. Each verification result is `valid`, `invalid` or `indeterminate`; acceptance is `accepted`, `rejected` or `review`. Also return `presentedHeads` (root, series, sequence and digest), `observedAt`, status observations and `limitations`. A valid root with no relevant history gives `historyVerification: indeterminate` for an operational-authority request. A malformed presented record gives `invalid`, not `indeterminate` or a successful root-only fallback.

Every successful history verification still reports `latestState: unknown` unless a separately named freshness/observation policy establishes a stronger, explicitly bounded claim. Local retained heads prevent known rollback; they cannot establish that a first-time presenter disclosed its latest update, every series, every root link or an unseen fork. An empty array is not authenticated absence. A fresh challenge proves recent key possession, not freshness of an accompanying old log. Unknown status remains unknown. Missing evidence or unknown freshness cannot authorize a service effect whose policy requires current authority.

Optional witnesses, independent copies and external status services can improve observation under their separately accepted trust/availability policies. None is mandatory for local verification, and none is silently supplied by a SITLA assertion. This profile does not define a global latest-head oracle, consensus, transparency service or guarantee against colluding/compromised roots.

## 6. Key Loss, Continuity Claims and Privacy

**HIST-7.** If an operational key is lost while the root and required update authority remain available, issue a replacement or terminal revocation in that series. If the predecessor root cannot sign, the presenter cannot create a valid dual-root transition. It enrolls a new root/DID and may independently present friends', employers', municipalities' or other issuers' complete continuity VCs under REC-7/8. These VCs stay outside `history`: neither their number nor their issuer's reputation supplies the missing predecessor signature.

Verify the VC's signature, exact predecessor/successor, basis, scope and status, then let the recipient decide whether that claim suffices for its purpose. Require fresh successor-key possession before granting access. Record this as third-party continuity acceptance, not `historyVerification: valid` for a missing or invalid cryptographic link. It does not rewrite old signed issuers/subjects or automatically recover accounts, vaults, sessions, balances, contracts or payment authority. An unrelated DID in a self-asserted list is not a historical predecessor. A rejected purported dual-root link cannot be relabeled as a valid link by attaching attestations.

**HIST-8.** Public DID documents, including their embedded histories, require exactly `["CC0-1.0"]` and no DID allowlist under the Online MCP policy. Only records authorized for that public use may be embedded. History can expose key reuse, scope, audience and predecessor/successor relationships; CC0 does not establish consent to publish somebody else's personal information or erase other applicable rights. Obtain necessary authority and avoid private routing or account data in public history.

Public discovery MUST default to the root-transition path, the complete series needed to verify its successor grants, and operator-facing series whose audience is the configured operator and purpose is `credential-issuance` or `sitla-online-account`. Other peer, partner and application series remain holder-carried evidence presented only when needed; the service must not aggregate them into a public relationship graph. All documents declare `coverage: subset`, including an empty presentation; no inventory completeness is implied.

A presentation MAY include only the relevant independent series and transition path; it MUST NOT remove records from the middle of an included series/path. This is selection of complete separately signed records, not selective disclosure inside a VC. The current whole-VC rule and rejection of SD-JWT remain unchanged. Private third-party continuity VCs follow their own signed license/recipient restrictions and are supplied separately. Pairwise transport does not make a disclosed root history unlinkable. Optional bilateral E2EE/ZKP payloads do not replace required readable and verifiable history fields, and SITLA does not interpret their contents.

## 7. Adoption and Verification Scope

**HIST-9.** This is the new current document contract. Deployments adopting it MUST require `history`, the declared profile and the public license; they MUST NOT silently accept a document without history as the current representation. No old-document migration, dual-format acceptance or old-client interoperability is required. Keeping the immutable descriptor algorithm does not create an exception to those rules.

The frozen `wire-v1` artifacts remain historical/component material. The current [four public schemas](../artifacts/did-history-v2/schemas/did-document.schema.json), [signed vectors and observation sequences](../artifacts/did-history-v2/vectors.json), [standalone Node verifier](../reference/did-history.ts), independent Python verifier and [bounded TLA+ model](../formal/README.md) cover the new contract. Node verifies ML-DSA with its native crypto backend; Python uses its own JSON/schema and ML-DSA implementation. Neither imports the application repository. The reference operator runs the same signed vectors through its implementation as an additional interoperability check. Those are repository-maintained implementations, not a third-party audit, production deployment proof or a global freshness guarantee.

Required conformance cases for that implementation include valid empty root-only presentation; complete replacement and terminal revocation; dual-root transition; tampered descriptor, signature and predecessor; a missing intermediate record; swapped successor grant; wrong scope; expired intermediate versus expired current grant; post-revocation extension; same-sequence fork; higher-sequence fork diverging before a pinned head; concurrent head updates; rollback; omitted relevant series; truncated tail with no prior observation; transition loop/conflicting successor; root-loss attestation accepted only as a separate trust decision; public-license violation; private-VC injection; and resource-limit rejection. Test cryptographic failures and policy refusals separately.
