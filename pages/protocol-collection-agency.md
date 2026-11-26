# Collection Agency

**SITLA Protocol v0.14 — service profile `sitla-collection-agency/1`**

## 1. Common rule

*The operator receives an identified price on the seller's authority. Seller remittance is a separate obligation after valid collection.*

**AGENCY-1.** Before creating a new payment reservation, obtain seller-authorized receipt for its exact scope. Connecting a Stripe account, publishing a profile or merely logging in is not receipt authority. The buyer's signed payment request includes `acknowledgeDischargeOnCapture: true` and reviews the collection terms. Valid collection under the declared provider adapter of the identified gross price discharges that amount of the buyer-to-seller price debt under this agreement. Uncaptured authorization, a pending payment, return URL or subsequent seller transfer is not the trigger. Later webhook observation records the provider fact; it does not postpone the contractual effect.

**AGENCY-2.** After collection the operator owes seller net remittance under the captured fee/refund terms. Remittance failure, grant withdrawal, publication changes, provider reassociation or operator/processor insolvency do not authorize collecting the same already paid price again. Refunds, fraud, payment invalidity, rescission, chargebacks and statutory remedies have separate legal effects; software does not automatically revive a price claim or create new charging authority. The operator's obligation is not limited to selecting/supervising its processor.

This is a contractual and technical model, not a licensing exemption. Each deployment assesses its actual flows and contracts under applicable law. See the [Stripe Japan adapter's assessment boundary](protocol-stripe-jp.md) for the founding service; generic wallets, unrelated person-to-person transfers and loan recovery are outside these payment paths.

The API names and record examples below describe the current online binding. Its `Stripe`/`JPY` fields and capture identifiers are specified by the [Stripe Japan adapter](protocol-stripe-jp.md); another operator may implement the same authority/debt semantics using an explicitly identified alternative binding. Fees and windows are operator parameters, not protocol constants.

## 2. Seller authorization by payment path

*Authority covers the sale being collected; work inspection is a separate choice of settlement conditions.*

| Path | Seller authority before reservation | Fulfillment / release |
| --- | --- | --- |
| Direct work payment | `accept_work` with explicit `collectionConsent` for that buyer/work, price budget, funding mode, fee and destination | Transfer follows capture under accepted payment conditions; this is not an inspection VC |
| Card-authorization work | Same accepted work consent | Authorization alone discharges no debt; capture triggers collection and then remittance |
| Conditional work payment | Transaction-specific `authorize_escrow_collection` before Checkout | Deposit/acceptance and buyer inspection-settlement or pre-authorized refund follow [Conditional Payment Instructions](protocol-conditional-payments.md) |

**AGENCY-3.** Public trust-reference registration is free and grants no receipt authority. Additional data or qualification requests for compensation are ordinary work; no paid-profile reservation or standing profile grant is admitted. Historic signed records remain verifiable under their original binding.

**AGENCY-4.** For work, seller `accept_work` includes `collectionConsent` with `authorizeReceipt`, `dischargeOnStripeCapture` and `authorizeRefundsUnderAgreedTerms`, all explicitly true. The grant binds buyer/work, terms digest, agreed budget, direct/manual-capture funding mode, provider destination, currency and fee. Partial payment reservations cannot exceed the agreed budget, counting other unexpired reservations. Withdrawal does not terminate the work contract or rewrite the agreed terms; new payment reservations under that grant are blocked.

Direct work payments do not require the conditional profile's `inspectionConfirmed` or `performanceDigest`. Capture/payment receipts prove operator-observed financial facts. They do not claim inspection, actual human work, delivery, quality or irrevocable settlement. A buyer needing inspection-controlled release chooses the conditional-payment path.

## 3. Withdrawal and immutable reservations

*Withdrawal stops new reservations. Existing transactions retain the consent on which they were admitted.*

**AGENCY-5.** `revoke_collection_authorization` requires the seller's signed approval and names an exact authorization UUIDv7. Only its owner may withdraw it. The operator records withdrawal time, marks the grant/status withdrawn, and makes it ineligible for new reservations. The status is prospective: it does not erase the original signature or invalidate observations of transactions admitted before withdrawal. Use `list_collection_authorizations` to inspect scopes/statuses.

**AGENCY-6.** New reservation admission and the active-authority check share one atomic database statement, including current seller eligibility, work scope and active provider binding. If withdrawal wins that ordering, no reservation or Checkout is created. If reservation wins, store immutable copies of authority ID, original approval digest and credential references, scope, fee/refund terms, price, work budget/funding mode, and destination. A later withdrawal must not mutate these copies.

Existing reservations may continue to payment or capture under their existing authority; refund, remittance and evidence export remain possible after withdrawal. A retry with the same buyer/mode/request ID and identical request uses the original reservation, including when the original grant is no longer eligible for new reservations. Reusing that ID for another request is rejected. Expired reservations cannot be revived by a retry. Reservation opening/expiry windows are declared by the adapter and frozen before approval; expired reservations cannot be reopened. The [Stripe Japan adapter](protocol-stripe-jp.md) defines the current online windows. Uncaptured authorization follows the actual provider capture window.

**AGENCY-7.** A remittance retry reconciles provider transfers and uses the same deterministic transfer idempotency key and captured destination. It must not create a second Checkout, re-authorize a new charge or substitute the seller's latest destination. Mark successful collection independently of transfer success: the recorded price debt stays discharged while remittance is pending. Never report uncaptured funds as collected.

## 3.1. Historical deferred destinations

The current Stripe adapter admits no new pre-connection collections through any payment path. Historical null-destination evidence remains verifiable and its seller obligations survive; assign a verified destination only under the original seller authority and retain the assignment history. See [Stripe Japan](protocol-stripe-jp.md).

## 4. Portable evidence and privacy

*Both parties can independently prove the relevant collection authority and captured payment conditions.*

[Public schemas, signed vectors and independent verifiers](protocol-payment-wire.md), with [TypeScript record definitions](../reference/collection-agency.ts), describe the consent, authorization, withdrawal and VC subject fields.

**AGENCY-VC-1.** The online adapter issues `CollectionAuthorization` VCs with subject profile `sitla-collection-authorization/1`. Fields include `authorizationId`, `agent`, `processor`, seller reference, processor account/mode, currency, fee basis points, refund policy, scope, issue observation and `approval` references. The operator secures the wrapper; the seller's original signed `ApprovedAction`, key authorization and digest-pinned reviewed context remain the holder evidence. Work grants are delivered to both work parties.

**AGENCY-VC-2.** Each capture/payment-event VC identifies the relevant seller authorization, allocation gross amount and `buyerPriceDebt: discharged-on-valid-stripe-capture`, `noSecondCollectionFromBuyer: true`, plus the separate seller-remittance obligation. For multi-seller Checkout, the receipt for one seller covers that allocation only; it never claims another seller's price debt or leaks unrelated grants/fields. Aggregate and allocation values must not be counted twice.

**AGENCY-VC-3.** Payment exports include the applicable original grant and seller approval, preserving their bytes even after withdrawal or account closure. A withdrawn status now does not mean the grant was ineligible when an earlier reservation was admitted; verify the captured snapshot and operator observations for that transaction. Retention is limited to financial/legal/dispute purposes under the operator's privacy policy. Other sellers' approvals are not evidence attachments for that allocation.

## 5. Conformance checks

| Requirement | Checks |
| --- | --- |
| AGENCY-1–4 | Missing/false consent, wrong owner, scope or destination cannot authorize a new payment; uncaptured authorization discharges no price debt |
| AGENCY-5–6 | Withdrawal before atomic reservation blocks payment; withdrawal afterward preserves the old reservation's terms; changed work terms/provider binding affect new transactions only |
| AGENCY-7 | Fail remittance after valid capture, then withdraw the grant; reconciliation sends the old net to the old destination without creating another charge |
| AGENCY-VC-1–3 | Both parties export signed authority and capture facts after withdrawal; private profile values are absent; multi-seller receipts contain only their own scope |

The application tests run the real reservation SQL against SQLite and exercise provider failures through mocks. Worker/Stripe Sandbox integration additionally uses actual holder approvals, Checkout, capture, CLI webhooks, transfers and refunds. The public Node/Python [payment fixtures](protocol-payment-wire.md) independently check synthetic records and evidence pages; they do not reproduce private application/Stripe tests. These application lifecycle tests are not a third-party legal/security audit or a licensing decision.


Current SITLA MCP admission, publication and delivery use the signed whole-VC [license and DID recipient policy](protocol-online.md#41-signed-license-and-recipient-metadata). Optional E2EE/ZKP payloads are opaque to the operator. This does not change frozen historical fixtures or imply content-proof verification.
