# Stripe Japan Payment Adapter

**SITLA Protocol v0.9 — optional deployment adapter, not Core conformance**\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## 1. Separation from the protocol

*This is one concrete implementation of provider-neutral payment duties.*

[Collection Agency](protocol-collection-agency.md), [Conditional Payment Instructions](protocol-conditional-payments.md) and [Portable Payment Records](protocol-payments.md) define authority, instructions and evidence. They do not require Stripe, JPY, a fixed holding period or a fee percentage. This adapter selects Stripe Standard Connect OAuth, a Japanese platform, JPY card Checkout and separate charges/transfers. An alternative provider needs its own published mechanism, securing/serialization profile, legal assessment and interoperable tests; copying Stripe tokens does not implement it.

The actual online fields retain names such as `dischargeOnStripeCapture` and `buyerPriceDebt: discharged-on-valid-stripe-capture`. These are adapter-specific bindings to authenticated successful capture, not universal field names or a new `sitla-wire/1` format. See [Public Payment Wire Artifacts](protocol-payment-wire.md).

## 2. Provider mechanism and limits

*Capture first and defer the Connect transfer. Do not confuse this with holding an uncaptured card authorization.*

The SITLA adapter uses a Japanese Stripe platform, JPY card Checkout with automatic capture, and separate charges and transfers. It creates no destination transfer at capture. Stripe's normal platform balance is not a segregated trust account. Require the platform payout schedule to be `manual` before accepting new funds; requests do not change that global configuration. Maintain adequate refund liquidity and do not manually pay out or spend outstanding conditional-payment balances. A manual schedule alone does not isolate funds or guarantee liquidity. Automatic transfer is attempted only after the buyer's accepted settlement instruction, for the seller net frozen in the transaction; fees are deployment/commercial terms.

The founding service's deadlines and fee split are declared in [SITLA Operator Deployment](sitla-operator.md), not Core conformance constants. Its service maximum is an operational margin, not a claim that Stripe grants every charge a protected escrow window. The platform must remain able to refund in full; provider limits, failed refunds, outages and disputes remain visible.

Stripe's [manual-payout documentation](https://docs.stripe.com/connect/manual-payouts) says it does not provide escrow services; its manual-payout holding table allows 90 days for countries other than Thailand and the US, including Japan. That table concerns payout schedules, not an unconditional guarantee of delayed-transfer or escrow availability. An operator's shorter published service limit must leave operational margin and does not authorize retaining funds contrary to provider terms.

By contrast, [separate card authorization and capture](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method) ordinarily has shorter validity windows (commonly 7 days online, some Visa merchant-initiated transactions 4 days 18 hours). Japan-based JPY authorizations can last up to 30 days for specified networks, but not all cards; the actual `capture_before` controls. This profile does not use uncaptured authorizations as deposits or promise their full window. Existing card-authorization work payments remain a separate capability.

[Separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers) require the platform to account for transfers, refunds and reversals separately. A `source_transaction` ties the seller transfer to the captured charge. A transfer is not a bank payout; refunding the original charge does not automatically reverse an existing transfer. Private-preview funds segregation is not assumed.

Official provider references checked November 15, 2026. Recheck rules and actual account capabilities before enabling a deployment. Legal escrow, statutory safeguarding and adjudication are outside this adapter; do not advertise those capabilities.

## 2.1. Deferred seller connection

Seller enrollment, listing, negotiation and work acceptance do not require a connected Stripe account. Pre-connection collection is a separately enabled deployment capability, not a Core requirement or unconditional payment entitlement. If section 4.1 has not been satisfied, require a verified, eligible connected destination before creating a live Checkout or capturing funds. The seller explicitly authorizes collection for the identified SITLA account and agrees that remittance will use its subsequently verified Stripe destination. The buyer reviews the seller and the absence of a destination before authorizing payment. Existing collection/debt-discharge and conditional inspection/refund rules continue to apply.

Create and capture the platform PaymentIntent without `transfer_data.destination` or `on_behalf_of` for an unconnected seller. Keep the transaction reference and seller allocation; record the net amount eligible for remittance as an unsettled seller payable, not as a completed transfer. For conditional payments, only a committed valid settlement instruction makes the net payable eligible for remittance; missing Stripe connection does not extend acceptance or refund deadlines or turn an unapproved release into a payable.

The seller may complete Standard Connect OAuth at any amount. Once ownership, mode and transfer eligibility are verified for the original SITLA seller account, bind the previously unassigned destination exactly once, with a durable signed approval and auditable binding observation. Reconcile refunds, disputes and prior transfers, then promptly transfer the eligible outstanding net. Multiple allocations may be settled together if each allocation, provider transfer reference and idempotency identity remain reconcilable. No minimum accumulation amount or additional holding period applies after connection; subsequent eligible sales follow normal remittance. The pre-connection exposure limits in section 4.1 are admission/settlement safeguards, not a minimum payout threshold. A failed transfer leaves the payable outstanding; retry without charging the buyer again or changing an assigned destination.

Keep sufficient platform liquidity for outstanding payables and refunds; do not treat seller payables as platform revenue or spend or automatically pay out funds needed for remittance. An unsettled payable is not a wallet, transferable balance, escrow or segregated account. Reaching an applicable age, amount or other provider/legal limit MUST suspend new affected collections and invoke the approved settlement process; lack of connection alone does not extinguish the payable.

Stripe's [separate charges and transfers documentation](https://docs.stripe.com/connect/separate-charges-and-transfers) supports platform charges before a recipient is known, including in Japan. The [Transfers API](https://docs.stripe.com/api/transfers/create) requires a connected destination at transfer time. This establishes API feasibility, not approval of pre-connection collection or indefinite retention under the [Japan service terms](https://stripe.com/jp/legal/ssa-service-terms) (Connect—Platform, section 9.3). Deployment remains subject to section 4.

The deferred destination uses the distinct [collection authorization v2 schema](../artifacts/payments-v2/schemas/collection-authorization.schema.json), with a literal null processor account. Existing payments-v1 signed records are unchanged. Runtime discovery MUST distinguish implementation support from production enablement and publish the approved bound policy. Provider execution and signed evidence conformance require deployment verification. Never rewrite historical signed records.

## 3. Checkout admission and reservation windows

*Opening a payment page and holding captured funds have separate deadlines.*

Conditional Checkout requires at least 30 minutes of remaining validity before the fixed acceptance deadline. Seller authorization is rejected after that opening window; an authorized draft unable to create Checkout expires without charging. The refund deadline never moves. For direct-work reservations, new Checkout creation must start within 30 minutes of reservation and the card page expires one hour after reservation. Manual-capture work separately follows its actual provider `capture_before`. These are the current adapter's windows, not protocol-wide defaults.

## 4. Japanese deployment assessment

*Contract wording and passing tests do not establish the applicable financial registration or an exemption.*

Before production, obtain a documented assessment by qualified payment/financial-law counsel of the actual agency contracts, buyer-debt discharge, operator remittance responsibility, acceptance conditions, control of funds, safeguarding/liquidity, refund/dispute process and domestic/cross-border flows. Record the supported jurisdictions/flow types and any required registration, exemption conditions or provider restrictions; do not enable a flow solely because Stripe supports an API. Until that assessment is completed, production suitability remains unconfirmed.

The [FSA guidance, section I-2](https://www.fsa.go.jp/news/r7/sonota/20260522/24.pdf) explains that classification depends on actual transactions. It separately addresses cross-border collection and the conditions for escrow/platform-related exclusions; merely supplying a payment method or using a bank/provider account is not a universal exemption. Parties being in Japan does not by itself establish a wholly domestic funds flow. This specification does not decide that the operator qualifies. References were read on November 15, 2026; recheck applicable law and facts for deployment.

Independent public vectors contain synthetic financial assertions only. They do not reproduce private application integration tests, actual provider balances or a legal opinion. [SITLA Operator Deployment](sitla-operator.md) records the implementation/assessment boundary.


## 4.1. Production admission for unconnected sellers

**JP-DEFER-1.** Technical support for separate charges and transfers is not approval for collecting on behalf of sellers who have not completed provider onboarding. In particular, Stripe Connect—Platform Japan sections 9.1 and 9.3 address connected-account transactions and restrict the allowed purposes and duration of retaining funds in the platform Stripe account. They do not establish an entitlement to retain completed sales while waiting for onboarding. Neither a small amount nor the absence of a seller-requested accumulation setting establishes an exemption. The provider's manual-payout limit is not an independent license to delay transfers. These references were rechecked November 26, 2026.

**JP-DEFER-2.** Before enabling live pre-connection collection, retain a documented provider-contract determination applicable to the actual flow and a qualified Japanese financial-law assessment. The release owner MUST approve and disclose the permitted jurisdictions, transaction types, maximum age of outstanding pre-connection obligations, maximum outstanding amount per seller and in aggregate, liquidity and reconciliation arrangements, escalation owner, and the lawful settlement procedure when an outstanding obligation cannot be transferred. These limits are deployment-specific; this specification does not supply a legally safe numerical limit. If no such approved policy exists, pre-connection collection is disabled in live mode. Test-mode implementation and provider API availability are not evidence that this gate has been met.

**JP-DEFER-3.** Check the applicable policy and outstanding exposure before admitting a new reservation or collecting a charge, including concurrent reservations and already captured obligations. Do not renew the age of an outstanding amount on retry, reassociation, subsequent sales or notification. Monitor oldest due amount, aggregate exposure, actual available funds, refunds and disputes; suspend affected new collections when policy limits or liquidity requirements are exceeded. Reconcile all existing obligations and promptly remit eligible amounts when a verified destination becomes available. Never extend conditional refund deadlines, create duplicate buyer charges, automatically forfeit the seller's claim, or refund an already valid settled transaction merely to erase an overdue payable. If ordinary remittance is impossible, follow the documented lawful alternative settlement and support procedure; unresolved obligations remain recorded.

**JP-DEFER-4.** Listing, work negotiations and collection authority may exist before Stripe connection, even while live payment admission is disabled. The operator must distinguish a collected-but-unsettled claim from a completed provider transfer and from an uncollected authorization. Publish whether pre-connection collection is enabled and the currently applicable policy, and show payment eligibility before either party commits. Contract review or provider approval has not been established by this repository. These requirements are deployment obligations, not a claim that the current application enforces them.
