# Portability and Disaster Profile

*SITLA Protocol v0.9 — Optional Design Profile*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 15, 2026

## 1. Purpose and Entry Conditions

*Prepare while connected. During a partition, establish only the trust supported by the material actually available.*

This profile extends [Core](protocol.md) without requiring the original operator, a blockchain, DNS, email, OAuth or internet access. It covers portable credential exchange and local acceptance, not offline payment finality or universal person uniqueness. Core Section 2 defines the shared assurance limits. An authority publishes permitted operations, evidence profiles, time assumptions, disclosure limits, local consumption rules and reconciliation responsibilities before deployment.

**PORT-2.** Supported credentials MUST export with original signed bytes, securing profiles, disclosure/holder material, status references, accepted continuity/delegation and licenses needed for independent use. A local encrypted copy and a tested independent wallet must work without the original operator’s token or mandate. A JSON index or live download pointer is insufficient. Issuer restrictions remain effective. Ending custody does not revoke the qualification or erase disclosed copies. [Portable Payment Records](protocol-payments.md) applies this export boundary to each party's authorized payment VCs, original approval/terms material and recorded status/corrections; historical verification is not offline financial finality.

Routine self-description, professional references and official eligibility have different authority requirements. A local policy can accept anonymous assistance, but cannot relabel missing qualification evidence as verified. Financial transfers, high-value contracts and irrevocable global entitlement decisions are outside the baseline. Responsible authorities must assess safety rather than assume all aid is low risk.

## 2. Preparedness Bundles and Freshness

*Show when the material was last checked and when it should be refreshed. A fresh bundle wrapper cannot refresh an old issuer snapshot.*

**OFF-1.** A signed bundle contains accepted anchor scopes/provenance; root and peer-DID resolvers; operational authorizations; securing-format adapters; issuer snapshots and known revocations; emergency policy; and approved package manifests, locks, verification keys and required verifier code. The holder separately retains encrypted credentials, disclosure material, permitted witnesses and independent signing keys. Device proving also needs the compiled circuit, witness generator, proving parameters and runtime from the [Proof Package Profile](protocol-packages.md). Verification keys alone cannot create proofs.

**OFF-2.** The responsible deployment publishes positive `updateCheckSeconds`, `bundleRefreshMaxAgeSeconds` and `bundleNormalUseMaxAgeSeconds`, with refresh due no later than the normal-use boundary. The client checks for authenticated updates within that cadence while connected and sets `nextRefreshBy` and `normallyUsableUntil` within those bounds after authenticated `reviewedAt`. Concrete [SITLA deployment values](sitla-operator.md) are illustrative and do not bind other authorities. An update failure is visible and retries are bounded. `reviewedAt` records actual review by the named publisher, not just download or repackaging. Refreshing metadata without checking the represented state must not renew this observation.

Issuer credentials, status snapshots, authorizations and packages keep their own signed times and acceptance limits; the wrapper never extends them. A content hash has no expiry, but its safety approval or issuer evidence can be old. The verifier retains prior authenticated revocations and newer observations per issuer/series. It validates the publisher against its existing policy, not a new anchor claimed inside the bundle.

**OFF-3.** Wallet and verifier screens show publisher, review/download dates, required next refresh, normal-use boundary, trusted-time basis and the oldest relevant issuer-status observation. Overdue updates show a warning; bundles older than `bundleNormalUseMaxAgeSeconds` from authenticated review or otherwise past their normal-use boundary default to refusal under normal policy. Unknown time is displayed as unknown, not zero age. An authorized emergency exception may accept selected evidence but records its actual age/uncertainty and the reason. No warning button changes `verification_result` to current validity.

A new local anchor can be introduced only through an explicit recorded out-of-band authority procedure. Compare bundle signatures/digests using previously accepted material; a file labeled "municipality" is not an authority. Export bundles and logs in forms that independent operators can inspect.

## 3. Local Presentations and Pairwise Privacy

*Use a new communication identity for the relationship. Check what the credential payload reveals as well as the message keys.*

**OFF-4.** Use Core's `did:peer:2` transport profile for sensitive local exchanges, with independent Ed25519/X25519 keys and the actual selected DIDComm v2.1 algorithms. Root-signed operational records can authorize local keys, but sending a root delegation in clear links the root. Keep it private unless the user explicitly selects that disclosure. Core KEY-3 lists the actual presentation routes and their linkability. A separately supported holder-binding proof or accepted peer-key issuer credential must establish any claimed qualification-to-presenter relationship without exposing a root when the selected profile promises that privacy.

Pairwise envelopes do not hide stable credential IDs, reusable holder keys or roots inside a presentation. If the wallet lacks a compatible privacy-preserving presentation, offer a named linkable mode with specific consent, or a policy-permitted anonymous/low-assurance operation. Do not silently fall back. A new key or two cooperative signatures do not establish the same physical person; original issuer binding conditions still apply.

**OFF-5.** Supported presentation routes are direct/selective issuer disclosure, a device-generated ZKP, or a deliberately reusable precomputed proof followed by fresh holder-key approval. The precomputed relation binds the authorized presentation key, subject, predicate parameters, purpose/recipient class and lifetime. That key then signs the verifier challenge, audience, event and exact proof digest. Verify both parts and their association. Signing next to an unrelated cached proof is invalid. Reuse may be linkable; a fresh signature does not refresh status or prove a new arbitrary predicate.

A WebAuthn RP-bound passkey is not a general offline peer signing API. Use the separately authorized wallet key and actual supported presentation profile. Partial credential disclosure follows its securing format; [RFC 9901 SD-JWT](https://www.rfc-editor.org/rfc/rfc9901) does not automatically provide arbitrary predicates or unlinkability.

## 4. DIDComm Transport and Minimum Paper Route

*Agree on byte and resource limits before exchange. A paper claim is a different evidence profile from live holder authentication.*

**OFF-6.** BLE and local Wi-Fi are baseline adapter candidates; NFC/QR can bootstrap or carry bounded/segmented records. Store-and-forward media need their own profile. Authenticated invitations supply delivery information; a root DID has no implicit address. Pin the [DIDComm v2.1](https://identity.foundation/didcomm-messaging/spec/v2.1/) encoding, resolver revision, permitted algorithms, attachment handling and method IDs. Core Section 4 defines PQC application attachments; ML-DSA is not an assumed native DIDComm signature.

The local verifier issues an unpredictable single-use challenge bound to peer, operation, event, purpose and requested evidence, and persists its consumption. Pairing/proximity alone does not authenticate an institution. Adapters bound wire/decompressed bytes, assembly count, deadline, CPU/memory and retries before allocation. Altered, incomplete and replayed assemblies fail. Full proving assets or PQC descriptors may not fit a single QR; no LoRa or QR capacity is assumed without measurement.

**PAPER-1.** The minimum battery/phone-failure route is a **printed, issuer-signed minimal Boolean credential**, using a declared compact conventional format and an issuer key already in the verifier's authenticated cache. The QR contains the complete signed minimal claim, issuer key reference, permitted purpose/event, expiry if applicable and status reference when required; an online-only URL is not the offline credential. It must fit the selected QR error-correction/byte profile without truncation. Avoid stable root DIDs, unnecessary PII and full proving bundles. Hand the user a readable description of what the QR discloses.

The staffed verifier validates the issuer signature and policy on its device. A copied paper can be replayed or stolen; paper alone provides **no fresh holder-key possession**. Record `presenter_binding: absent`, clock/status uncertainty and any independently performed face-to-face checks. A signed "resident" Boolean does not establish that the person holding the page is that resident. Stronger checks need their own authority/evidence. Do not infer `user-signed` presence or global uniqueness from this fallback. Where even this evidence is unavailable, discretionary assistance is a separately recorded authority decision.

## 5. Time, Event Receipts and Optional Duplicate Tags

*Fresh challenges stop local replay. They cannot stop two disconnected offices accepting the same entitlement.*

**OFF-7.** Report `mode: disaster-offline`, verifier identity, evidence level, trusted time or `unknown`, cache/package digests, individual status observation times, policy digest, `verification_result` and `acceptance_decision`. An expired snapshot is historical evidence. Known revocation remains known even if emergency assistance is granted; record the exception separately. Missing/old evidence cannot become "not revoked." Reset/drifting clocks need the profile's trusted source and bounded skew; unsupported expiry-dependent checks are indeterminate or rejected.

**OFF-8.** Store minimal encrypted event receipts at holder and verifier: random receipt ID, event domain, presentation digest, actor/authority scope, observations and decision. Local consumption is atomic. On reconnection, authorized authorities recheck available status, exchange only permitted records, flag duplicates/conflicts and append reconciliation outcomes without rewriting historical observations. No automatic recovery of physical goods or publication of private beneficiary/location histories follows.

**DEDUP-1 — experimental, not baseline.** An authority may later introduce an event-scoped tag from an issuer-certified stable holder secret and the authority-selected canonical event domain. Its audited proof must bind the tag, eligible subject, stable lineage and expected domain; rotation or self-created accounts cannot create new entitlement lineages. Accepted authorities/issuers and cross-office event naming are part of that profile. No concrete PRF/circuit is approved here.

Hashing a public presentation key with an event is not an anonymous-person guarantee: new keys evade deduplication and public keys can enable correlation. A valid event tag intentionally links records **within that event**, not across unrelated events. Proof and leakage analysis, storage/access policy and issuer enrollment assumptions are prerequisites. Tags can accelerate authorized reconciliation but do not prevent partition-time duplicate acceptance, unequal issuer records or colluding issuers. Do not advertise this capability before implementation and review.

## 6. Drills, Tests and Deployment Status

*Test devices and people together. An untouched emergency bundle is not readiness.*

**DRILL-1.** Participating municipal/site operators test inventory, batteries, backup staffed devices, offline trust material and the paper route within the published positive `drillMaxIntervalDays` and after material policy/format changes. A drill disables internet/origin-service access, includes a lost/dead user phone, an old bundle, a reset clock, a stolen/copied QR and reconnection conflicts. Record staff training, refresh completion, failure handling and operational owner; a software-only test does not establish readiness.

| Requirements | Test | Expected observation |
| --- | --- | --- |
| PORT-2, OFF-1 | Export to independent wallet; disconnect origin, proxies and the original operator | Supported cached verification works; missing proving assets are explicit |
| OFF-2–3 | Present a bundle exceeding its configured normal-use bound, newer wrapper over old status, or unknown clock | Correct warning/refusal or explicit authorized exception; no fabricated freshness |
| OFF-4–5 | Inspect pairwise payload; send an unrelated cached proof and fresh signature | No silent root/reusable-key leakage; subject/key/proof mismatch rejected |
| OFF-6, PAPER-1 | Alter chunks; copy QR; remove user battery and network | Bounds/replay controls apply; paper has no invented holder authentication |
| OFF-7–8 | Redeem at partitioned sites and reconcile | Uncertainty preserved and conflicts reviewable; no global uniqueness claim |
| DEDUP-1 | Change key/domain/lineage or omit tag proof | Unsupported extension explicit; unproven tags cannot be used as unique-person evidence |
| DRILL-1 | Run staffed outage drill with old caches and device failure | Recorded operational outcome, not only a cryptographic test result |

This profile is proposed. It depends on the [Core](protocol.md), actual securing-format support and, for proofs, the [Proof Package Profile](protocol-packages.md). It offers no offline financial settlement. The same public-world limits as Core Section 2 apply.
