# Conditional Payment Instructions

**SITLA Protocol v0.17 — optional profile `sitla-conditional-payment/2`**

## 1. Purpose and scope

*Parties agree outside the operator. The operator executes narrowly scoped signed financial instructions.*

A buyer and seller may negotiate by any means and use any work-credential schema. This profile neither requires submission of that negotiation nor asks an operator to decide whether work is good, delivered or legally complete. It standardizes a payment reference, an opaque agreement digest, holder-authorized instructions and portable operator observations. Core assurance limits and the [Portable Payment Records](protocol-payments.md) duties apply. “Conditional payment” is the technical term; this profile does not claim a legally protected escrow account.

**HOLD-1.** Before collecting money, publish the actual mechanism, provider/mode, supported country/currency, fee/net allocation, chosen holding duration, capture-based refund deadline and unsupported cases. The immutable transaction binds the buyer and seller account URIs and observed controller DIDs, the exact provider destination, amount, currency and agreement digest. The agreement digest refers to the exact bytes agreed by the parties; the operator does not need the agreement content. For structured agreements, parties must identify their serialization before hashing. No account/provider reassociation rewrites an existing transaction's destination or parties.

The [common Collection Agency profile](protocol-collection-agency.md) applies the same receipt/debt rules to direct/card-authorization work payments. Their standing/work-specific authorization and withdrawal are distinct from this transaction-specific conditional flow.

Historical transactions with an unassigned destination retain their original obligations; the current adapter admits no new unconnected collection. See [the provider adapter](protocol-stripe-jp.md).

## 1.1. Seller-authorized collection

*The seller delegates receipt before payment. Valid provider collection settles the buyer's identified price debt; later seller remittance is a separate obligation.*

**COLLECT-1.** This profile uses contractual collection agency (`sitla-collection-agency/1`). A buyer first proposes an identified transaction and acknowledges discharge on valid capture. Before any provider checkout session or payment URL is created, the seller MUST authorize receipt for that exact transaction, buyer, price/currency, agreement digest, destination, fee and fixed refund policy. The seller confirms that a genuine underlying price claim exists and that collection is scheduled before or simultaneously with the counter-performance. A connected provider account, account registration, a notification email, an unsigned declaration or the later work acceptance is not this delegation. The seller signs `authorize_escrow_collection`; its CollectionAuthorization VC and original approval are delivered to both parties. No general-purpose wallet, lending recovery, gift or unrelated person-to-person transfer is authorized. Agreement formation and work-specific schemas remain market-defined.

**COLLECT-2.** As between the parties under this collection agreement, a valid, successful capture of the identified gross price by the operator's designated collection processor under the declared adapter discharges that amount of the buyer's price debt to the seller. An uncaptured authorization, processing/unpaid/failed payment, return page, notification VC or seller transfer is not the trigger. The effect is attributed to valid capture, not delayed webhook observation, deposit notification, seller acceptance or eventual bank payout. The operator issues a capture/payment-event VC whose `collection` field identifies the seller authorization, gross price, the adapter's collection-trigger identifier, `noSecondCollectionFromBuyer: true` and the separate seller remittance obligation; it is evidence of its provider observation, not a court determination.

**COLLECT-3.** After valid collection, the operator owes the seller the agreed net remittance subject to the pre-authorized hold/refund conditions. Missing notification, failed seller transfer, operator/processor insolvency or an account closure MUST NOT cause the application to re-charge the buyer for the same already collected price. The operator's remittance obligation is not limited to selection/supervision of its processor. Refund, rescission, fraud, payment invalidity, chargeback and statutory remedies have their own legal consequences; no automatic revival of a price claim or new charging authority is inferred by the software. The buyer's separate debt to a card issuer and unrelated damages obligations are outside this discharge claim.

**COLLECT-4.** The settlement instruction MUST contain `inspectionConfirmed: true` and `performanceDigest`, a lower-case SHA-256 digest of the exact accepted deliverable or market-defined inspection/milestone record. The buyer declares that the agreed counter-performance for this payment has been performed and accepted and authorizes net remittance. The operator verifies the signature, bindings and state; it does not decide work quality or certify that the declaration is objectively true. A missing/false inspection confirmation or a generic delivery VC cannot release money.

These clauses describe contractual allocation, not an exemption determination. Apply the provider conditions in the [chosen adapter](protocol-stripe-jp.md). No operator may infer regulatory approval from API support or passing tests.

## 2. Lifecycle

*Parties negotiate independently. Seller collection authority precedes payment; confirmed capture starts the fixed-duration hold; only buyer authorization permits release.*

| State | Accepted event | Result |
| --- | --- | --- |
| awaiting-collection-authority | Seller CollectionAuthorization VC | awaiting-payment; create buyer-only Checkout URL |
| awaiting-payment | Provider confirms capture | held; fix `fundedAt` and `refundAt = fundedAt + holdSeconds`; no seller transfer |
| held | Seller signed WorkResult VC (`submit_escrow_delivery`) | held; archive the seller delivery declaration for both parties |
| held | Seller RefundInstruction VC | refunding; refund full gross amount to the original payment method |
| held | Buyer SettlementInstruction with the buyer WorkResult VC, referencing the collection authorization | releasing; transfer the agreed seller net |
| Any funded state without a committed decision or provider block | Capture-based refund deadline | refunding automatically |
| releasing / refunding | Provider confirms the requested effect | released / refunded |
| Any state | Dispute or conflicting out-of-band refund observation | blocked for automatic new release; record the observation and reconcile |

**HOLD-2.** Seller authority must be durably recorded before Checkout creation and bound into the provider payment metadata. Payment reference knowledge alone grants no authority. Verify the provider's actual payment, mode, merchant ownership, transaction metadata, currency, captured amount and successful charge. A return URL, card token, client secret, charge authorization or unsigned JSON statement is not a deposit confirmation. A reference from an unrelated payment MUST NOT be adopted. The baseline accepts only its own pre-bound provider transaction; it cannot import an arbitrary external charge.

**HOLD-3.** The seller submits CollectionAuthorization before payment; the seller may submit RefundInstruction and the buyer SettlementInstruction after confirmed capture. Both bind the exact transaction, opaque agreement digest, verified payment reference and original collection-authorization operation UUID. There is no post-payment deposit-notification or work-acceptance operation. The seller delivers a WorkResult VC through `submit_escrow_delivery`; settlement requires it and a matching buyer WorkResult VC. No silence, DM, generic completion VC or agent assertion is financial authority. The complete originals are retained for both parties before committing release; there is no later portfolio-issuance step.

**HOLD-4.** At payment setup the buyer MUST explicitly choose the holding duration. The seller reviews and signs the exact duration, parties, amount/currency, destination, fee and refund/release authority in the bound context before collection. No acceptance deadline measured from request/draft creation and no default duration applies. After valid automatic capture, the operator durably fixes `fundedAt` to the provider-confirmed captured charge time and `refundAt = fundedAt + holdSeconds`. Both timestamps are absent/null before capture. Delayed observation uses that original provider time and may immediately trigger an overdue refund. Retries, reconciliation, notifications, key rotation and account reassociation never restart or extend the clock. The current adapter's separate technical Checkout expiry limits payment-page use, not negotiation or seller acceptance. An unpaid expired Checkout is not a refund. Refunds return the full gross amount without commission; ordinary provider fees follow the commercial terms.

**HOLD-5.** Serialize instructions, webhook reconciliation and deadline alarms per transaction. The first durably committed permitted decision wins. At or after the applicable deadline a new release is forbidden. A release committed before the deadline may finish after it; an automatic refund must not race that committed release. Persist decision and retry alarm before external effects, use stable provider idempotency keys and reconcile provider objects before reissuing an uncertain request. Pending refunds are not confirmed refunds. A provider dispute or conflicting external refund blocks automatic release and deadline refund while that provider conflict is unresolved. Provider failures preserve a retryable pending state; repeated failed refunds do not silently create a new release right. Later chargebacks remain possible after release.

## 3. Instruction VC and original holder evidence

The serialization below is the optional current online/Stripe binding. The provider-neutral duties are HOLD-VC-1–3; other bindings publish their exact fields/schemas and use the same semantic distinctions.

*The operator delivers each party's instruction with the original authorization so both sides can export it independently.*

The [public schemas, signed vectors and independent verifiers](protocol-payment-wire.md), together with [TypeScript record definitions](../reference/conditional-payments.ts), describe the instruction arguments and VC subject; the online API additionally validates UUIDv7, lower-case hex, safe integers and rejects unknown fields.

**HOLD-VC-1.** The online adapter secures a `ConditionalPaymentInstruction` as [`SITLA-vc-jwt/1`](protocol-online.md) in current circulation; frozen `payments-v1` direct-JWS vectors retain their explicitly legacy securing adapter. Its subject profile is `sitla-conditional-payment-instruction/2`. `action` identifies four instruction types: `collection-authorize` (CollectionAuthorization), `deliver` (seller WorkResult handoff), `refund` (RefundInstruction), or `settle` (SettlementInstruction). It contains:

- `transactionId`, buyer/seller account URI and observed DID, `assertingAccount`;
- agreed `jobRequestIds`, gross `amountMinor`, `currency`, `currencyExponent`, `termsDigest`, `holdSeconds`, nullable `fundedAt` and `refundAt`;
- `instruction`: the exact fields below;
- `approval.operationId` and `approval.evidenceDigest` binding the original holder approval.

```json
{
  "escrowId": "019a8050-0000-7000-8000-000000000001",
  "termsDigest": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "depositReference": "pi_example",
  "predecessor": "019a8050-0000-7000-8000-000000000002"
}
```

`predecessor` is the original seller collection-authorization operation UUIDv7 for both refund and settlement. `termsDigest` is lower-case SHA-256 hex over the parties' agreed exact bytes. Amounts are safe integers in currency minor units. The current [Stripe Japan binding](protocol-stripe-jp.md) supports JPY only; this is not a provider-neutral currency restriction.

**HOLD-VC-2.** Each party gets an operator-secured recipient copy with the same semantic instruction and original approval digest. Preserve the full signed wire/1 `ApprovedAction`, canonical request/policy bytes, reviewed context/arguments, holder root descriptor and operational-key authorization as a digest-pinned attachment. Ed25519 or the defined WebAuthn approval ceremony supplies holder authorization; the operator's VC wrapper alone is not a holder or institution signature. Verify the original approval, its authorization and bound context in addition to the wrapper. Instruction issuance does not assert successful execution. The operator additionally issues separate payment-event VCs for capture, accepted hold, transfer, expiry and refund observations.

**HOLD-VC-3.** Deliver both copies without requiring the other party's cooperation and preserve instructions plus approval attachments in payment evidence exports, including restricted post-closure exports. Account deletion stops new normal instructions; it does not cancel pending financial obligations or the pre-authorized deadline refund. No operator may present a deleted party's missing keys as available authorization.

## 4. Work history and acceptance policy

*The buyer's settlement instruction is portable work-history evidence; it is not a universal certification of quality.*

A seller may present the buyer-authorized SettlementInstruction together with operator transfer observations and independently retained work VCs. It demonstrates the buyer's signed inspection/acceptance declaration, the scope of its authorization and what the operator subsequently observed. The viewer decides whether to trust that buyer, accept the result or require additional credentials. The profile mandates no job title, milestone, deliverable, evaluation schema or Japanese nationality. Public disclosure of counterparties, prices or work details requires the applicable permissions; an export right is not blanket publication consent.

## 5. Provider adapters and deployment parameters

*Choose a supported mechanism; publish its limits before either party authorizes payment.*

**HOLD-ADAPTER-1.** Each operator declares the provider, countries/currencies and exponents, collection trigger, custody/balance mechanism, minimum/maximum holding duration and provider technical payment windows, refund liquidity, exact fee/net allocation, dispute handling and unsupported cases. The fixed transaction snapshots those values. No provider, currency, percentage or duration is a Core constant. A card authorization is not collected funds; a provider transfer is not a bank payout or statutory escrow.

The [Stripe Japan adapter](protocol-stripe-jp.md) describes the current online implementation and provider references. [SITLA Operator Deployment](sitla-operator.md) supplies the founding service's timings and commercial choices. Neither page makes another operator use those choices. The adapter's [public schemas and vectors](protocol-payment-wire.md) cover historical assertion bytes, not provider execution or legal qualification.

## 6. MCP and conformance

*Each mutating tool prepares an approval; only `execute_operation` executes it.*

Tools `create_escrow`, `authorize_escrow_collection`, `submit_escrow_delivery`, `refund_escrow`, `settle_escrow` take `arguments` plus a stable UUIDv7 `idempotencyKey`. They prepare the named operation; review and sign the returned payload, then execute it. `prepare_operation` supports the same operations. `get_escrow` reconciles provider state and returns the transaction's phase/references to either party; it may execute a pre-authorized expiry refund. Use `list_credentials`, `export_account` and `export_payment_records` to obtain the signed VCs and original evidence. The buyer's `create_escrow` includes `acknowledgeDischargeOnCapture: true` and creates a draft without a payment URL. The seller's `authorize_escrow_collection` requires `confirmUnderlyingPriceClaim`, `collectionBeforeOrWithPerformance`, `authorizeReceipt`, `dischargeOnStripeCapture` and `authorizeConditionalRefunds`, all explicitly true, in addition to `escrowId` and `termsDigest`. Only then does `get_escrow` expose Checkout to the buyer; the seller never gets that private payment URL. Confirmed capture directly enters the holding state. `create_escrow` requires an explicit `holdSeconds`; no work terms, acceptance deadline or negotiation transcript is submitted. Delivery adds `resultCredential: {secured, authority}`. A settlement adds its own `resultCredential`, `inspectionConfirmed: true` and `performanceDigest` to the four common instruction fields. No private key, card details or Stripe client secret is sent as an instruction argument.

| Requirement | Required checks |
| --- | --- |
| COLLECT-1–4 | No Checkout before exact seller consent; false/missing consent or inspection fails; confirmed capture discharges the price without a transfer; remittance failure never re-bills buyer |
| HOLD-1–2 | Wrong mode, amount, merchant metadata, unpaid session, unrelated payment reference and automatic-payout configuration fail closed |
| HOLD-3 | Wrong party, changed terms/predecessor and absent holder approval cannot release funds |
| HOLD-4–5 | Chosen duration begins at capture; delayed observation/retries do not extend deadlines; late release loses; competing refund/release has one winner; pending failures retain alarms |
| HOLD-VC-1–3 | Both sides independently export original wrapper and approval evidence; response loss/restarts do not duplicate effects; closure retains settlement evidence |

Unit tests mock provider observations to exercise deadlines and faults. The application integration suite additionally uses real Stripe Sandbox capture, CLI webhook reception, actual holder signatures, zero transfer before settlement, the configured seller-net release and full seller-directed refund. It temporarily switches only the Sandbox platform's payout schedule to manual and restores the original schedule. This is not certification of production safeguarding, legal escrow or long-duration outage behavior.

## 7. Lost keys during an existing transaction

*New keys and a new payment-provider association cannot authorize an old party's instructions.*

**HOLD-LOSS-1.** Show the following consequences before commitment and when users request key/backup guidance. Notify through available registered routes without treating email, support, a continuity VC or a new provider binding as authority to sign for the lost account. A dispute/provider block can delay the automatic effects below. Existing refund obligations and their retries survive closure or loss of both parties' keys.

| Situation | Available protocol effect | User consequence |
| --- | --- | --- |
| Buyer loses all accepted keys before a committed settlement | Seller may refund; otherwise the capture-based deadline refunds gross | Even completed work may be unpaid; new accounts/continuity evidence cannot authorize old funds |
| Seller loses all accepted keys before collection authority | No new Checkout under that transaction | Negotiate a new transaction if desired; never transfer old authority |
| Seller loses all accepted keys after collection | Original buyer may settle; otherwise fixed deadline refunds | Keep the frozen destination; a replacement account cannot redirect funds |
| Release/refund already durably committed before key loss | Finish/reconcile that same provider effect using its original idempotency key | Key loss neither changes the decision nor creates a second charge or competing release |

Direct-work capture has no conditional inspection gate: its existing collection/remittance duties survive key loss and cannot be billed again. Manual card authorization alone is not payment; only an already authorized permitted capture path within the provider window may collect it, otherwise it expires/cancels. Buyers/sellers should retain backups and export evidence before starting long work; split milestones or another expressly agreed supported payment method can limit exposure, but this profile guarantees no compensation for work when required authorization is unavailable. Legal claims and provider/statutory processes remain separate.


**HOLD-LOSS-2.** Where a valid settlement was committed before loss of the seller's keys and no provider destination was assigned, the obligation does not vanish or become available to a newly enrolled account. Follow the deployment's alternative settlement procedure, including independent verification of the claimant and applicable legal rights; this is not a replacement holder approval or an account-recovery feature. Report unresolved settlement separately from successful transfer. Preserve the original transaction and authorization evidence for both parties. New pre-connection collection is not supported.


## Payment entry

The provider adapter defines connection eligibility and the next steps before payment. See [Stripe Japan payment entry](protocol-stripe-jp.md) for the current deployment's exact workflow, amounts and fees.


Current SITLA MCP admission, publication and delivery use the signed whole-VC [license and DID recipient policy](protocol-online.md#41-signed-license-and-recipient-metadata). Optional E2EE/ZKP payloads are opaque to the operator. This does not change frozen historical fixtures or imply content-proof verification.

Historical `payments-v1` and `circulation-v1`–`circulation-v3` artifacts preserve their original acceptance/deposit fields as legacy verification fixtures. Current whole-VC instruction subjects use [circulation-v4](../artifacts/circulation-v4/schemas/conditional-instruction.schema.json); the old operations are not exposed by the current service.

## 8. Bilateral work results

**RESULT-1 — Exact author evidence before release.** A payment setup fixes `resultPolicies.buyer` and `.seller`, the root DIDs of both parties, opaque `termsDigest`, amount/unit and optional `jobRequestIds` (default `[]`, at most 20 distinct previously published originals). IDs are archive lookup keys, never instructions to fetch an arbitrary external URL. The list accepts an original VC ID or its publication UUID, preserves the exact order/identifiers and cannot be substituted later. Hidden, expired or revoked originals remain referenceable; their status is not a current offer. Neither the operator nor a counterparty may relabel the other author's VC license. Both parties separately review the setup/collection authority. Original work text is obtained from the published job or privately agreed; no negotiation transcript is required.

**RESULT-2 — Current VC shape.** Each author issues a complete `SITLA-vc-jwt/1` with type `urn:sitla:credential:WorkResult:1`, current issuer root authority, `validFrom`, signed `licenses`/`didAllowList` matching that author's frozen policy, and no `validUntil`. The subject is the counterparty's **root DID**, not a hosted account URI. Its subject profile `sitla-work-result/1` has `paymentContext: {kind: "escrow" | "work", id}`, `role: "seller" | "buyer"`, `assertion: "delivered" | "accepted"`, `buyerDid`, `sellerDid`, `termsDigest`, the exact `jobRequestIds`, `performanceDigest`, gross agreed `amountMinor`, `currency` and `currencyExponent`. Optional `summary` and opaque `extensions` are author-controlled data. Both role declarations bind the same performance digest. The buyer asserts acceptance; the seller asserts delivery. Arbitrary occupational claims or operator observations are not silently substituted for either statement.

[The public schema and examples](../artifacts/work-results-v1/schemas/work-result.schema.json) define current shape/limits. Node/Python [semantic examples](../artifacts/work-results-v1/vectors.json) check actor, policy, currency and original-ID bindings independently; they are unsigned examples, not a new signature-interoperability claim. Runtime tests exercise actual root-authorized complete-JWS signatures and tampering separately.

**RESULT-3 — Atomic delivery and financial order.** In conditional holding, `submit_escrow_delivery` is a seller-signed financial-work evidence handoff after capture. The buyer supplies its own signed WorkResult inside `settle_escrow`. The service validates original signatures, role/parties/context, exact policy/list, money unit and common performance digest; it archives each unchanged original and adds a recipient copy to **both** parties' vaults in one commit. No payment is released with only one result or a half-delivered result. Only after both originals exist does the serialized coordinator commit the release decision and request provider transfer. A later status change cannot erase the accepted original or rewrite an already committed financial instruction. Loss of a response restarts neither release nor issuance; changing an admitted author's result requires a new payment context.

For direct work/card authorization the work setup fixes the same metadata and result policies. `add_work_record` with `phase: "result"` takes this same author-signed profile and archives it for both parties. Direct automatic-capture Checkout requires the pair **before opening payment**. A card authorization may precede delivery, but `capture_work_payment` requires the pair before capture. Work-result monetary fields refer to the agreed work budget; individual payment events identify actual partial installments. Neither a result nor a DM by itself initiates or captures payment. This is a payment evidence requirement, not operator management of negotiations.

**RESULT-4 — Independent retrieval and limits of the assertion.** `get_operation_contracts.credentialSchemas.workResult` exposes the current native VC shape for offline signing. Either party can obtain exact originals through `get_escrow.results`, ordinary credential export and payment evidence attachments (`kind: "work-result"`) without asking the author to act again. Direct work results appear in both vaults and in payment exports. Copies/financial archives survive the other party's normal deletion; restricted post-closure payment exports retain the originals. Operator financial instructions, original financial approvals and private processor references remain SITLA-internal. A CC0 work-result does not automatically publish those attachments. The standalone result contains no payment-provider identifiers, card data or original private approval.

A successfully released/settled payment therefore already has both agreed-policy results. An unresponsive buyer before acceptance may cause deadline refund; a seller's delivery claim is still only that claim. No result is fabricated to state normal completion for an unaccepted, refunded or disputed transaction. Verifiers combine the author declarations with independently assessed financial observations, job originals, issuer trust and status. Provider failure or later chargeback remains separate from the author's acceptance. No signature or paid amount proves objective quality.
