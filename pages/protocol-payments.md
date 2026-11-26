# Portable Payment Records

*SITLA Protocol v0.14 — Required for Operator-Mediated Marketplace Payments*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)

The [Collection Agency](protocol-collection-agency.md) profile covers seller-authorized receipt, capture-time price debt discharge and prospective withdrawal across supported payment paths.

The optional [Conditional Payment Instructions](protocol-conditional-payments.md) profile defines interoperable financial instructions without prescribing work or agreement schemas.

## 1. Payment Facts, Not a Work Taxonomy

*Buyers and sellers keep signed records of what the operator actually handled.*

This profile applies when an operator intermediates marketplace payment instructions or observes their execution. It is not required of an identity-only operator. [Marketplace](protocol-marketplace.md) leaves contract, task, milestone, inspection, delivery and acceptance VC schemas to their designers and parties. This profile does not standardize those business judgments or turn a delivery claim into payment authority. Work-specific records are referenced only under an agreed schema and scope.

**PAY-1.** For each supported material payment event handled or confirmed by the operator, the operator MUST issue a signed VC describing its own recorded action or observation and make it independently exportable to both the affected buyer and seller. A dashboard entry, unsigned JSON response, expiring download URL or generic notification is not that VC. Each party can retrieve its copy without the other party's permission, signature, continued cooperation or account remaining open. Provide copies promptly after durable recording; publish issuance deadlines, retry/reconciliation and unavailable/pending behavior. A signing failure is an explicit pending issuance, never an unsigned success or a reason to duplicate payment execution.

The VC is an assertion by the operator. It does not imply the payment provider signed it, that the physical-world contract was fulfilled, or that a decision-maker must accept it as conclusive evidence. Issuer authority and verification policy remain explicit.

## 2. Distinguish Authorization, Holding and Movement

*An approval, a card authorization and a completed payout are different facts.*

**PAY-2.** Declare actual payment capabilities, providers, actors holding funds, supported methods/currencies, fees, timing, expiry, release/cancellation/refund rules and dispute responsibilities before approval. The protocol mandates no payment brand, bank/card method, custody model, milestone sequence or universal escrow implementation. An unsupported escrow flow is explicitly unsupported; a delayed transfer, card authorization or marketplace ledger entry MUST NOT be described as protected escrow merely because funds have not reached the seller.

Issue events for accepted payment instructions and any supported authorization, reservation/hold, capture/collection, release/transfer, payout, cancellation/void, partial/full refund, failure, expiry, reversal and dispute/chargeback state change that the operator actually handles or confirms. These categories describe financial observations, not mandatory work milestones. State whether a result is requested, pending, confirmed, failed or reversed; distinguish authorization from collection, collection from release, transfer from bank payout, and requested refund from confirmed refund. Include the actual financial stage and provider terminology/mapping. A receipt confirms only that event at that time, never irrevocable finality.

Record provider-confirmed results only after authenticating the provider notification/API observation and matching it to the authorized transaction. Browser redirects and user-supplied transaction IDs are insufficient. Deduplicate provider events and retries, reconcile out-of-order or conflicting observations, and reference the original instruction and current financial state. Local actions such as accepting an instruction must be labeled operator-recorded, not provider-confirmed. A provider webhook authenticated with a shared secret is not a publicly verifiable provider signature.

## 3. Minimum Credential Contents

*Enough context travels with each fact to understand who asserted what, for which transaction and on which basis.*

**PAY-3.** The semantic credential type is `urn:sitla:credential:OperatorPaymentEventCredential:1`. Use an explicitly supported VC securing/serialization adapter with issuer authentication, signed validity/status policy and a declared extension context where JSON-LD is used. This document defines minimum claim semantics, not a new `sitla-wire/1` schema, signature context or universal securing suite. Implementers must publish the exact schema/adapter and test interoperability before advertising machine-level compatibility; a ServiceAssertion or ApprovedAction is not silently relabeled as a VC.

The signed VC binds at least:

| Claim group | Required meaning |
| --- | --- |
| Issuer and record | Operator identity, accepted signing-key reference, globally scoped immutable credential/event IDs, schema/adapter version, issuance time |
| Parties and scope | Buyer/payer, seller/payee and their roles using the agreed DID or explicitly operator-scoped identifiers; transaction/payment/allocation IDs and any agreed milestone reference |
| Event and financial state | Actual stage, action/observation and outcome; requested/confirmed/reversed distinction; original event references for refund, cancellation, reversal or correction |
| Amounts | Integer minor-unit amount and currency with declared exponent; amount basis (gross, fee, net, refund or other named component), applicable fees/tax/FX and allocation reconciliation where relevant; no ambiguous total |
| Times | Occurrence/provider-effective time when known, observation/recording time, issuance time and their sources/uncertainties; expiry/release deadline when relevant, never an invented trusted timestamp |
| Basis | Accepted payment instruction/approval references and digests, applicable terms/policy references and exact-byte digests, provider/event references and confirmation method, and any evidence relied on to release/refund funds |
| History and limits | Payment-stream sequence/predecessor reference and digest or another declared authenticated ordering/conflict scheme; correction/supersession links, status/freshness references and the limits of the operator's knowledge |

Use explicit unavailable/not-applicable observations instead of fabricating unknown effective times, fees or provider confirmations. For payment instructions, preserve the approved payer/payee, amount, terms and execution conditions. For holds, identify whose funds were held, by whom, the actual mechanism and release/expiry conditions. For refunds, identify the original payment, affected amount and beneficiary; do not imply seller payout reversal merely from buyer refund. A transaction with multiple sellers/plans preserves each relevant allocation and aggregates without counting the same funds twice. No receipt grants permission to execute another payment.

## 3.1. Explicit money throughout the work flow

**MONEY-1.** Every newly issued SITLA-supported VC containing a recognized monetary value MUST bind its unit in the same signed credential: an uppercase currency code, an integer minor-unit amount and an explicit currency exponent. This applies to public requests, application quotes, work proposals/agreements, financial progress/completion claims, collection authorizations, conditional instructions and operator payment events. A schema may declare common signed `currency`/`currencyExponent` fields covering all its named monetary components, or carry `{amountMinor,currency,currencyExponent}` per money group. Never infer a unit from the server's country, a different VC, a search row, a label such as `amountMinor`, or a provider default. Nonmonetary VCs do not require fictitious currency fields.

The founding SITLA service currently accepts **JPY only, exponent 0**, in supported monetary fields. Recognized missing, mixed or unsupported units are rejected, not silently defaulted, rounded or converted. Prices, fee/net amounts and expense estimates have declared bases and integer bounds. The current minimum offered reward/payment is 500 JPY; estimated expenses may be zero. This minimum is an operator JPY parameter, not 500 minor units for any future currency. See [the founding provider adapter](protocol-stripe-jp.md) and [public request fields](protocol-marketplace.md).

**MONEY-2.** Currency support is extensible through an explicitly published adapter/capability revision identifying codes, exponents, bounds/minimums, fee rules, rounding, provider support and any separately authorized exchange flow. Adding a currency must not reinterpret existing JPY amounts or silently change a saved contract/reservation. Every payment/receipt continues to match the exact agreed currency/exponent and allocation; an authentic signature over another currency is insufficient. No FX conversion, mixed-currency total or new currency support is implied by this draft.

**MONEY-3.** Arbitrary extension fields and free text are not parsed as prices or executable financial instructions. If their author expresses a monetary claim, the author must identify its unit in that VC, but SITLA does not certify unknown field semantics. An extension cannot override a standard price/currency or become a payment amount without a separately supported schema and fresh agreement. Historical signed fixtures retain their original bytes and explicitly historical profiles; these new admission requirements do not retrofit fields or invalidate their old signatures. Implementation/schema updates are required before claiming that every existing Worker issuance path enforces this revision.


## 4. Give Both Parties Their Evidence

*Commercial confidentiality must not deprive either party of the facts needed to understand its own transaction.*

**PAY-4.** Give buyer and seller consistent copies of shared transaction facts and the records materially affecting their obligations, fees or funds. Their records may be identical VCs or role-specific VCs with a common signed event/allocation reference. Do not leak another seller's private allocation, bank/card details, authentication secrets, unrelated purchases or private third-party evidence. Explain deliberate recipient-specific omissions and disclose necessary shared counterparty/transaction facts under the agreed terms and applicable permissions. Do not silently present different amounts/outcomes as the same shared fact.

Protect exports with appropriate authentication/encryption; bearer payment secrets are not export material. Each party can retain and disclose its own evidence for an authorized dispute/review without needing a fresh operator presentation mandate. Export is not permission for unrestricted public publication of the other party's personal information, contract or work. Other separately supported adapters may supplement a complete authorized private copy; current SITLA circulation accepts only complete VCs. A ZKP or online verification verdict alone must not replace the underlying evidence the party is entitled to retain.

## 5. An Independently Usable Evidence Bundle

*A collection of links to the operator's dashboard is not a portable record.*

**PAY-5.** Export the original secured VC bytes, securing-format/schema/context definitions and required verification material, accepted operator key history/authority evidence, status observations with their collection times and any supported continuity evidence. Include a signed manifest binding the party's authorized records and attachment digests, the transaction scope, export time and any missing material. Preserve event ordering and known corrections/conflicts; an issuer signature or a sequence ending at N alone does not prove that no later event exists. Never label an incomplete bundle as a complete final history.

Include the exact approved instructions and available original signatures, applicable agreed terms/policy bytes and the evidence the operator actually relied on, to the extent the receiving party is authorized to retain them. For market-defined contracts, inspections or deliveries, preserve the original signed records and adapter/schema references without imposing a universal work schema. A digest alone cannot reproduce a contract or deliverable. For external media, state what exact bytes were included, what remains an external reference and what is unavailable under [Media References](protocol-media.md). No claim of preservation may rely only on a short-lived signed URL. If an unavailable required attachment prevents independent review, state that limitation explicitly.

The bundle must permit offline cryptographic verification and interpretation of historical observations without an active source account, API token, expiring operator URL or live mandate. A verifier still establishes issuer trust independently. A cached status snapshot proves an observation at its stated time, not present-day validity; export does not create new payment finality. Provider-signed material, when actually available and disclosable, retains its original bytes and independent trust requirements. Otherwise identify the operator's provider observation as such. A private provider reference may aid later inquiry but is not independent proof of its contents.

## 6. Corrections, Closure and Disputes

*Append new facts rather than rewriting an inconvenient history.*

**PAY-6.** Correct mistakes and record refunds/reversals through new signed events referencing the prior records and explaining the change. Preserve originals, conflicts and correction/status history; do not rewrite bytes, erase a prior event from an export, or imply that a valid old signature proves the current balance. Revocation/supersession must state whether an assertion was erroneous or merely followed by a later financial event. A refund does not make the historical capture false.

Both parties retain access to authorized historical exports and necessary later settlement/correction records through appropriately scoped support/case authorization after session revocation or account closure. Deletion does not restore normal login or mandates, cancel obligations or require indefinite storage of all work. Publish retention windows, export availability, limits and a reviewed route for remaining financial matters under [Account Lifecycle](protocol-lifecycle.md). Offer exports before deletion, but do not make successful export a condition of honoring a lawful deletion request. Keep only the records necessary under the declared retention policy; notify affected parties when a material correction becomes available through the declared route.

The evidence package supports independent inspection of assertions, provenance and approval. It does not establish legal identity from a pseudonymous DID, guarantee admissibility or evidential weight in every jurisdiction, certify the truth of work, or replace formal dispute procedures. An operator's clock is not an independent timestamp authority. Stronger timestamps, witnessed logs, long-term signature preservation or provider attestations require separately declared adapters and their actual evidence. Do not market an unimplemented adapter as a legal guarantee.

## 7. Conformance Boundary

| Requirements | Adversarial case | Expected result |
| --- | --- | --- |
| PAY-1, PAY-4–5 | Buyer or seller exports without the counterparty's cooperation, then source operator is unavailable | Authorized original VCs and verification/terms material remain usable; no source session is required |
| PAY-2–3 | Card authorization mislabeled payout/escrow, refund only requested, replayed provider event | Actual stage/basis is preserved; no fabricated confirmation or duplicate execution/event |
| PAY-3–4 | Batch spans sellers; substitute amount, currency, payee or milestone | Exact signed scope/allocations are checked; unrelated private data is excluded |
| PAY-5–6 | Change linked terms, omit a correction, lose an external attachment, expire status observation | Digest/history or completeness failure is explicit; no claim of current validity or retained missing bytes |
| PAY-1, PAY-6 | Receipt signing fails after provider confirmation; delete account before later reversal | Retry issuance without executing another payment; provide later authorized records through restricted case access |

These are provider-neutral duties. The optional [Public Payment Wire Artifacts](protocol-payment-wire.md) now supply exact online/Stripe schemas, original signed synthetic records, evidence-page integrity tests and Node/Python verification. They do not execute or prove live settlement, verify every attachment/status or establish legal qualification. The [Stripe Japan adapter](protocol-stripe-jp.md) describes one provider mechanism. Other bindings must publish their own artifacts/tests; passing frozen wire/1 alone does not implement this payment profile.

## 8. Counterparty recipient-provider history

*An authorized counterparty can inspect limited retained signals without receiving old identities or private case files.*

**PAY-HISTORY-1.** The optional online tool `get_counterparty_payment_history` implements the Core REC-6 recommendation with [public TypeScript definitions](../reference/counterparty-history.ts). It requires a normal authenticated sender-bound session; presentation/read mandates do not authorize it. The request contains exactly:

```json
{
  "context": { "kind": "work", "id": "019a8050-0000-7000-8000-000000000001" },
  "counterpartyAccountUri": "https://operator.example/accounts/SSSSSSSSSSSSSSSSSSSSSS"
}
```

`kind` is `work` or `purchase`; `id` is the UUIDv7 of an existing authorized relationship. This is not an account-directory lookup. Both requester and named counterparty must be the exact opposite parties. A work must be accepted: a proposal alone cannot create access. For a purchase, require the stored seller collection grant or the seller's transaction-specific conditional collection authorization. A buyer-created conditional draft is insufficient. In a cart, a buyer may query each relevant seller, but one seller cannot inspect another seller. Either party can inspect its opposite party's recipient-provider history if that opposite party has a supported binding. That scope never becomes a payer-complaint score.

**PAY-HISTORY-2.** For work, inspect the counterparty's current provider binding in the deployment's payment mode. For a buyer querying a purchase seller, inspect the original frozen seller destination, even after reassociation or grant withdrawal. Do not substitute the latest destination. For historical destination queries, exclude transactions created after a successor-owner association; later status updates of earlier cases remain in scope. An old purchase must not become a monitor of the successor owner's new business. Test/live histories are isolated. An unavailable binding returns `availability: unavailable`, null `bindingHistory` and null `disputes`, never invented zero counts. Unrelated callers, wrong counterparties and nonexistent/unaccepted relationships receive the same `counterparty_history_unavailable` error.

| Returned field | Meaning |
| --- | --- |
| `bindingHistory.hasEarlierBinding` | An earlier retained association of this provider account/mode exists; it may be the same service account reconnecting |
| `bindingHistory.hasOtherAccountBindings` | A retained association with another service account exists, including an association made after a historical purchase; not proof of the same natural person |
| `disputes.observedCases` | Distinct retained Stripe dispute cases linked to transactions with this recipient destination, including earlier owners |
| `open` | `needs_response`, `under_review`, `warning_needs_response` or `warning_under_review` |
| `won` / `lost` / `warningClosed` | Stripe statuses `won`, `lost`, `warning_closed`; not court judgments or findings of fault |
| `unknown` | Observed cases whose current recorded status has no declared category |
| `lastRecordedAt` | Latest retained observation across these cases, or null; not a promise that every case was refreshed then |
| `coverage.completeness` | Always `partial`; zero observed cases is never a clean-history certificate |

Only these flags/aggregate counts and scope/freshness/limitations are disclosed. Do not expose old account URIs/DIDs, provider/binding/case/payment IDs, amounts, allegations, correspondence or individual case dates. A case involving several recipient destinations can be linked to each destination while disputed allocation/responsibility remains unknown. Do not present these aggregates as individual seller fault, identity continuity, a universal reputation or Sybil protection. Shared business accounts and new provider accounts limit their meaning.

**PAY-HISTORY-3.** The Stripe adapter records authenticated `charge.dispute.*` notifications by retrieving the latest dispute, payment and captured charge from the platform API under the purchase coordinator. Check mode, purchase/payment/charge linkage, amount and currency before recording. Count once per provider/mode/dispute, not per webhook, case status or recipient copy. A late notification retrieves current API state instead of trusting its stale embedded status. Unsupported/mismatched observations do not enter the summary. Retry recording failures; do not acknowledge a lost update as completed. Recorded provider observations necessary for financial history survive deletion/rebinding, subject to the stated retention policy. Unverified complaints do not overwrite those facts; requests for correction use the published operator route and authenticated reconciliation.

The current tool does not make live Stripe API calls during a read. Coverage begins with observations actually collected/retained by this deployment; earlier activity, missed notifications, retention gaps, other providers/operators and unreported cases are unknown. No historical backfill or complete coverage start time is asserted. Include these limitations even when all counts are zero, and let the requester choose whether to accept the uncertainty.

**PAY-HISTORY-4.** Return `{record: {payload, signature}}`, with payload type `CounterpartyPaymentHistory`, profile `sitla-counterparty-payment-history/1`, expected operator, requester/counterparty account URIs, exact context, mode, observation time, five-minute expiry, availability, binding scope, aggregates and limitations. Mark `evidenceLevel: service-signed` and `verifiedBy` as the operator. Sign the restricted-canonical UTF-8 payload bytes with the operator's accepted Ed25519 key; `signature` contains `suite: Ed25519`, `key_id` and canonical base64url `value`. This supplemental record is not a VC, a wire/1 ServiceAssertion, fresh holder approval or a provider signature. Verifiers independently select the operator key, check signature, expected parties/context, freshness and their own policy. No new payment or account access is authorized.

Log requester/context/counterparty and read time without duplicating private case data. The authorized recipient may retain the signed assertion for its transaction; access is not blanket permission to publish it. Publish purpose-limited disclosure, retention and correction/contest procedures. Normal access logs are removed on account erasure; necessary financial observations follow the separate financial retention rules.

Application tests cover access/mandate isolation, signed output, retained previous-owner cases, multi-seller privacy, missing/partial history, frozen destinations, mode separation, latest-state deduplication, provider-link failures and deletion retention. Worker/MCP tests exercise proposal rejection and accepted-party access. These are application checks, not an addition to the public payment-VC fixture counts or a third-party/legal audit.


Current SITLA MCP admission, publication and delivery use the signed whole-VC [license and DID recipient policy](protocol-online.md#41-signed-license-and-recipient-metadata). Optional E2EE/ZKP payloads are opaque to the operator. This does not change frozen historical fixtures or imply content-proof verification.
