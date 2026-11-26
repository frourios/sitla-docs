# Stripe Japan Payment Adapter

**SITLA Protocol v0.14 — optional deployment adapter, not Core conformance**\
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

## 2.1. Seller connection requirement

All new payment paths require an active, eligible same-country Stripe destination before collection, in both live and Sandbox mode. Negotiation and work acceptance may precede connection. A work accepted without a destination may use that same seller's subsequently verified connection at payment reservation; freeze the destination before Checkout. New payment reservations cannot have a null destination. Historical null-destination records retain their original bytes and settlement/refund obligations.

## 3. Checkout admission and reservation windows

*Opening a payment page and holding captured funds have separate deadlines.*

Conditional Checkout requires at least 30 minutes of remaining validity before the fixed acceptance deadline. Seller authorization is rejected after that opening window; an authorized draft unable to create Checkout expires without charging. The refund deadline never moves. For direct-work reservations, new Checkout creation must start within 30 minutes of reservation and the card page expires one hour after reservation. Manual-capture work separately follows its actual provider `capture_before`. These are the current adapter's windows, not protocol-wide defaults.

## 4. Provider conditions

Use Stripe's supported separate charges and transfers flow with a connected seller, the published collection agreement, fixed conditional-payment deadlines and independent refund/transfer reconciliation. The former JP-DEFER-1–4 approval gate for pre-connection collection is removed because that flow is no longer available. This specification requires no special counsel approval or separate legal sign-off as a release prerequisite for this connected-seller flow. Ordinary applicable law, Stripe agreements and account requirements continue to apply; this does not assert a legal opinion or a statutory escrow service.

## Stripe connection at escrow entry

Negotiation and work acceptance do not require Stripe connection. The minimum new work payment is 500 JPY; at the current 20% fee the seller allocation is 400 JPY before refunds, disputes or other applicable adjustments. Runtime minimum price is configured by the operator and advertised in MCP operation schemas.

For new conditional escrow transactions, the seller MUST complete Stripe Standard OAuth before a draft or Checkout is created, including in Sandbox. If `create_escrow` finds no active seller connection in the selected payment mode, return `phase: awaiting-seller-connection`, `escrowId: null`, `checkoutUrl: null` and a seller-directed `stripeConnection` next-step description. No funds or escrow reservation are created in that step. The seller calls `create_stripe_connect_authorization`, approves the prepared operation, completes human Stripe login/consent, retrieves `get_stripe_connect_authorization`, approves `complete_stripe_connect_authorization`, and checks `get_stripe_connect_status`. The buyer then prepares and approves `create_escrow` again with a fresh idempotency key and the agreed terms. The new draft fixes the actual deadlines and verified destination. Existing connections must have the required country and active transfer capability; incomplete provider requirements must be resolved before starting payment.

The seller separately signs transaction-specific collection authority before the buyer receives Checkout. Link completion is not collection consent. Fixed acceptance/refund deadlines begin only when the connected draft is created; the connection instruction itself starts no paid hold. Existing captured transactions retain their original settlement/refund duties and destinations. All new direct, card-authorization and conditional payment paths require a verified seller destination before Checkout or capture in both live and test mode. No other path permits pre-connection collection. Existing collected obligations remain serviceable using their original evidence and settlement rules.

## Explicit currency in new work credentials

The founding service's current supported monetary unit is `currency: JPY` with `currencyExponent: 0`, explicitly signed into each money-bearing VC as specified by [MONEY-1–3](protocol-payments.md). This includes request estimates, offered rewards and negotiated work/completion records, not only Stripe event receipts. Other currencies require a future declared capability/adapter update and explicit matching contract/payment conditions. Neither future extension nor legacy evidence may silently change existing JPY reservations. Public expense estimates are not an extra collection authorization; the negotiated total and seller-approved budget still govern.
