# SITLA Operator Deployment

*Frourio-operated service configuration; informational, outside protocol conformance.*

**Date:** November 14, 2026. A published document does not assert that an unshipped build is deployed.

## Identity and endpoints

| Setting | SITLA value |
| --- | --- |
| Operator / origin | SITLA / Frourio, Inc. — `https://sitla.frourio.com` |
| MCP | `/mcp` |
| Discovery | `/api/protocol/operator`, `/api/protocol/policy`, `/.well-known/oauth-protected-resource`, `/.well-known/oauth-authorization-server` |
| Public signing keys | `/.well-known/jwks.json` |
| Stripe ownership authorization | Standard Connect OAuth; `/stripe/connect/oauth/callback` |
| Terms / privacy / commercial disclosure | `/terms`, `/privacy`, `/commercial` |
| Stable account address | `/accounts/<opaque-22-character-id>` |
| Documentation | `https://github.com/frourios/sitla-docs` |
| Pinned raw documents | `https://raw.githubusercontent.com/frourios/sitla-docs/<commit>/pages/<file>.md` |

## Online capability target

The application implements the [Online MCP Adapter](protocol-online.md): email/consent enrollment followed by user-held root binding, DID challenges, WebAuthn, OAuth/DPoP, signed mutations, account-binding VCs, credential custody/export, read-only scoped mandates, lifecycle barriers, external-reference profiles, bilateral work terms, Stripe payments and portable payment observations. Runtime discovery is authoritative. Users retain all root/operational private keys.

**No lost-key account recovery is offered.** There is no recovery reviewer registry, operator recovery approval, waiting/restriction workflow, recovery transparency endpoint or operator-issued identity-continuity VC. The same verified notification email can create independent accounts; it does not authorize access to an earlier account. Old custody, sessions, mandates and reputation are not transferred. Back up keys and exported originals independently. Arbitrary issuers may attest DID continuity; external verifiers decide whether to accept it for their own purposes.

| Parameter | Value |
| --- | --- |
| Normal session lifetime | 3,600 seconds |
| Login/approval challenge lifetime | 300 seconds |
| Email enrollment/notification OTP | 600 seconds; five failed attempts |
| Read-only mandate maximum lifetime | Seven days; no subdelegation or payment mandates |
| Deletion cancellation grace | 86,400 seconds |
| Independent notification-route replacement delay | 86,400 seconds |
| Stripe OAuth intent / verified proof | Up to 600 seconds / up to 300 seconds within the original intent |
| Stripe securing | Provider code exchange plus state/browser binding and a fresh new-account signed completion |
| Media | External HTTPS references only; no hosting, fetch, proxy or automatic embed |
| Payments | Stripe, JPY; provider-limited card authorization is not legal escrow |
| Commercial fee | See [Commercial Model](business-model.md); not a protocol constant |

The operator has its own public ML-DSA-root DID with a root-authorized Ed25519 issuance key and dual-root rotation evidence. The ordinary operator Ed25519 JWS key lives in protected Durable Object storage; it does not assert post-quantum archival security or a real-world identity judgment. Published optional ZKP, disaster DIDComm and inter-operator migration profiles are not runtime capabilities.

## Stripe configuration and rebinding

Use a Standard account owned and authorized through Stripe OAuth. Enable Connect OAuth in the Stripe Dashboard; configure the public test/live client IDs and exact callback addresses for the relevant environment. The test client ID does not configure production. Production uses the HTTPS callback shown above; local Sandbox testing uses the separately registered `http://localhost:5173/stripe/connect/oauth/callback`. Secret API/webhook keys remain operator secrets.

The holder approves starting authorization, confirms the target SITLA account in the browser, logs in/consents at Stripe and then approves completing the exact provider/current-binding pair in MCP. Merely entering an account ID, seeing a return page or receiving a platform-generated onboarding link is not ownership verification. The current service does not offer Express-account login-link shortcuts.

One active association is enforced per provider/mode and per SITLA account/mode. Rebinding deactivates the old association, retains its historical row and records a provider-only binding credential. Existing transaction parties, approvals, terms and destinations remain unchanged. Old SITLA access and credential acceptance are not restored. Stripe deauthorization disables subsequent association/use and invalidates outstanding proof epochs.

## Closure, retention and release checks

Deletion immediately stops normal use. A private sender-bound case capability supports status and retained payment-record export for 30 days. Cancellation during the declared grace requires the enrolled notification route and fresh holder authorization; it restores neither sessions nor mandates nor publication. Financial/work evidence, status and binding history remain subject to existing obligations, disputes and applicable retention rules. Statutory privacy requests use the published contact route and do not restore login authority. Counterparty/external-issuer/media-host copies remain outside the deleting account's erasure scope.

Before enabling capabilities, run Worker/SMTP tests, actual Sandbox Standard OAuth code exchange, card authorization/capture/refund and bilateral evidence export, then publish matching metadata. Production reset/deployment remain separate operator actions. Other operators choose their own origin, infrastructure, provider, securing profiles, policies, timings and branding; these deployment values and commercial fees do not constrain Core conformance.

## Conditional payments

The optional `sitla-conditional-payment/1` adapter collects a JPY card charge on the Japanese platform and defers its seller transfer. Enable it only with manual platform payouts and sufficient refund liquidity; never pay out or spend outstanding held balances. No global Stripe setting is changed by MCP. The service default is 7 days, maximum 30 days, with acceptance within 1–24 hours. Deadlines run from transaction creation. No acceptance or expired accepted hold refunds the full gross amount. On buyer-authorized settlement, the current commercial split is 20% operator / 80% seller. This is not legal escrow, segregated custody or work-quality certification. See [the profile](protocol-conditional-payments.md).

The conditional-payment adapter uses transaction-specific seller agency (`sitla-collection-agency/1`), not a blanket delegation inferred from connecting Stripe. No Checkout session exists until the seller's signed collection authorization. Under the operator's collection agreement, valid Stripe capture discharges the identified buyer price debt; buyer notification, seller acceptance and actual net remittance are separate stages. The operator retains its seller remittance obligation and does not re-charge the buyer because of remittance failure or insolvency. Settlement additionally requires a buyer-signed inspection confirmation and accepted-performance digest. Full agency and original approval evidence is retained for both parties, including permitted post-closure export. Financial-law classification and production provider contracts require independent assessment; this document does not assert a registration exemption.

## Work payment collection

The [Collection Agency](protocol-collection-agency.md) profile covers direct/card-authorization work and conditional work. Seller work acceptance includes explicit collection consent for that buyer, budget and funding mode. New payment requests acknowledge capture-time discharge. Withdrawal blocks new reservations; already reserved transactions keep their original authority, conditions and destination. Valid capture settles the buyer price debt independently of seller remittance; retries never create a second buyer charge. Direct receipts are financial facts, not inspection or quality certification. Public seller profiles consist solely of self-issued external trust references and are free; requests for additional information or credentials are ordinary work.

## Deferred seller connection

The deferred online payment binding implements work payments before seller Stripe connection as a technical capability. Live admission is separately subject to [JP-DEFER-1–4](protocol-stripe-jp.md); the repository does not establish that the required production policy or approval is in place. An eligible net amount remains an unsettled payable until the original seller completes verified Standard Connect OAuth and is eligible to receive transfers. There is no minimum amount for connection or settlement, and no accumulation policy after connection. Preserve the signed collection authority, original seller and existing transaction conditions; assign an unassigned destination once, reconcile outstanding amounts and remit promptly. See [Stripe Japan](protocol-stripe-jp.md). Runtime discovery remains authoritative for the deployed version. Existing payments-v1 signed records remain unchanged.

## Assessment and disclosure gaps

The [Stripe Japan adapter](protocol-stripe-jp.md) is a technical/contractual design, not a completed legal assessment. Production financial-law suitability, including actual domestic/cross-border agency flows, is **unconfirmed in this repository**; qualified counsel and provider-contract review remain release prerequisites. No legal opinion, registration/exemption decision or third-party Rust/Go implementation is claimed.

The Core REC-6 summary is implemented by authenticated `get_counterparty_payment_history` for accepted work and seller-authorized purchases. It returns signed flags and aggregate recipient-provider dispute statuses with partial/unknown coverage; old identities, Stripe IDs, amounts and case files are excluded. Current work bindings and frozen purchase destinations have distinct scopes. No public reputation registry, historical backfill or read-mandate access is offered. See [the request, access rules and response meanings](protocol-payments.md).

Before starting conditional work, show [the key-loss table](protocol-conditional-payments.md), including the risk that buyer key loss prevents release even after delivery. Users must back up/export independently. Neither operator support nor a new Stripe association overrides the old party's missing approval. Public payment artifacts test synthetic bytes; private Worker/Stripe tests are not publicly reproduced by them.

For production webhook configuration, subscribe the platform endpoint to `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn` and `charge.dispute.funds_reinstated`, alongside the existing payment/refund events. The local/GHA Stripe CLI listener subscribes to these too. Connected-account dispute notifications are outside this platform-charge adapter and are ignored. Latest platform dispute/payment/captured-charge API observations, not the event's embedded status, feed retained aggregates. Delivery/API failures remain retryable. No read-time backfill or complete prior history is claimed.

## Credential vault and online transport

The current [online profile](protocol-online.md) uses MCP/OAuth/DPoP with signed tool request/response credentials and `SITLA-sd-jwt/1` selective disclosure. OAuth issuer and callback/resource URLs remain HTTPS. Discover the operator DID through `get_operator_identity`, then pin or independently accept its root; discovery alone is not trust.

Exact signed originals, approvals and paid snapshots use the private `VC_VAULT` R2 bucket. D1 retains indexes, public projections and transaction controls; Durable Objects retain sessions, replay and issuance authority. This R2 vault is not media hosting and exposes no public bucket URL. Operator-side custody is readable to the service, not end-to-end encryption from the operator.


## Stripe connection at escrow entry

Negotiation and work acceptance do not require Stripe connection. The minimum new work payment is 500 JPY; at the current 20% fee the seller allocation is 400 JPY before refunds, disputes or other applicable adjustments. Runtime minimum price is configured by the operator and advertised in MCP operation schemas.

For new conditional escrow transactions, the seller MUST complete Stripe Standard OAuth before a draft or Checkout is created, including in Sandbox. If `create_escrow` finds no active seller connection in the selected payment mode, return `phase: awaiting-seller-connection`, `escrowId: null`, `checkoutUrl: null` and a seller-directed `stripeConnection` next-step description. No funds or escrow reservation are created in that step. The seller calls `create_stripe_connect_authorization`, approves the prepared operation, completes human Stripe login/consent, retrieves `get_stripe_connect_authorization`, approves `complete_stripe_connect_authorization`, and checks `get_stripe_connect_status`. The buyer then prepares and approves `create_escrow` again with a fresh idempotency key and the agreed terms. The new draft fixes the actual deadlines and verified destination. Existing connections must have the required country and active transfer capability; incomplete provider requirements must be resolved before starting payment.

The seller separately signs transaction-specific collection authority before the buyer receives Checkout. Link completion is not collection consent. Fixed acceptance/refund deadlines begin only when the connected draft is created; the connection instruction itself starts no paid hold. Existing captured transactions retain their original settlement/refund duties and destinations. Earlier deferred-destination provisions describe existing transactions or other explicitly supported payment paths; they do not authorize new unconnected escrow collection.
