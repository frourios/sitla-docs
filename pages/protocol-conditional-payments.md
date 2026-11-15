# Conditional Payment Instructions

**SITLA Protocol v0.6 — optional profile `sitla-conditional-payment/1`**

## 1. Purpose and scope

*Parties agree outside the operator. The operator executes narrowly scoped signed financial instructions.*

A buyer and seller may negotiate by any means and use any work-credential schema. This profile neither requires submission of that negotiation nor asks an operator to decide whether work is good, delivered or legally complete. It standardizes a payment reference, an opaque agreement digest, holder-authorized instructions and portable operator observations. Core assurance limits and the [Portable Payment Records](protocol-payments.md) duties apply. “Conditional payment” is the technical term; this profile does not claim a legally protected escrow account.

**HOLD-1.** Before collecting money, publish the actual mechanism, provider/mode, supported country/currency, fee/net allocation, acceptance deadline, refund deadline and unsupported cases. The immutable transaction binds the buyer and seller account URIs and observed controller DIDs, the exact provider destination, amount, currency and agreement digest. The agreement digest refers to the exact bytes agreed by the parties; the operator does not need the agreement content. For structured agreements, parties must identify their serialization before hashing. No account/provider reassociation rewrites an existing transaction's destination or parties.

The [common Collection Agency profile](protocol-collection-agency.md) applies the same receipt/debt rules to immediate profile sales and direct/card-authorization work payments. Their standing/work-specific authorization and withdrawal are distinct from this transaction-specific conditional flow.

## 1.1. Seller-authorized collection

*The seller delegates receipt before payment. Valid provider collection settles the buyer's identified price debt; later seller remittance is a separate obligation.*

**COLLECT-1.** This profile uses contractual collection agency (`sitla-collection-agency/1`). A buyer first proposes an identified transaction and acknowledges discharge on valid capture. Before any provider checkout session or payment URL is created, the seller MUST authorize receipt for that exact transaction, buyer, price/currency, agreement digest, destination, fee and fixed refund policy. The seller confirms that a genuine underlying price claim exists and that collection is scheduled before or simultaneously with the counter-performance. A connected provider account, account registration, a notification email, an unsigned declaration or the later work acceptance is not this delegation. The seller signs `authorize_escrow_collection`; its CollectionAuthorization VC and original approval are delivered to both parties. No general-purpose wallet, lending recovery, gift or unrelated person-to-person transfer is authorized. Agreement formation and work-specific schemas remain market-defined.

**COLLECT-2.** As between the parties under this collection agreement, a valid, successful capture of the identified gross price by the operator's designated collection processor under the declared adapter discharges that amount of the buyer's price debt to the seller. An uncaptured authorization, processing/unpaid/failed payment, return page, notification VC or seller transfer is not the trigger. The effect is attributed to valid capture, not delayed webhook observation, deposit notification, seller acceptance or eventual bank payout. The operator issues a capture/payment-event VC whose `collection` field identifies the seller authorization, gross price, the adapter's collection-trigger identifier, `noSecondCollectionFromBuyer: true` and the separate seller remittance obligation; it is evidence of its provider observation, not a court determination.

**COLLECT-3.** After valid collection, the operator owes the seller the agreed net remittance subject to the pre-authorized hold/refund conditions. Missing notification, failed seller transfer, operator/processor insolvency or an account closure MUST NOT cause the application to re-charge the buyer for the same already collected price. The operator's remittance obligation is not limited to selection/supervision of its processor. Refund, rescission, fraud, payment invalidity, chargeback and statutory remedies have their own legal consequences; no automatic revival of a price claim or new charging authority is inferred by the software. The buyer's separate debt to a card issuer and unrelated damages obligations are outside this discharge claim.

**COLLECT-4.** The settlement instruction MUST contain `inspectionConfirmed: true` and `performanceDigest`, a lower-case SHA-256 digest of the exact accepted deliverable or market-defined inspection/milestone record. The buyer declares that the agreed counter-performance for this payment has been performed and accepted and authorizes net remittance. The operator verifies the signature, bindings and state; it does not decide work quality or certify that the declaration is objectively true. A missing/false inspection confirmation or a generic delivery VC cannot release money.

These clauses describe contractual allocation, not an exemption determination. Apply the jurisdiction-specific deployment assessment in the chosen adapter; the [Stripe Japan legal-assessment boundary](protocol-stripe-jp.md) is one example. No operator may infer regulatory approval from API support or passing tests.

## 2. Lifecycle

*Payment alone never authorizes release. Seller acceptance starts the accepted hold; buyer instruction permits release.*

| State | Accepted event | Result |
| --- | --- | --- |
| awaiting-collection-authority | Seller CollectionAuthorization VC | awaiting-payment; create buyer-only Checkout URL |
| awaiting-payment | Provider confirms capture | awaiting-deposit; no seller transfer |
| awaiting-deposit | Buyer DepositNotification VC | awaiting-acceptance; deliver the VC to seller |
| awaiting-acceptance | Seller Acceptance VC referencing the deposit instruction | held; deliver acceptance to buyer |
| awaiting-deposit / awaiting-acceptance / held | Seller RefundInstruction VC | refunding; refund full gross amount to the original payment method |
| held | Buyer SettlementInstruction VC referencing seller acceptance | releasing; transfer the agreed seller net |
| Any funded state without a committed decision or provider block | Acceptance deadline without acceptance, or final refund deadline | refunding automatically |
| releasing / refunding | Provider confirms the requested effect | released / refunded |
| Any state | Dispute or conflicting out-of-band refund observation | blocked for automatic new release; record the observation and reconcile |

**HOLD-2.** Seller authority must be durably recorded before Checkout creation and bound into the provider payment metadata. Payment reference knowledge alone grants no authority. Verify the provider's actual payment, mode, merchant ownership, transaction metadata, currency, captured amount and successful charge. A return URL, card token, client secret, charge authorization or unsigned JSON statement is not a deposit confirmation. A reference from an unrelated payment MUST NOT be adopted. The baseline accepts only its own pre-bound provider transaction; it cannot import an arbitrary external charge.

**HOLD-3.** The seller submits CollectionAuthorization before payment. The buyer submits DepositNotification; the seller submits Acceptance and RefundInstruction; the buyer submits SettlementInstruction. Every instruction binds the exact transaction, agreement digest, provider payment reference and predecessor instruction. A settlement references the accepted instruction, not only the payment. Before acceptance the seller can decline by refunding the notified deposit. No silence, message text, agent assertion or generic market VC substitutes for these instructions.

**HOLD-4.** Deadlines are fixed at transaction creation and never restart on payment, notification, acceptance, retry, key rotation or account reassociation. Funded offers that never receive a deposit notification or acceptance still expire to refund. An unpaid Checkout expires instead of being represented as a refund. Refunds return the full gross amount; the operator retains no platform commission on that refund and bears ordinary provider processing fees according to its commercial terms.

**HOLD-5.** Serialize instructions, webhook reconciliation and deadline alarms per transaction. The first durably committed permitted decision wins. At or after the applicable deadline a new release is forbidden. A release committed before the deadline may finish after it; an automatic refund must not race that committed release. Persist decision and retry alarm before external effects, use stable provider idempotency keys and reconcile provider objects before reissuing an uncertain request. Pending refunds are not confirmed refunds. A provider dispute or conflicting external refund blocks automatic release and deadline refund while that provider conflict is unresolved. Provider failures preserve a retryable pending state; repeated failed refunds do not silently create a new release right. Later chargebacks remain possible after release.

## 3. Instruction VC and original holder evidence

The serialization below is the optional current online/Stripe binding. The provider-neutral duties are HOLD-VC-1–3; other bindings publish their exact fields/schemas and use the same semantic distinctions.

*The operator delivers each party's instruction with the original authorization so both sides can export it independently.*

The [public schemas, signed vectors and independent verifiers](protocol-payment-wire.md), together with [TypeScript record definitions](../reference/conditional-payments.ts), describe the instruction arguments and VC subject; the online API additionally validates UUIDv7, lower-case hex, safe integers and rejects unknown fields.

**HOLD-VC-1.** The online adapter secures a `ConditionalPaymentInstruction` as `SITLA-online-vc-jws/1`. Its subject profile is `sitla-conditional-payment-instruction/1`. `action` identifies the five semantic VC types: `collection-authorize` (CollectionAuthorization), `deposit` (DepositNotification), `accept` (Acceptance), `refund` (RefundInstruction), or `settle` (SettlementInstruction). It contains:

- `transactionId`, buyer/seller account URI and observed DID, `assertingAccount`;
- gross `amountMinor`, `currency`, `termsDigest`, `acceptBy`, `refundAt`;
- `instruction`: the exact fields below;
- `approval.operationId` and `approval.evidenceDigest` binding the original holder approval.

```json
{
  "escrowId": "019a8050-0000-7000-8000-000000000001",
  "termsDigest": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "depositReference": "pi_example",
  "predecessor": null
}
```

`predecessor` is null for deposit, the deposit operation UUIDv7 for acceptance, and the acceptance UUIDv7 for settlement. A seller refund references the latest acceptance or, if not accepted, the deposit instruction; before notification it may reference null. `termsDigest` is lower-case SHA-256 hex over the parties' agreed exact bytes. Amounts are safe integers in currency minor units. The current [Stripe Japan binding](protocol-stripe-jp.md) supports JPY only; this is not a provider-neutral currency restriction.

**HOLD-VC-2.** Each party gets an operator-secured recipient copy with the same semantic instruction and original approval digest. Preserve the full signed wire/1 `ApprovedAction`, canonical request/policy bytes, reviewed context/arguments, holder root descriptor and operational-key authorization as a digest-pinned attachment. Ed25519 or the defined WebAuthn approval ceremony supplies holder authorization; the operator's VC wrapper alone is not a holder or institution signature. Verify the original approval, its authorization and bound context in addition to the wrapper. Instruction issuance does not assert successful execution. The operator additionally issues separate payment-event VCs for capture, accepted hold, transfer, expiry and refund observations.

**HOLD-VC-3.** Deliver both copies without requiring the other party's cooperation and preserve instructions plus approval attachments in payment evidence exports, including restricted post-closure exports. Account deletion stops new normal instructions; it does not cancel pending financial obligations or the pre-authorized deadline refund. No operator may present a deleted party's missing keys as available authorization.

## 4. Work history and acceptance policy

*The buyer's settlement instruction is portable work-history evidence; it is not a universal certification of quality.*

A seller may present the buyer-authorized SettlementInstruction together with operator transfer observations and independently retained work VCs. It demonstrates the buyer's signed inspection/acceptance declaration, the scope of its authorization and what the operator subsequently observed. The viewer decides whether to trust that buyer, accept the result or require additional credentials. The profile mandates no job title, milestone, deliverable, evaluation schema or Japanese nationality. Public disclosure of counterparties, prices or work details requires the applicable permissions; an export right is not blanket publication consent.

## 5. Provider adapters and deployment parameters

*Choose a supported mechanism; publish its limits before either party authorizes payment.*

**HOLD-ADAPTER-1.** Each operator declares the provider, countries/currencies and exponents, collection trigger, custody/balance mechanism, minimum/maximum holding and acceptance windows, refund liquidity, exact fee/net allocation, dispute handling and unsupported cases. The fixed transaction snapshots those values. No provider, currency, percentage or duration is a Core constant. A card authorization is not collected funds; a provider transfer is not a bank payout or statutory escrow.

The [Stripe Japan adapter](protocol-stripe-jp.md) describes the current online implementation and provider references. [SITLA Operator Deployment](sitla-operator.md) supplies the founding service's timings and commercial choices. Neither page makes another operator use those choices. The adapter's [public schemas and vectors](protocol-payment-wire.md) cover historical assertion bytes, not provider execution or legal qualification.

## 6. MCP and conformance

*Each mutating tool prepares an approval; only `execute_operation` executes it.*

Tools `create_escrow`, `authorize_escrow_collection`, `notify_escrow_deposit`, `accept_escrow`, `refund_escrow`, `settle_escrow` take `arguments` plus a stable UUIDv7 `idempotencyKey`. They prepare the named operation; review and sign the returned payload, then execute it. `prepare_operation` supports the same operations. `get_escrow` reconciles provider state and returns the transaction's phase/references to either party; it may execute a pre-authorized expiry refund. Use `list_credentials`, `export_account` and `export_payment_records` to obtain the signed VCs and original evidence. The buyer's `create_escrow` includes `acknowledgeDischargeOnCapture: true` and creates a draft without a payment URL. The seller's `authorize_escrow_collection` requires `confirmUnderlyingPriceClaim`, `collectionBeforeOrWithPerformance`, `authorizeReceipt`, `dischargeOnStripeCapture` and `authorizeConditionalRefunds`, all explicitly true, in addition to `escrowId` and `termsDigest`. Only then does `get_escrow` expose Checkout to the buyer; the seller never gets that private payment URL. A deposit request is made only after the human completes Stripe Checkout. A settlement adds `inspectionConfirmed: true` and `performanceDigest` to the four common instruction fields. No private key, card details or Stripe client secret is sent as an instruction argument.

| Requirement | Required checks |
| --- | --- |
| COLLECT-1–4 | No Checkout before exact seller consent; false/missing consent or inspection fails; confirmed capture discharges the price without a transfer; remittance failure never re-bills buyer |
| HOLD-1–2 | Wrong mode, amount, merchant metadata, unpaid session, unrelated payment reference and automatic-payout configuration fail closed |
| HOLD-3 | Wrong party, missing acceptance, changed terms/predecessor and absent holder approval cannot release funds |
| HOLD-4–5 | Unnotified/unaccepted money refunds; acceptance does not extend deadlines; late release loses; competing refund/release has one winner; pending failures retain alarms |
| HOLD-VC-1–3 | Both sides independently export original wrapper and approval evidence; response loss/restarts do not duplicate effects; closure retains settlement evidence |

Unit tests mock provider observations to exercise deadlines and faults. The application integration suite additionally uses real Stripe Sandbox capture, CLI webhook reception, actual holder signatures, zero transfer before settlement, the configured seller-net release and full seller-directed refund. It temporarily switches only the Sandbox platform's payout schedule to manual and restores the original schedule. This is not certification of production safeguarding, legal escrow or long-duration outage behavior.

## 7. Lost keys during an existing transaction

*New keys and a new payment-provider association cannot authorize an old party's instructions.*

**HOLD-LOSS-1.** Show the following consequences before commitment and when users request key/backup guidance. Notify through available registered routes without treating email, support, a continuity VC or a new provider binding as authority to sign for the lost account. A dispute/provider block can delay the automatic effects below. Existing refund obligations and their retries survive closure or loss of both parties' keys.

| Situation | Available protocol effect | User consequence |
| --- | --- | --- |
| Buyer loses all accepted keys before deposit notification | Seller may refund; otherwise fixed acceptance/final deadline refunds collected gross | Payment alone does not begin an accepted job; a new account cannot send the old notification |
| Buyer loses all accepted keys after seller acceptance, before a committed settlement | No replacement buyer instruction; seller may refund, otherwise the fixed deadline refunds gross | Even completed/delivered work may go unpaid through this flow; no operator adjudication substitutes for inspection authorization |
| Seller loses all accepted keys before collection authority | No new Checkout under that transaction | Renegotiate a new transaction if parties choose; never transfer old authority |
| Seller loses all accepted keys after collection but before acceptance | Seller cannot accept/refund by signature; fixed deadline refunds | Rebinding does not let the new account accept the old offer |
| Seller loses all accepted keys after acceptance | Existing buyer may still settle to the frozen old destination; otherwise deadline refund | The new account does not receive old custody or change the destination; old seller cannot send a discretionary refund instruction |
| Release/refund already durably committed before key loss | Finish/reconcile that same provider effect using its original idempotency key | Key loss neither changes the decision nor creates a second charge or competing release |

Paid-profile/direct-work capture has no conditional inspection gate: its existing collection/remittance duties survive key loss and cannot be billed again. Manual card authorization alone is not payment; only an already authorized permitted capture path within the provider window may collect it, otherwise it expires/cancels. Buyers/sellers should retain backups and export evidence before starting long work; split milestones or another expressly agreed supported payment method can limit exposure, but this profile guarantees no compensation for work when required authorization is unavailable. Legal claims and provider/statutory processes remain separate.
