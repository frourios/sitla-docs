<!-- SPDX-License-Identifier: CC0-1.0 -->
# Online MCP Adapter

**Specification revision: 0.6. Adapter: `SITLA-online/1`. Draft.**

*This adapter makes the online subset explicit. Publishing the other profiles does not enable them.*

## 1. Scope and negotiation

An operator implementing this adapter MUST publish capabilities, an authenticated operator origin, signing keys, exact policy bytes and the supported securing/status adapters. Clients MUST discover capabilities before requesting a feature. Unsupported ZKP generation, disaster DIDComm, cross-operator migration and legal escrow MUST return an explicit `unsupported_profile` result; ordinary JSON MUST NOT masquerade as those features. Work-specific claim types and acceptance remain market-defined. Core's trust boundaries apply.

The reference application supports hosted online credential storage; it does **not** hold the user's identity-root or operational private keys. It supports Ed25519 operational keys, enrolled P-256 WebAuthn credentials, ML-DSA-44 roots and fresh enrollment without old-account recovery. Its ordinary operator signing key is Ed25519 in protected server storage, not an HSM-backed or post-quantum key. External issuers need independent trust even if a signature verifies.

## 2. Enrollment and authentication

*Email verifies contact and consent. A holder key creates the authenticated identity.*

1. Fetch registration requirements, present the pinned terms/privacy revision to the human, obtain consent, request and verify the six-digit email code. This returns a short-lived enrollment capability, never a normal session.
2. `prepare_identity` binds the account, public root descriptor, operational keys and sender-key thumbprint. The holder signs the returned wire/1 `OperationalKeyAuthorization` with pure ML-DSA-44 and native context `SITLA/root/1`, and signs the complete enrollment context with its authorized authentication key.
3. `enroll_identity` verifies both signatures and consumes the enrollment capability before returning a sender-bound session and an operator account VC. Never send private keys to the operator.
4. Subsequent login signs a fresh operator/account/sender/epoch-bound challenge using an authorized authentication key or enrolled WebAuthn credential. Email-code login is unavailable.

Access tokens use DPoP, Ed25519 public JWKs, `htm`, exact query-free `htu`, `iat`, fresh `jti` and the access-token hash `ath`. Proofs expire within 60 seconds; replay markers are retained durably. Normal sessions expire within one hour. The operator checks account state and session/recovery epochs on every authenticated request. Clients MUST independently check origin, account, requested operation and all reviewed values before signing; a signature does not prove honest UI or human comprehension.

OAuth uses authorization code, PKCE S256, exact registered redirect/resource binding and sender-constrained tokens. The authorization browser uses origin-bound, user-verified passkeys. There is no refresh-token grant. Public client registration does not establish institutional trust. The consent page's client label is self-asserted.

## 3. Operation approval

*Every mutation is prepared, reviewed and signed before execution.*

`prepare_operation` accepts an operation name, arguments and idempotency key. It returns a wire/1 `request-evidence`, a wire/1 `ApprovedAction` payload, exact policy bytes and a reviewed context. The context binds the account URI, operation, arguments, server-derived review and sender thumbprint. Its canonical SHA-256 is both `payload_digest` and the digest in `subject_reference` (`urn:sha256:…`). `request_digest` hashes the canonical request. `policy_digest` hashes the **raw UTF-8 policy bytes**, without JSON reserialization. `terms_digest` identifies the reviewed terms; `amount_minor` and `currency` contain the reviewed monetary amount when applicable. Non-monetary operations use null amount/currency.

The holder MUST verify the context, request digest, policy bytes, operation, actor, authorization digest, epochs, audience, challenge, expiry and amount before signing the canonical approval payload. Ed25519 uses the existing wire/1 signature format. The WebAuthn transport carries the unmodified `AuthenticationResponseJSON`: the expected challenge is base64url(SHA-256(canonical approval payload)); the server verifies origin, RP ID, UP/UV, signature, credential/root authorization, BE/BS and the sign counter. Synced passkeys with BE=BS=1 and counter 0→0 are supported. It does not provide transaction text in trusted authenticator hardware.

The application retains the original approval, request, context, policy bytes and root authorization. Execution rechecks sender binding, epochs, current key authority and expiry. Reusing an idempotency key for different arguments fails. A completed operation can be retrieved with the same prepared operation; a new key can create a new operation and is not a retry. Provider instructions use stable provider idempotency keys. Clients MUST reconcile a pending operation instead of assuming a timeout rolled back an external effect.

## 4. Credentials, status and export

*Original signed bytes travel with their authority evidence. Verification and acceptance are different decisions.*

`SITLA-online-vc-jws/1` secures a VC 2.0 JSON object directly as compact JWS: protected header `alg: EdDSA`, `typ: vc+jwt`, and an explicitly authorized `kid`. This is a declared application adapter, not a claim to implement every VC-JOSE-COSE representation or SD-JWT. Verify the original signed bytes, not a reconstructed nested JWT `vc` claim. The inline extension vocabulary is `urn:sitla:online:claims:1:`; status type is `urn:sitla:status:operator-record:1`.

Operator account and handle VCs attest only the operator's binding/uniqueness registry. A `DelegatedIssuerAssertion` names the asserting DID/account and carries market-defined claims approved by that holder; the operator secures the wrapper. The original holder approval is exported as a digest-pinned attachment, also retained in the recipient's authority evidence. The issuer and recipient keep separate copies: closing one account does not erase the other party's original or approval evidence. It is not an institution signature. External compact Ed25519 VC JWS can be imported with its root descriptor/authorization; unsupported originals may be explicitly stored opaque and MUST remain unverified. Import does not establish subject ownership or issuer authority. External URLs and status endpoints are never fetched automatically.

Live operator credential status reports active, suspended, superseded, revoked or unknown. Missing external status stays unknown/indeterminate. Hosted verification identifies the operator as `verified_by`; it is not independent verification. Ordinary responses carry `evidence_level: service-json`, even when they contain a signed artifact. Consumers verify that artifact separately to obtain its stronger evidence level.

Exports preserve original compact JWS, canonical payloads, root authority material, relevant approvals/terms, status observations, securing-adapter description, public keys and an operator-signed digest manifest. Credential/payment exports use five-record pages and a signed `nextCursor`; an unfinished page MUST NOT be described as a complete vault. Account exports also expose the private profile and paged operation/history records (`recordCursor`). Export does not transfer an external issuer's acceptance or make an account-URI subject operator-independent.

## 5. Delegation and lifecycle

*Revocation is enforced at the actor that authorizes the request.*

The initial delegation adapter allows only bounded read operations, audience/purpose and an explicit credential-ID subset, expiry up to seven days and a separate DPoP sender key. It does not support subdelegation, payment mandates or implicit all-credential access. Independent mandates survive ordinary all-device logout. Cancelling a mandate invalidates its token and future presentations without changing unrelated sessions.

Logout removes the current session; all-device logout advances the normal-session epoch. Deletion enters quiescence immediately, disables sessions/mandates/new disclosure, suspends account/handle binding VCs, and provides a sender-bound case capability. The reference operator declares a 24-hour cancellation grace. Cancellation requires the pre-enrolled independent route's fresh OTP and a fresh holder assertion; it restores neither sessions nor mandates nor profile publication. After grace, normal private storage is erased, identifiers remain reserved, and existing payment/work evidence is retained for settlement, legal obligations and disputes. Case capabilities permit status/payment evidence only, not normal account activity. Statutory privacy requests remain a separate contact route.

Important deletion notices use a durable retry outbox; SMTP acceptance is not proof of reading, and crash recovery can duplicate delivery. An independently controlled notification email can receive payment/deletion notices and confirm deletion cancellation; it never restores account access. Replacing an active route waits 24 hours and notifies the old route.

## 6. Fresh accounts, provider portability and external continuity

*There is no operator-mediated lost-key recovery or fixed reviewer configuration.*

An inaccessible account is abandoned. A newly verified notification email and new root create an independent account; an already-used email is allowed without access to the earlier account. Actor/session storage is account-scoped. Old private data, sessions, mandates, handles, identity bindings and VCs are not restored. The inherited `recovery_epoch` wire field remains zero in this deployment; it does not advertise a recovery capability.

Anyone may issue a market-defined continuity VC relating old/new DIDs. SITLA can store and present an authorized credential but does not issue a recovery decision, track all old credentials, rewrite subjects or globally activate continuity. Each external verifier independently accepts the issuer/evidence for its own scope and checks successor-key possession. A payment-provider authorization is not an identity-continuity VC.

Stripe uses **Standard / OAuth**. A holder-approved `authorize_stripe_connect` operation creates a short-lived private browser-start URL bound to the new account, DID, session epoch and sender key. The page identifies the target SITLA account and requires human confirmation before Stripe login/consent. A separate random state and HttpOnly SameSite cookie bind the callback to that browser. The server consumes state before exchanging the single-use code, requires read_write, matching test/live mode and an actual Standard account, and stores no OAuth access/refresh token. A callback never directly changes a binding.

`get_stripe_connect_authorization` returns verified provider ID and current binding ID. A new holder-signed `complete_stripe_connect_authorization` approves that exact pair; expiry, owner/epoch changes, provider revocation and stale binding conflicts fail closed. One global authority serializes completion and D1 enforces one active binding per provider/mode and per service account/mode. Historical binding rows and transactions remain unchanged; new/current associations are recorded with a provider-only binding VC. Old account sessions, custody and reputation remain inaccessible to the new account. Deauthorization events disable future association and invalidate outstanding proof epochs. Repeated code exchange is forbidden, including after uncertain network outcomes, because Stripe documents that code reuse can revoke the connection.

The legacy onboarding-link MCP name prepares the same Standard OAuth flow; no platform-created Express account or return-link ownership shortcut remains. Real Sandbox OAuth uses Stripe's documented test-account bypass only; production requires the live public client_id and exact registered HTTPS callback URI. See [operator deployment](sitla-operator.md).

## 7. Marketplace, media and payments

*The operator records its own actions; counterparties define the work and its real-world acceptance.*

Profiles contain text and credential-free HTTPS media references. There is no upload, R2 hosting, proxy fetch or automatic embed. A paid reference can become public at its external host; neither deletion nor revocation recalls a recipient's copy. Work terms are opaque market-defined JSON, with buyer proposal, seller acceptance of the exact digest and bilateral records. The adapter imposes no universal contract, deliverable, milestone or professional-qualification VC schema.

Stripe Checkout supports reviewed profile carts and accepted work payments, including partial work payments within the agreed total. A work can explicitly choose direct capture or a provider-limited card authorization followed by reviewed capture/cancellation. A card authorization is time-limited by Stripe/card networks and is **not legal escrow**. Sellers can authorize refunds of their own single-seller work payments; refunds, transfer reversals and disputes are separate provider observations. Post-closure settlement is reviewed through the operator's support route; a case token never restores financial authority.

Every operator-handled payment stage produces private, append-only `OperatorPaymentEventCredential` records for **both** buyer and seller. They carry allocation-specific amounts/basis, fees/net, currency, provider reference, stage/outcome, occurrence/observation times, sequence/predecessor and approval/terms references. Unknown multi-seller refund allocation is null, never an invented split. A provider-confirmed observation remains an operator signature, not a Stripe signature, proof of delivery, legal escrow or a court-admissibility guarantee. Financial events remain exportable after account closure under the restricted case route and applicable retention rules. Independent payment notices are sent only to previously verified routes; absent independent routes must be visible rather than silently invented.

## 8. Limits and compatibility

The reference adapter bounds request bodies at 256 KiB, canonical documents at 64 KiB/depth 32/10,000 nodes, and operator VC payloads at 16 KiB. Large evidence travels as separate digest-pinned attachments. JSON numbers must be safe integers; unsupported representations require explicit opaque storage. All limits are rejection boundaries, not permission to truncate signed bytes.

The DID derivation/root authorization and approval payload reuse unchanged `sitla-wire/1`; document revision remains 0.6. This online adapter does not alter frozen v0.1/v0.2/wire vectors. Its live Worker/provider tests belong to the private application repository; the public document repository's independent Node/Python coverage remains exactly the scope stated in its README.

The [Conditional Payment Instructions](protocol-conditional-payments.md) adapter implements captured-card deposits, buyer notification, seller acceptance/refund and buyer-authorized deferred transfers. Its 30-day maximum, fixed deadlines and automatic refunds are separate from legal escrow and the existing card-authorization work-payment flow.

## Seller-authorized collection and inspection

Conditional payments implement `sitla-collection-agency/1`: `create_escrow` creates only a draft and requires the buyer's explicit acknowledgement of discharge on capture. The seller signs `authorize_escrow_collection` for the exact price claim, buyer, destination, fees and refund terms before a Stripe Checkout session can exist. This is separate from post-deposit work acceptance. Collection authorization confirms a genuine underlying price claim and collection before or with counter-performance. The operator keeps both recipient copies and the original seller approval. Only the buyer can obtain the private Checkout URL through `get_escrow`.

Valid Stripe capture discharges the identified buyer-to-seller price debt under the collection agreement. The capture VC identifies the collection authorization and this rule; notification and remittance are later observations, not conditions of discharge. The operator owes conditional net remittance to the seller. A remittance failure does not reopen Checkout or authorize billing the buyer again. Refunds, payment invalidity, chargebacks and statutory remedies remain separate; neither a signing key nor a successful Stripe API call determines legal truth or licensing status.

`settle_escrow` additionally requires `inspectionConfirmed: true` and `performanceDigest`. Its VC records the buyer's acceptance of the exact deliverable or market-defined inspection/milestone record and authorizes remittance; it is not an operator quality judgment. Immediate profile sales and direct/card-authorization work payments implement the [common Collection Agency profile](protocol-collection-agency.md), with their own seller grants and capture-time debt discharge. They do not claim the conditional path's inspection-controlled release.

Paid profile sales require a separate `authorize_profile_collection` approval after `get_profile_collection_offer`; profile publication alone is not collection authority. A work acceptance requires explicit `collectionConsent`, and new cart/work-payment requests acknowledge discharge on capture. `revoke_collection_authorization` stops new reservations under that exact grant; the atomic admission check freezes the original authority, fees, refund terms, fields/price or work budget/funding, and destination for existing transactions. No remittance failure authorizes a second buyer charge. Payment exports include the relevant collection grant and original seller approval without private profile values.

## 8. Authorized counterparty history

`get_counterparty_payment_history` takes an existing `context: {kind: work | purchase, id}` and exact `counterpartyAccountUri`. Only opposite parties to accepted work or seller-authorized purchases may read it, using ordinary sender-bound sessions. Unaccepted proposals/drafts, unrelated accounts and read mandates do not qualify. The signed summary contains prior/other-account association flags and aggregate recorded recipient-provider dispute states, never old account/provider/case identifiers or amounts. It covers the current work binding or original purchase destination in the current payment mode. Missing bindings return unavailable/null; retained counts always declare partial coverage and no live read-time refresh. See [Payment Records](protocol-payments.md) for signing, privacy, correction and interpretation rules. The summary is not payment authority, identity continuity or a clean-reputation certificate.
