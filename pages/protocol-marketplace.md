# Marketplace Profile

*SITLA Protocol v0.17 — Optional Design Profile*\
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

The [Online MCP Adapter](protocol-online.md) declares supported work payments. [Conditional Payment Instructions](protocol-conditional-payments.md) additionally specifies captured payments, author-signed delivery/acceptance results and narrowly authorized refund/release, without operator adjudication of work or agreement formation. Legal escrow and institution-specific issuance require separate capabilities. [Portable Payment Records](protocol-payments.md) applies to handled financial facts.

Portfolio and delivery media can use external URL references under [Media References and Optional Hosting](protocol-media.md). Operator upload/storage is optional. Parties distinguish a reference, integrity-checked artifact and controlled-access entitlement before agreeing a price; a self-issued media link is not independent evidence of the work.

## 6. Public job-request credentials

**JOB-1 — Scope and publication.** SITLA specifies public request listing, summary search and ordinary DM contact. A request is a complete, requester-issued `urn:sitla:credential:JobRequest:1` VC under `SITLA-vc-jwt/1`. Its issuer and subject are the requester's current `did:sitla`, and its original signed `licenses` is exactly `["CC0-1.0"]` with no recipient restriction. Enrollment, issuer authority, signature, current status and holder-approved publication are separate prerequisites; storing a generic VC does not publish a request. The reference operator exposes this contract through the operations listed below; runtime capability discovery identifies the deployed revision.

The requester reviews publication of the **entire VC**, including the fields absent from search. CC0 covers its detailed text, applicant conditions and extensions as well as the summary. Database omission is not confidentiality. Do not include secrets, third-party information without necessary rights or private negotiations. A stopped listing, expired/revoked VC or account closure cannot revoke CC0 permissions or remove the published original from ID-based retrieval. Publication grants the archive durable public serving rights; it is more than permission for third-party caches to retain copies. Private negotiation/progress credentials instead use the signed SITLA license and counterparty DID rules in [Online §4](protocol-online.md#41-signed-license-and-recipient-metadata).

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

The request's required top-level `validUntil` is its listing/publication expiry, not a second independent deadline field. `validFrom < validUntil`; reject invalid calendar dates and expired requests on fresh publication admission. Time fields use UTC `Z`, with optional millisecond precision. A preferred delivery date is not a contractual deadline and need not follow the listing expiry. No monetary fields inherit their units from another credential, operator locale or payment provider; apply [MONEY-1](protocol-payments.md).

**JOB-3 — Original in a private vault, minimal projection in a lightweight index.** Archive the exact complete signed VC and its issuer-authority evidence in the private original vault before publishing an index. The lightweight index stores only the immutable credential ID/digest and internal original locator, requester DID/account reference, summary, the two explicit money groups, proposed completion licenses, validity/preferred delivery times, and the minimum publication/status timestamps needed for lifecycle handling. Listing responses expose that lightweight projection with an original-retrieval reference and observation/cache metadata; they do not expose private vault credentials or internal bucket access.

Never copy `details`, `eligibility` or `extensions` into the lightweight index: not in the listing row, full-text indexes, embeddings, token indexes, operation summaries or duplicate contact records. Do not search, filter, rank or advertise semantic matching on those omitted fields. A keyword that appears only in details/conditions/extensions is not a supported search match. Fetch the **full original** through an operator/MCP retrieval operation backed by the private vault when those fields are needed. The underlying original store stays private; that operation serves only a previously published CC0 source; archived ID retrieval is independent of present listing, validity/status, DM reception or account state. A body hash alone cannot reveal or validate its contents; unavailable originals fail explicitly rather than returning a reconstructed or unsigned VC. Index metadata and search results are discovery hints, not issuer evidence or a freshness guarantee.

**JOB-4 — Listing state and caches.** Published/open, stopped and expired are service listing states, distinct from the issuer's signed credential status and CC0 reuse rights. Fresh authoritative queries should exclude closed, expired or revoked requests, but cached lists/copies may still show them, omit new requests or contain older projections. The service does not promise immediate purge or globally consistent listing periods. Responses identify the referenced original and when the projection was observed; a service-signed response attests that response, not current job availability or the issuer's truthfulness. Stopping a listing only hides it from discovery. The original and issuer authority remain available by stable ID without expiration, including after account deletion. Revocation/expiry describe validity/availability, not deletion of historical evidence. Return those observations separately; never describe the archived original as a fresh valid offer. Storing a private VC alone never creates this public right. Source-credential IDs must be globally unambiguous in the archive; a conflicting re-publication cannot replace the first original.

**JOB-5 — Direct contact and party-owned negotiation.** Operations are `publish_job_request {credentialId, enableDm:true}`, `unpublish_job_request {credentialId}`, `search_job_requests` and `get_job_request {credentialId, credentialDigest?}`. Publication/withdrawal use normal holder review, signed execution and idempotency. For publication/withdrawal `credentialId` is the immutable vault/publication UUID. Retrieval and payment `jobRequestIds` also accept the issuer-signed `sourceCredentialId` (original VC `id`); aliases must resolve to one archived original. An optional `credentialDigest` pins the original compact-JWS string using canonical-string SHA-256. No digest or active account is needed merely to find a known public original. The reference service also exposes unauthenticated `GET /api/job-requests/{URL-encoded ID}`.

There is no application VC profile, submission API, application inbox or operator-managed negotiation stage. Interested participants send ordinary credential DMs to the requester's current DID (or agree on an external channel). They may include the request ID/digest as opaque context. A message has the ordinary VC license/recipient, signature, blocking and technical rate-limit rules; DM receipt is not acceptance, a contract, automatic vault import or financial authority. A DM may arrive after a posting expires or is withdrawn: it is independent correspondence, not admission against the old posting. Parties verify the original and decide whether to engage.

Sellers with published trust-reference profiles and current public request publishers MUST accept credential DMs. Publication explicitly authorizes enabling reception (`enableDm:true`) in the same atomic commit; existing email-notification preferences are preserved. Reception cannot be disabled while either effective publication remains. Unpublish the seller profile and all current requests first. Expired/revoked publications, account closure and stale controller-DID bindings cease to qualify; cached public copies can still exist. Individual sender blocks, optional email notifications and technical safety gates remain available. Enabled reception is no promise to reply, contract or provide service.

Negotiation, delivery conditions, price, deadlines and completion-VC policies are agreed by the parties, without submitting or exposing the negotiation to the operator. The payment operator receives the necessary payment parameters and an opaque `termsDigest`, not the work agreement contents. Parties may freely pay outside SITLA without a SITLA fee or mandatory payment workflow; no SITLA execution/result-delivery guarantee is attached to that external payment. For SITLA payments, [the result handoff](protocol-conditional-payments.md#8-bilateral-work-results) makes the required author-signed delivery and acceptance VCs the actual portfolio records. Receipt alone is not release authority; the buyer still separately signs the exact financial instruction. Additional arbitrary VCs may circulate independently. Direct and card-authorization payments remain optional alternatives to conditional holding; the operator does not choose the parties' commercial payment model.

**JOB-6 — Independent verification and responsibility.** Every participant and its agent obtains the complete VC when relying on a request, checks its exact bytes/digest, issuer signature/root authority, license, validity/status and the applicable monetary units, then decides its own issuer trust and whether to proceed. A SITLA claim, CC0 label, search ranking, retrieval success or response signature is not a substitute for that verification, identity evidence, truth, current availability or human consent. Unknown/stale status stays unknown; a participant's acceptance of uncertainty does not turn it into fresh-valid status.

The requester/participants are responsible for public request content and for their negotiation/delivery decisions. SITLA provides listing/search/DM transport and does not certify matching, suitability, performance, agreement formation or that the delivered work matches the advertisement. Best-effort indexing/caching can leave displays beyond the intended listing period. Service warranties and liability for these outcomes follow the service terms, including their applicable-law limitations; verification and payment-execution duties are not waived by calling a record CC0. [CC0](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en) governs reuse and includes its own work disclaimers; it is not by itself blanket immunity for operating the service or permission to alter a signature.

The [PublicJobRequests TLA+ model](../formal/README.md) checks the projection/admission/currency/independent-verification boundary. It deliberately permits stale cached display and explicitly agreed changes from posting to contract. It proves neither the truth/quality of work nor the legal allocation of liability.


**JOB-7 — Requester-controlled listing.** Contact, ignored messages, negotiation, contract formation, hiring and delivery MUST NOT automatically hide, close, consume or mark a request filled. A requester may engage multiple people, ignore or block senders, and explicitly unpublish at any time. The signed validity period, revocation and account/safety rules still apply. Withdrawal does not cancel correspondence, agreements or financial obligations.

**JOB-TECH-1.** Contact uses the ordinary DM technical gate, including sender and recipient aggregate rate limits, blocks and overload/storage protection. There is no application count or per-request business capacity. New identities may evade sender-level controls; recipient controls and the residual Sybil limitation must be disclosed. Message retries reuse their scoped operation identity; messages never implicitly republish or close a request. [The publication/DM model](../formal/README.md) checks the shared reception invariant and publication-preserving contact, not delivery fairness or participant cooperation.
