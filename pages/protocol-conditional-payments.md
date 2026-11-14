# Conditional Payment Instructions

**SITLA Protocol v0.5 — optional profile `sitla-conditional-payment/1`**

## 1. Purpose and scope

*Parties agree outside the operator. The operator executes narrowly scoped signed financial instructions.*

A buyer and seller may negotiate by any means and use any work-credential schema. This profile neither requires submission of that negotiation nor asks an operator to decide whether work is good, delivered or legally complete. It standardizes a payment reference, an opaque agreement digest, holder-authorized instructions and portable operator observations. Core assurance limits and the [Portable Payment Records](protocol-payments.md) duties apply. “Conditional payment” is the technical term; this profile does not claim a legally protected escrow account.

**HOLD-1.** Before collecting money, publish the actual mechanism, provider/mode, supported country/currency, fee/net allocation, acceptance deadline, refund deadline and unsupported cases. The immutable transaction binds the buyer and seller account URIs and observed controller DIDs, the exact provider destination, amount, currency and agreement digest. The agreement digest refers to the exact bytes agreed by the parties; the operator does not need the agreement content. For structured agreements, parties must identify their serialization before hashing. No account/provider reassociation rewrites an existing transaction's destination or parties.

The [common Collection Agency profile](protocol-collection-agency.md) applies the same receipt/debt rules to immediate profile sales and direct/card-authorization work payments. Their standing/work-specific authorization and withdrawal are distinct from this transaction-specific conditional flow.

## 1.1. Seller-authorized collection

*The seller delegates receipt before payment. Valid Stripe capture settles the buyer's identified price debt; later seller remittance is a separate obligation.*

**COLLECT-1.** This adapter uses contractual collection agency (`sitla-collection-agency/1`). A buyer first proposes an identified transaction and acknowledges discharge on valid capture. Before any Stripe Checkout session or payment URL is created, the seller MUST authorize receipt for that exact transaction, buyer, price/currency, agreement digest, destination, fee and fixed refund policy. The seller confirms that a genuine underlying price claim exists and that collection is scheduled before or simultaneously with the counter-performance. A connected Stripe account, account registration, a notification email, an unsigned declaration or the later work acceptance is not this delegation. The seller signs `authorize_escrow_collection`; its CollectionAuthorization VC and original approval are delivered to both parties. No general-purpose wallet, lending recovery, gift or unrelated person-to-person transfer is authorized. Agreement formation and work-specific schemas remain market-defined.

**COLLECT-2.** As between the parties under this collection agreement, a valid, successful capture of the identified gross price by Stripe as the operator's designated collection processor discharges that amount of the buyer's price debt to the seller. An uncaptured authorization, processing/unpaid/failed payment, return page, notification VC or seller transfer is not the trigger. The effect is attributed to valid capture, not delayed webhook observation, deposit notification, seller acceptance or eventual bank payout. The operator issues a capture/payment-event VC whose `collection` field identifies the seller authorization, gross price, `buyerPriceDebt: discharged-on-valid-stripe-capture`, `noSecondCollectionFromBuyer: true` and the separate seller remittance obligation; it is evidence of its provider observation, not a court determination.

**COLLECT-3.** After valid collection, the operator owes the seller the agreed net remittance subject to the pre-authorized hold/refund conditions. Missing notification, failed seller transfer, operator/processor insolvency or an account closure MUST NOT cause the application to re-charge the buyer for the same already collected price. The operator's remittance obligation is not limited to selection/supervision of its processor. Refund, rescission, fraud, payment invalidity, chargeback and statutory remedies have their own legal consequences; no automatic revival of a price claim or new charging authority is inferred by the software. The buyer's separate debt to a card issuer and unrelated damages obligations are outside this discharge claim.

The Stripe adapter requires at least 30 minutes of Checkout validity. A new seller authorization is rejected when fewer than 30 minutes remain before the acceptance deadline; an already authorized draft whose Checkout could not be created expires without charging the buyer once that opening window is lost. The final refund deadline is never extended to compensate.

**COLLECT-4.** The settlement instruction MUST contain `inspectionConfirmed: true` and `performanceDigest`, a lower-case SHA-256 digest of the exact accepted deliverable or market-defined inspection/milestone record. The buyer declares that the agreed counter-performance for this payment has been performed and accepted and authorizes net remittance. The operator verifies the signature, bindings and state; it does not decide work quality or certify that the declaration is objectively true. A missing/false inspection confirmation or a generic delivery VC cannot release money.

These clauses describe the intended contractual allocation. They do not determine registration exemptions under Japanese or other financial law. The [Japanese financial regulator's guidance](https://www.fsa.go.jp/news/r7/sonota/20260522/24.pdf) requires assessment of actual transactions, and distinguishes escrow-style collection and platform involvement from merely supplying a payment method. Jurisdiction, cross-border flows, actual agency contracts and operator obligations require separate assessment before production operation. Stripe API support and successful tests do not establish regulatory approval.

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

**HOLD-2.** Seller authority must be durably recorded before Checkout creation and bound into the provider payment metadata. Payment reference knowledge alone grants no authority. Verify the provider's actual payment, mode, merchant ownership, transaction metadata, currency, captured amount and successful charge. A return URL, card token, client secret, charge authorization or unsigned JSON statement is not a deposit confirmation. A reference from an unrelated payment MUST NOT be adopted. This adapter accepts only its own pre-bound Checkout transaction; it cannot import an arbitrary external charge.

**HOLD-3.** The seller submits CollectionAuthorization before payment. The buyer submits DepositNotification; the seller submits Acceptance and RefundInstruction; the buyer submits SettlementInstruction. Every instruction binds the exact transaction, agreement digest, provider payment reference and predecessor instruction. A settlement references the accepted instruction, not only the payment. Before acceptance the seller can decline by refunding the notified deposit. No silence, message text, agent assertion or generic market VC substitutes for these instructions.

**HOLD-4.** Deadlines are fixed at transaction creation and never restart on payment, notification, acceptance, retry, key rotation or account reassociation. Funded offers that never receive a deposit notification or acceptance still expire to refund. An unpaid Checkout expires instead of being represented as a refund. Refunds return the full gross amount; the operator retains no platform commission on that refund and bears ordinary provider processing fees according to its commercial terms.

**HOLD-5.** Serialize instructions, webhook reconciliation and deadline alarms per transaction. The first durably committed permitted decision wins. At or after the applicable deadline a new release is forbidden. A release committed before the deadline may finish after it; an automatic refund must not race that committed release. Persist decision and retry alarm before external effects, use stable provider idempotency keys and reconcile provider objects before reissuing an uncertain request. Pending refunds are not confirmed refunds. A provider dispute or conflicting external refund blocks automatic release and deadline refund while that provider conflict is unresolved. Provider failures preserve a retryable pending state; repeated failed refunds do not silently create a new release right. Later chargebacks remain possible after release.

## 3. Instruction VC and original holder evidence

*The operator delivers each party's instruction with the original authorization so both sides can export it independently.*

The portable [TypeScript record definitions](../reference/conditional-payments.ts) describe the instruction arguments and VC subject; the online API additionally validates UUIDv7, lower-case hex, safe integers and rejects unknown fields.

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

`predecessor` is null for deposit, the deposit operation UUIDv7 for acceptance, and the acceptance UUIDv7 for settlement. A seller refund references the latest acceptance or, if not accepted, the deposit instruction; before notification it may reference null. `termsDigest` is lower-case SHA-256 hex over the parties' agreed exact bytes. Amounts are safe integers in currency minor units. This adapter supports JPY only.

**HOLD-VC-2.** Each party gets an operator-secured recipient copy with the same semantic instruction and original approval digest. Preserve the full signed wire/1 `ApprovedAction`, canonical request/policy bytes, reviewed context/arguments, holder root descriptor and operational-key authorization as a digest-pinned attachment. Ed25519 or the defined WebAuthn approval ceremony supplies holder authorization; the operator's VC wrapper alone is not a holder or institution signature. Verify the original approval, its authorization and bound context in addition to the wrapper. Instruction issuance does not assert successful execution. The operator additionally issues separate payment-event VCs for capture, accepted hold, transfer, expiry and refund observations.

**HOLD-VC-3.** Deliver both copies without requiring the other party's cooperation and preserve instructions plus approval attachments in payment evidence exports, including restricted post-closure exports. Account deletion stops new normal instructions; it does not cancel pending financial obligations or the pre-authorized deadline refund. No operator may present a deleted party's missing keys as available authorization.

## 4. Work history and acceptance policy

*The buyer's settlement instruction is portable work-history evidence; it is not a universal certification of quality.*

A seller may present the buyer-authorized SettlementInstruction together with operator transfer observations and independently retained work VCs. It demonstrates the buyer's signed inspection/acceptance declaration, the scope of its authorization and what the operator subsequently observed. The viewer decides whether to trust that buyer, accept the result or require additional credentials. The profile mandates no job title, milestone, deliverable, evaluation schema or Japanese nationality. Public disclosure of counterparties, prices or work details requires the applicable permissions; an export right is not blanket publication consent.

## 5. Stripe adapter and actual limits

*Capture first and defer the Connect transfer. Do not confuse this with holding an uncaptured card authorization.*

The SITLA adapter uses a Japanese Stripe platform, JPY card Checkout with automatic capture, and separate charges and transfers. It creates no destination transfer at capture. Stripe's normal platform balance is not a segregated trust account. Require the platform payout schedule to be `manual` before accepting new funds; requests do not change that global configuration. Maintain adequate refund liquidity and do not manually pay out or spend outstanding conditional-payment balances. A manual schedule alone does not isolate funds or guarantee liquidity. Automatic transfer is attempted only after the buyer's accepted settlement instruction, for 80% seller net under the founding operator's current 20% fee.

The operator default is 7 days, with a **30-day service maximum** and a 1-hour minimum, measured from transaction creation. Acceptance defaults to 24 hours, configurable from 1 to 24 hours and never after the refund deadline. These are SITLA policy limits, not a claim that Stripe grants every charge a universal 30-day protected escrow. The platform must remain able to refund in full; provider limits, failed refunds, outages and disputes remain visible.

Stripe's [manual-payout documentation](https://docs.stripe.com/connect/manual-payouts) says it does not provide escrow services; its manual-payout holding table allows 90 days for countries other than Thailand and the US, including Japan. That table concerns payout schedules, not an unconditional guarantee of delayed-transfer or escrow availability. The 30-day adapter limit leaves operational margin and does not authorize retaining funds contrary to provider terms.

By contrast, [separate card authorization and capture](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method) ordinarily has shorter validity windows (commonly 7 days online, some Visa merchant-initiated transactions 4 days 18 hours). Japan-based JPY authorizations can last up to 30 days for specified networks, but not all cards; the actual `capture_before` controls. This profile does not use uncaptured authorizations as deposits or promise their full window. Existing card-authorization work payments remain a separate capability.

[Separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers) require the platform to account for transfers, refunds and reversals separately. A `source_transaction` ties the seller transfer to the captured charge. A transfer is not a bank payout; refunding the original charge does not automatically reverse an existing transfer. Private-preview funds segregation is not assumed.

Official provider references checked November 14, 2026. Recheck rules and actual account capabilities before enabling a deployment. Legal escrow, statutory safeguarding and adjudication are outside this adapter; do not advertise those capabilities.

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

Unit tests mock provider observations to exercise deadlines and faults. The application integration suite additionally uses real Stripe Sandbox capture, CLI webhook reception, actual holder signatures, zero transfer before settlement, 80% release and full seller-directed refund. It temporarily switches only the Sandbox platform's payout schedule to manual and restores the original schedule. This is not certification of production safeguarding, legal escrow or long-duration outage behavior.
