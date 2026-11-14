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
| Stable account address / optional handle | `/accounts/<opaque-22-character-id>`, `/@handle` |
| Documentation | `https://github.com/frourios/sitla-docs` |
| Pinned raw documents | `https://raw.githubusercontent.com/frourios/sitla-docs/<commit>/pages/<file>.md` |

## Online capability target

The application implements the [Online MCP Adapter](protocol-online.md): email/consent enrollment followed by user-held root binding, DID challenges, WebAuthn, OAuth/DPoP, signed mutations, account/handle VCs, credential custody/export, read-only scoped mandates, lifecycle barriers, external-reference profiles, bilateral work terms, Stripe payments and portable payment observations. Runtime discovery is authoritative. Users retain all root/operational private keys.

**No lost-key account recovery is offered.** There is no recovery reviewer registry, operator recovery approval, waiting/restriction workflow, recovery transparency endpoint or operator-issued identity-continuity VC. The same verified notification email can create independent accounts; it does not authorize access to an earlier account. Old custody, sessions, mandates, handles and reputation are not transferred. Back up keys and exported originals independently. Arbitrary issuers may attest DID continuity; external verifiers decide whether to accept it for their own purposes.

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

The ordinary operator Ed25519 JWS key lives in protected Durable Object storage; it does not assert post-quantum archival security or a real-world identity judgment. Published optional ZKP, disaster DIDComm and inter-operator migration profiles are not runtime capabilities.

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

## Collection across paid profiles and work

The [Collection Agency](protocol-collection-agency.md) profile also covers immediate paid profiles and direct/card-authorization work. Paid profiles require a separate signed grant for the published revision, prices/field names, fee/refund terms and provider destination; original private profile values are not part of that grant. Seller work acceptance includes explicit collection consent for that buyer, budget and funding mode. New payment requests acknowledge capture-time discharge. Withdrawal blocks new reservations under the grant, while already reserved transactions keep their original authority, conditions and destination. Valid capture settles the buyer price debt independently of seller remittance; retries never create a second buyer charge. Immediate/direct receipts are financial facts, not inspection or quality certification. Registration/exemption assessment remains separate.
