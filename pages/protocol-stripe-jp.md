# Stripe Japan Payment Adapter

**SITLA Protocol v0.8 — optional deployment adapter, not Core conformance**\
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

Seller enrollment, listing, work acceptance and supported sales MUST NOT require a connected Stripe account in the deferred-connection binding. The seller explicitly authorizes collection for the identified SITLA account and agrees that remittance will use its subsequently verified Stripe destination. The buyer reviews the seller and the absence of a destination before authorizing payment. Existing collection/debt-discharge and conditional inspection/refund rules continue to apply.

Create and capture the platform PaymentIntent without `transfer_data.destination` or `on_behalf_of` for an unconnected seller. Keep the transaction reference and seller allocation; record the net amount eligible for remittance as an unsettled seller payable, not as a completed transfer. For conditional payments, only a committed valid settlement instruction makes the net payable eligible for remittance; missing Stripe connection does not extend acceptance or refund deadlines or turn an unapproved release into a payable.

The seller may complete Standard Connect OAuth at any amount. Once ownership, mode and transfer eligibility are verified for the original SITLA seller account, bind the previously unassigned destination exactly once, with a durable signed approval and auditable binding observation. Reconcile refunds, disputes and prior transfers, then promptly transfer the eligible outstanding net. Multiple allocations may be settled together if each allocation, provider transfer reference and idempotency identity remain reconcilable. No minimum accumulation amount or additional holding period applies; subsequent eligible sales follow normal remittance. A failed transfer leaves the payable outstanding; retry without charging the buyer again or changing an assigned destination.

Keep sufficient platform liquidity for outstanding payables and refunds; do not treat seller payables as platform revenue or spend or automatically pay out funds needed for remittance. An unsettled payable is not a wallet, transferable balance, escrow or segregated account. Provider/legal limits may require suspending new collections or arranging settlement through the published support process; lack of connection alone does not extinguish the payable.

Stripe's [separate charges and transfers documentation](https://docs.stripe.com/connect/separate-charges-and-transfers) supports platform charges before a recipient is known, including in Japan. The [Transfers API](https://docs.stripe.com/api/transfers/create) requires a connected destination at transfer time. This establishes API feasibility, not approval of pre-connection collection or indefinite retention under the [Japan service terms](https://stripe.com/jp/legal/ssa-service-terms) (Connect—Platform, section 9.3). Deployment remains subject to section 4.

The deferred destination uses the distinct [collection authorization v2 schema](../artifacts/payments-v2/schemas/collection-authorization.schema.json), with a literal null processor account. Existing payments-v1 signed records are unchanged. Runtime discovery declares deferred seller connection; provider execution and signed evidence conformance require deployment verification. Never rewrite historical signed records.

## 3. Checkout admission and reservation windows

*Opening a payment page and holding captured funds have separate deadlines.*

Conditional Checkout requires at least 30 minutes of remaining validity before the fixed acceptance deadline. Seller authorization is rejected after that opening window; an authorized draft unable to create Checkout expires without charging. The refund deadline never moves. For direct-work reservations, new Checkout creation must start within 30 minutes of reservation and the card page expires one hour after reservation. Manual-capture work separately follows its actual provider `capture_before`. These are the current adapter's windows, not protocol-wide defaults.

## 4. Japanese deployment assessment

*Contract wording and passing tests do not establish the applicable financial registration or an exemption.*

Before production, obtain a documented assessment by qualified payment/financial-law counsel of the actual agency contracts, buyer-debt discharge, operator remittance responsibility, acceptance conditions, control of funds, safeguarding/liquidity, refund/dispute process and domestic/cross-border flows. Record the supported jurisdictions/flow types and any required registration, exemption conditions or provider restrictions; do not enable a flow solely because Stripe supports an API. Until that assessment is completed, production suitability remains unconfirmed.

The [FSA guidance, section I-2](https://www.fsa.go.jp/news/r7/sonota/20260522/24.pdf) explains that classification depends on actual transactions. It separately addresses cross-border collection and the conditions for escrow/platform-related exclusions; merely supplying a payment method or using a bank/provider account is not a universal exemption. Parties being in Japan does not by itself establish a wholly domestic funds flow. This specification does not decide that the operator qualifies. References were read on November 15, 2026; recheck applicable law and facts for deployment.

Independent public vectors contain synthetic financial assertions only. They do not reproduce private application integration tests, actual provider balances or a legal opinion. [SITLA Operator Deployment](sitla-operator.md) records the implementation/assessment boundary.
