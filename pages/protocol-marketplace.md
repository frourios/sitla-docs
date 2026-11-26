# Marketplace Profile

*SITLA Protocol v0.16 — Optional Design Profile*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 27, 2026

For current online circulation, [Online MCP](protocol-online.md) requires complete issuer-signed credentials with whole-VC license and DID recipient policies. Public trust-reference links identify their original CC0 credential and issuer; publishing them makes the complete source VC available as evidence. Selective-disclosure formats and disclosure paths are not accepted. Work record meanings remain market-defined; a service delivery receipt is not the author's credential signature. An absent predicate is obtained by requesting an issuer's new/derived credential through ordinary paid work, not by treating a custodian's calculation as an issuer assertion.

## 1. Open-Market Scope

*Participants define the work. An operator handles circulation and authorized payment instructions.*

This profile extends [Core](protocol.md); Core Section 2 contains the common assurance limits. Operator branding does not restrict protocol participation by nationality. Buyers may accept an unverified self-description for a small task or require accepted official/institutional credentials for consequential work. Missing evidence remains missing even when the buyer accepts the risk. Public bodies, universities and companies can participate as buyers, sellers or issuers, subject to their own participation authority.

**MARKET-1.** Parties define VC schemas, meanings, signatures and workflows; the protocol mandates no contract/delivery/acceptance taxonomy. A project may use design review, interim inspection, change order, objection, milestone approval or professional-reference VCs in any agreed sequence. Independent agents or contract-management tools interpret them. Unknown semantics do not prevent bounded storage/transport, but are not claimed to be verified. Cryptographic compatibility is separately declared in the [Proof Package Profile](protocol-packages.md).

## 2. Verification and Issuance as Work

*An institution can charge for the agreed examination or issuance process. Payment does not compel a favorable assertion.*

An issuer publishes its procedure, evidence requirements, price and refusal/refund conditions. A requester can arrange face-to-face examination or records checks, prove control of the intended subject's DID, and receive a credential if the issuer approves its own assertion. The same circulation/payment interface can support that request without a protocol-wide definition of a degree or official identity.

The institution's authority, participation conditions and ability to use an intermediary must be established independently. An account name is not official endorsement. Public evidence such as [JPKI certificate fields](https://www.jpki.go.jp/download/howto_iphone/certificate.html) is a possible research input, not an implemented integration or automatic nationality claim. An accepted issuer and its scope remain the buyer's policy.

## 3. Approval, Payment and Optional References

*Evidence can be an agreed input to payment authorization. Receiving an arbitrary VC is not permission to transfer money.*

**MARKET-2.** Payment instructions bind payer, payee, amount/currency, terms reference, idempotency key and explicitly approved execution conditions. When a party delegates condition evaluation to an inspector, agent or external contract system, the instruction names that authority and accepted signal. Unexpected event types, unsupported required proofs or missing authority do not trigger execution. Provider-confirmed events matched to the instruction are payment evidence; a browser return or qualification proof is not.

Payment execution/payout custody use an actual external provider. Escrow, milestone capture/release, refunds, disputes and adjudication require separately declared capabilities and agreements. No offline financial finality is implied by the disaster profile. Numerical fees and who pays processing costs are [commercial information](business-model.md), not protocol requirements or an assurance level.

**MARKET-RECORDS-1.** An operator that intermediates payments MUST apply [Portable Payment Records](protocol-payments.md): issue its signed event VCs to both affected buyer and seller for handled/confirmed instructions, holds, payments, refunds and other supported material financial events. Preserve authorized evidence for independent export, corrections and post-closure settlement without requiring the counterparty's cooperation. This financial-record duty does not prescribe work-specific VC schemas or create an escrow capability.

**MARKET-3.** Parties may issue/export work records and publish selected references under public DIDs. Neither a standard portfolio nor reciprocal ratings/job-count schemas are required. A buyer's public trust references does not permit publication of its purchases, name, exact prices or deliverables without the applicable disclosure permission. Independently created accounts are not automatically linked. Buyer-selected evidence policies assess prominent-name bindings, collusion, invented work and repeated references.

## 4. Illustrative Sequence

*Select the evidence at the decision point. The order and number of work records remain contractual choices.*

1. Search returns `service-json` candidate descriptions; the agent treats them as data, not tool instructions.
2. The buyer chooses service trust, user approval, issuer disclosure or named ZKP and records a local verification outcome when it performs verification.
3. Parties negotiate terms and any desired milestones outside or within a supported service workflow.
4. A required approval uses Core's bound action record; optional work VCs follow the parties' schemas.
5. The payer authorizes a supported instruction; distinguish the provider-confirmed stage/outcome and issue the operator's event VCs to buyer and seller, with original approvals/terms available for authorized export.
6. Parties exchange any inspection/delivery/reference records their agreement requires and disclose them only under their permissions.

The Core API examples distinguish `verification_result` from `acceptance_decision`. This sequence is illustrative, not a mandatory one-payment or final-acceptance state machine. A qualification issuance request may itself be the entire job.

## 5. Conformance and Current Scope

*Test the boundary between an event and permission to act on it.*

| Requirements | Test | Expected result |
| --- | --- | --- |
| MARKET-1 | Use a non-Japanese seller without official VC and an unfamiliar milestone schema | Buyer chooses assurance; no nationality certification or imposed work taxonomy |
| MARKET-2 | Submit a valid inspection VC not covered by payment authority; retry altered amount | No transfer without matching authority; no duplicate or substituted payment |
| MARKET-RECORDS-1 | Close one party's account, export an allocated payment and a later partial refund | Both parties retain their authorized signed facts and correction history; no counterparty permission or dashboard dependency |
| MARKET-3 | Publish a buyer's name based on its public trust references; duplicate reference records | Disclosure requires its actual permission; no protocol-guaranteed career metric |

The [Online MCP Adapter](protocol-online.md) declares supported work payments. [Conditional Payment Instructions](protocol-conditional-payments.md) additionally specifies captured deposits, seller acceptance and narrowly authorized refund/release, without operator adjudication of work or agreement formation. Legal escrow and institution-specific issuance require separate capabilities. [Portable Payment Records](protocol-payments.md) applies to handled financial facts.

Portfolio and delivery media can use external URL references under [Media References and Optional Hosting](protocol-media.md). Operator upload/storage is optional. Parties distinguish a reference, integrity-checked artifact and controlled-access entitlement before agreeing a price; a self-issued media link is not independent evidence of the work.

## 6. Public job-request credentials

**JOB-1 — Scope and publication.** SITLA specifies public request listing, summary search and application reception. A request is a complete, requester-issued `urn:sitla:credential:JobRequest:1` VC under `SITLA-vc-jwt/1`. Its issuer and subject are the requester's current `did:sitla`, and its original signed `licenses` is exactly `["CC0-1.0"]` with no recipient restriction. Enrollment, issuer authority, signature, current status and holder-approved publication are separate prerequisites; storing a generic VC does not publish a request. The reference operator exposes this contract through the operations listed below; runtime capability discovery identifies the deployed revision.

The requester reviews publication of the **entire VC**, including the fields absent from search. CC0 covers its detailed text, applicant conditions and extensions as well as the summary. Database omission is not confidentiality. Do not include secrets, third-party information without necessary rights or private negotiations. A stopped listing, expired VC or revoked credential cannot revoke CC0 permissions already granted to copies. Private negotiation/progress credentials instead use the signed SITLA license and counterparty DID rules in [Online §4](protocol-online.md#41-signed-license-and-recipient-metadata).

**JOB-2 — Required claims.** In addition to the usual signed ID, type, issuer/subject, root authority, validity and license metadata, the request has these `credentialSubject.claims` fields. [The JPY-only admission schema](../artifacts/job-requests-v1/schemas/job-request.schema.json) fixes this shape; signature, issuer/subject equality, calendar/expiry and status checks are additional semantic requirements.

| Field | Meaning and bounds | Lightweight index/search |
|---|---|---|
| `estimatedExpenses` | `{amountMinor, currency, currencyExponent}`; nonnegative safe integer, current code `JPY`, exponent `0`; an estimate, not a reimbursement entitlement | Yes |
| `reward` | Same money shape; at least 500 JPY in the founding service; gross proposed reward before platform fees | Yes |
| `completionLicenses` | Proposed license array for the job-completion VC: CC0 alone, or SITLA internal permission plus optional unknown licenses under the normal policy | Yes |
| `eligibility` | Applicant conditions, plain text up to 8,192 characters; empty means no declared conditions; interpreted by participants | **No** |
| `desiredDueAt` | Preferred delivery time, canonical UTC timestamp; negotiation may change it | Yes |
| `summary` | Nonempty plain text, at most 500 characters | Yes |
| `details` | Nonempty full public request description, at most 32,768 characters | **No** |
| `extensions` | Arbitrary JSON object within the overall VC byte/depth/node limits; preserved verbatim as signed content, semantically opaque to SITLA | **No** |

The request's required top-level `validUntil` is its application/publication expiry, not a second independent deadline field. `validFrom < validUntil`; reject invalid calendar dates and expired requests on fresh publication/application admission. Time fields use UTC `Z`, with optional millisecond precision. A preferred delivery date is not a contractual deadline and need not follow the listing expiry. No monetary fields inherit their units from another credential, operator locale or payment provider; apply [MONEY-1](protocol-payments.md).

**JOB-3 — Original in a private vault, minimal projection in a lightweight index.** Archive the exact complete signed VC and its issuer-authority evidence in the private original vault before publishing an index. The lightweight index stores only the immutable credential ID/digest and internal original locator, requester DID/account reference, summary, the two explicit money groups, proposed completion licenses, validity/preferred delivery times, and the minimum publication/status timestamps needed for lifecycle handling. Listing responses expose that lightweight projection with an original-retrieval reference and observation/cache metadata; they do not expose private vault credentials or internal bucket access.

Never copy `details`, `eligibility` or `extensions` into the lightweight index: not in the listing row, full-text indexes, embeddings, token indexes, operation summaries or duplicate application records. Do not search, filter, rank or advertise semantic matching on those omitted fields. A keyword that appears only in details/conditions/extensions is not a supported search match. Fetch the **full original** through an operator/MCP retrieval operation backed by the private vault when those fields are needed. The underlying original store stays private; that operation serves only the explicitly published CC0 source under its admission/access rules. A body hash alone cannot reveal or validate its contents; unavailable originals fail explicitly rather than returning a reconstructed or unsigned VC. Index metadata and search results are discovery hints, not issuer evidence or a freshness guarantee.

**JOB-4 — Listing state and caches.** Published/open, stopped and expired are service listing states, distinct from the issuer's signed credential status and CC0 reuse rights. Fresh authoritative queries should exclude closed, expired or revoked requests, but cached lists/copies may still show them, omit new requests or contain older projections. The service does not promise immediate purge or globally consistent listing periods. Responses identify the referenced original and when the projection was observed; a service-signed response attests that response, not current job availability or the issuer's truthfulness. Stopping a listing does not rewrite its original or change an already agreed job.

**JOB-5 — Applications and negotiation.** Operations are `publish_job_request {credentialId}`, `unpublish_job_request {credentialId}`, `search_job_requests`, `get_job_request {credentialId, credentialDigest}`, `apply_job_request` and party-scoped application listing. Publication/withdrawal/application mutations use normal prepare/review/signed execution and idempotency. `credentialId` in those operation arguments is the immutable UUID returned by `store_credential`; listing `sourceCredentialId` identifies the issuer-signed VC ID. An application's signed `requestCredentialId` matches that source VC ID, and `requestCredentialDigest` is SHA-256 of the canonical JSON string of the original compact JWS. `apply_job_request` additionally takes `applicationCredentialId` for the applicant-owned stored VC. `get_job_application {id}` returns the party-authorized original. Application claims require `requestCredentialId`, `requestCredentialDigest` and `requesterDid`; optional fields are `quote` with explicit money units, `message` and opaque `extensions`.

Publication approval enables only application reception scoped to that request; it does not enable general DM, email notification or automatic import. No payment-provider connection or payment is needed merely to publish or apply.

A self-issued signed `urn:sitla:credential:JobApplication:1`, with issuer and subject equal to the applicant's current DID, identifies its applicant, the exact request credential ID and canonical-string SHA-256 digest of its `secured` JWS, and its intended requester. It uses SITLA internal permission and the requester's `did:sitla` recipient entry, not CC0 by default. Its original stays in the private vault; the lightweight index needs only routing/source references, submission/status timestamps and idempotency controls. Any applicant quote has its own explicit money units. Applicant conditions and arbitrary extension claims are data for participants, never instructions or automatic acceptance/payment authority. Application delivery is not a contract, a promise of acceptance, proof of eligibility or automatic vault import.

Even if a stale list displayed the request, new application commitment MUST recheck the authoritative listing state, exact original binding, current expiry/revocation, actor/license/recipient authorization and idempotency. A requester DID change requires a new appropriately signed request/application target, never silent rewriting of the old recipient list. No new application after that cutoff is admitted; a previously committed application's receipt may finish afterward. This admission rule does not promise all cached displays have disappeared. Applications admitted earlier may lead to independently signed negotiations/contracts after the posting ends. A new request revision is a new signed VC; do not silently redirect an application to another original or reuse its signature/approval for changed terms.

Final work, expenses/reimbursement limits, fees, delivery/inspection/refund conditions and result-VC issuers/subjects/licenses/recipient lists are agreed in the existing DM/proposal/acceptance flow. `completionLicenses` is a requester's proposal; negotiate its concrete meaning for each issuer and bind both sides' final `resultPolicies` into the work terms digest. It licenses the **VC**, not automatically the copyright in a separate deliverable. Final negotiated conditions can differ from the public posting, but require the parties' explicit agreement and fresh approvals; a party's unilateral change or delivered text cannot rewrite the accepted terms. No sum of estimated expenses and advertised reward is automatically a charge. Current work payments apply fees to the negotiated payment total unless a separately declared adapter says otherwise.

**JOB-6 — Independent verification and responsibility.** Every participant and its agent obtains the complete VC when relying on a request, checks its exact bytes/digest, issuer signature/root authority, license, validity/status and the applicable monetary units, then decides its own issuer trust and whether to proceed. A SITLA claim, CC0 label, search ranking, retrieval success or response signature is not a substitute for that verification, identity evidence, truth, current availability or human consent. Unknown/stale status stays unknown; a participant's acceptance of uncertainty does not turn it into fresh-valid status.

The requester/participants are responsible for public request content and for their negotiation/delivery decisions. SITLA provides listing/search/reception and does not certify matching, suitability, performance, agreement formation or that the delivered work matches the advertisement. Best-effort indexing/caching can leave displays beyond the intended listing period. Service warranties and liability for these outcomes follow the service terms, including their applicable-law limitations; verification and payment-execution duties are not waived by calling a record CC0. [CC0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en) governs reuse and includes its own work disclaimers; it is not by itself blanket immunity for operating the service or permission to alter a signature.

The [PublicJobRequests TLA+ model](../formal/README.md) checks the projection/admission/currency/independent-verification boundary. It deliberately permits stale cached display and explicitly agreed changes from posting to contract. It proves neither the truth/quality of work nor the legal allocation of liability.


**JOB-7 — Repeated applications and requester-controlled listing.** While a request is published, current and eligible for new admission, any number of participants may apply and the same participant may submit any number of intentional applications. Receipt of an application, negotiation, ignoring a submission, contract formation, hiring or delivery MUST NOT automatically hide, close, consume or mark the request as filled. The requester chooses which submissions to ignore/respond to, whether to engage multiple workers and when to explicitly unpublish. Request expiry/revocation and the independently declared account/safety rules still apply; this rule does not extend the signed validity period or cancel existing agreements.

A new intentional submission uses a new scoped idempotency key/submission ID and a fresh holder-approved execution. An unchanged, still-valid application VC may be referenced again; neither `(request, applicant)` nor `(request, application-credential digest)` is a business uniqueness key. An exact retry under the same key returns the original submission/result without another submission or resetting its negotiation/work state. Changed arguments under that key conflict. Parallel admissions must enforce those technical idempotency rules without imposing a per-person or per-request business capacity. Applicant conditions remain participant-interpreted text; they do not silently create a one-application rule.

Each submission, negotiation and work agreement has its own references. A later application does not overwrite a prior one or borrow its consent, and stopping the listing does not cancel previous applications, work or payment obligations. The multi-application TLA+ model explores two applicants and three submission identities (two from the same applicant, sharing an application VC); these are finite checking bounds, not service quotas.

**JOB-TECH-1.** Unlimited repeat/different applicants means no lifetime per-person, per-request or hiring-count business quota. It does not disable operator technical admission controls such as rate limits, storage budgets, overload protection, revocation or abuse policy. Publish these controls and evaluate them atomically at admission. Exact retries of an already admitted submission consume no new capacity and remain retrieval of the old result. Rejection/delay by a technical gate is not automatic unpublication. The requester's `eligibility` text remains participant-interpreted conditions; the operator does not infer or enforce those qualifications from text. New identities can bypass per-account controls, so publish recipient-aggregate controls and the remaining Sybil limitation. The bounded model checks actual `ENABLED Submit` when the declared technical gate permits it, not a tautology about the admission predicate.
