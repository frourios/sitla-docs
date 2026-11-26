<!-- SPDX-License-Identifier: CC0-1.0 -->
# Online MCP Credential Circulation

**Specification revision: 0.12. Application profile: `SITLA-online/1`. Selective disclosure: `SITLA-sd-jwt/1`. Draft.**

*Standard MCP and OAuth carry credential operations; credentials do not replace the transport or the authorization server.*

## 1. Boundaries and supported standards

This is the online reference deployment profile. Operators MUST advertise its actual capabilities. The [Core](protocol.md) trust boundaries and existing payment, lifecycle and account profiles still apply. Published optional ZKP packages, disaster DIDComm and inter-operator account migration are not runtime capabilities and return `unsupported_profile`.

| Layer | Format and responsibility |
| --- | --- |
| Transport | MCP Streamable HTTP and standard JSON-RPC, tool discovery, schemas, errors and `_meta` |
| Authorization | OAuth authorization code, PKCE S256, exact redirect/resource binding and DPoP sender-constrained tokens |
| Principal | A holder or operator DID with explicit, root-signed operational key authority |
| Credential circulation | RFC 9901 disclosures, Ed25519 JWS and the restricted SD-JWT VC profile below |
| Human authorization | Existing wire/1 `ApprovedAction`, including enrolled WebAuthn assertions |
| Service evidence | Operator-signed response and payment credentials; acceptance remains the verifier's policy |

An OAuth issuer remains an HTTPS issuer identifier. Its origin, registered callbacks, RP ID and protected-resource URLs MUST NOT be replaced with a DID. Operator and holder DIDs identify credential issuers; URLs locate MCP, OAuth, policies and status resources. An account URI remains an operator-local reference, not a substitute for a portable credential subject.

Normative upstream references: [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414), [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449), [RFC 9901](https://www.rfc-editor.org/rfc/rfc9901.html), [SD-JWT VC draft-26](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-sd-jwt-vc-26), and [DID Core](https://www.w3.org/TR/did-core/). SD-JWT VC remains a draft. The experimental `did:sitla` method, issuer-key authorization, vocabulary and hosted status adapter are explicit SITLA extensions, not standardized DID-method registration, OpenID4VC conformance or blanket support for all SD-JWT implementations.

## 2. Enrollment, sessions and approval

*The operator never needs the holder's private keys.*

Email confirms contact and the pinned terms/privacy revision. A six-digit email code yields only a short-lived enrollment capability. `prepare_identity` and `enroll_identity` bind a user-controlled ML-DSA-44 root, authorized operational keys and session sender. Subsequent login uses an authorized authentication key or enrolled origin-bound passkey. Email login and operator account recovery are unavailable.

OAuth uses authorization code and PKCE, resource binding and sender-constrained tokens; public client registration is not institutional endorsement. Sessions expire within one hour, DPoP proofs within 60 seconds, and replay state is durable. No refresh grant is offered. Logout, all-device logout, bounded independent mandates, notification routes and deletion follow [Account Lifecycle](protocol-lifecycle.md). An independent mandate authorizes its explicit credential-ID set, audience/purpose and read operations; it never authorizes a payment or proves fresh human consent.

Every mutation uses `prepare_operation`, review and `execute_operation`. Existing `sitla-wire/1` approvals bind exact operation arguments, sender, epochs, amount, purpose, lifetime, challenge and exact published policy bytes. WebAuthn verifies RP ID/origin, UP/UV, authorized P-256 key and BE/BS/counter rules. A trusted display is not implied. Independent payment notifications show the committed amount and recipient. Provider instructions use stable idempotency keys; pending or failed signing never justifies another charge.

## 3. Operator identity and rotation

*Discovery supplies key material. It does not establish first-use trust.*

`get_operator_identity` returns the operator DID, root descriptor, `application/did+json` root document, issuance authorization and retained history. The root document is JSON, not JSON-LD processing. The independently verifiable root authorizes a conventional Ed25519 issuance key for `credential-issuance`. Consumers MUST pin or independently accept the initial operator root and relevant policy. Merely fetching a DID over MCP is not endorsement.

Operational rotation retains original keys and authorizations. Root rotation publishes an `OperatorContinuity` credential containing a domain-bound `OperatorRootTransition` signed by **both** predecessor and successor ML-DSA roots with native context `SITLA/continuity/1`. Verify both descriptors, both proofs and the successor-authorization digest. External verifiers choose whether to accept the transition. Original credentials retain their original issuer; history does not re-sign them as the new issuer. Rotation is a privileged infrastructure operation, not an account MCP permission.

The reference operator holds its own root and operational secrets in protected Durable Object storage. This is not an HSM claim. Ordinary credentials, responses, transport and payments are not post-quantum signatures because their root is post-quantum.

## 4. Credential format and issuer extension

*The issuer signs once; a presentation omits disclosures while retaining that signature.*

`SITLA-sd-jwt/1` uses `application/dc+sd-jwt`, protected `typ: dc+sd-jwt`, `alg: EdDSA`, an explicitly authorized `kid`, `_sd_alg: sha-256`, `iss`, `jti`, `vct` and integer `iat`. Optional `exp`/`nbf` are checked. Compact serialization is `issuer-jwt~disclosure~…~`; disclosures use random 256-bit salts. The reference supports nested object/array disclosure verification. The issuance helper makes individual `credentialSubject.claims` fields disclosable and keeps subject `id` and profile identifiers public. Public JWT claims are always visible; this is selective disclosure, not anonymity or a ZKP. DID correlation is an accepted property of this public online profile.

DID issuer resolution is an explicit extension to the pinned SD-JWT VC draft: the original travels with `{descriptor, authorization}`. Verify DID derivation, the ML-DSA grant, issuance purpose, assertion-role key, JWS `kid`, `iss`, issue time within grant lifetime and disclosure digests. A conventional VCDM view may be reconstructed for application logic, but the proof is over the original JWT and disclosure bytes. External status is not fetched automatically. Unknown or stale status remains unknown/indeterminate; a valid signature does not establish institutional authority or physical truth.

The profile rejects duplicate keys/digests/disclosures, collisions, unreferenced disclosures, noncanonical base64url and redirected keys (`jwk`, `jku`, `x5u`, unknown critical headers). Decoded JSON is bounded to 64 KiB, depth 32 and 10,000 nodes; compact credentials are at most 256 KiB. Only safe integer JSON numbers are supported by the surrounding canonical application records. Other algorithms/formats require a separately advertised adapter. Opaque imports may be kept only with explicit opt-in, remain unverified and cannot back a published trust reference.

Holder-bound credentials (`cnf` or an attached KB-JWT) cannot be automatically re-presented by custody. Storage and issuer-signature checks do not verify fresh holder possession. The current unattended adapter rejects their publication/presentation rather than stripping key binding. It does not claim OpenID4VCI/OpenID4VP or full SD-JWT KB support.

`issue_credential` requires an actual issuer-signed SD-JWT plus root authorization. Its subject DID, type and claims MUST match the reviewed recipient and arguments. The operator archives that original for the issuer only; `issue_credential` does not populate the other account's vault. Deliver through the opt-in DM profile; the recipient explicitly imports with `store_credential`. It does not sign an institution's claim on the institution's behalf. `store_credential`, `get_credential`, `list_credentials`, `verify_credential` and export retain issuer evidence without claiming that custody proves subject ownership. Local user issuance requires a UUIDv7 `jti` in `urn:uuid:` or local credential-URL form; the corresponding local UUID is reserved against conflicting originals. Opaque/external imports can have an independent local storage UUID. An issuer may explicitly sign the corresponding hosted status URL; it is not silently added to an original. A local operator status URL is accepted only if its indexed original ID and issuer match; importing another credential's status URL confers no status authority.

The former direct `vc+jwt` application wrapper is a legacy securing adapter, not the current circulation format. Frozen `wire-v1` and `payments-v1` vectors remain unchanged and explicitly legacy where they exercise that wrapper. Current business claim schemas can be reused independently of that legacy securing format. Never relabel an old signature as SD-JWT.

## 5. Requests and signed responses

*Credential evidence is application data inside ordinary MCP.*

Authenticated `tools/call` includes `_meta["io.frourio.sitla/request"]` containing a zero-disclosure `dc+sd-jwt` (`JWT~`). Its `iss`/`sub` is the current account DID; `aud` is the independently pinned operator DID. Required claims are `vct: urn:sitla:credential:ToolRequest:1`, exact `resource`, `tool`, canonical `argumentsDigest`, `senderThumbprint`, random `jti`, `iat`, and `exp` within five minutes. The Ed25519 `kid` is `<actor-did>#session-<sender-jwk-thumbprint>`. Verify using the already authenticated DPoP session sender, not an arbitrary embedded key. A session-authorized request is not a root-authorized issuer assertion or new human consent. Reject replay, altered tool/arguments, wrong audience/resource/key and expired requests. A delegate remains bounded by its separate mandate.

A business tool result or handled business error includes `responseCredential`, an operator SD-JWT with type `urn:sitla:credential:ToolResponse:1`, five-minute expiry, exact tool/request ID, canonical SHA-256 of the request-credential **string**, requester DID, mandate ID, outcome and `resultDigest`. The latter hashes the canonical business object before adding the receipt, using the wire canonical byte rules with a separate 2 MiB/100,000-node application-page limit. The receipt has no fictitious live credential-status entry and is not a second copy of private data. Check the operator authority and compare all bindings; then apply independent acceptance policy.

MCP initialize/list/notifications, OAuth browser/token exchange, public HTTP pages, HTTP/JSON-RPC parse errors and transport/authentication failures remain standard control messages. Public bootstrap tools receive signed responses with no authenticated requester; they cannot prove first-use trust. Signature availability is not guaranteed during operator failure. An unsigned or unverifiable result MUST NOT be upgraded to signed evidence.

## 6. Trust references and selective presentation

*Discover external trust references, not a marketplace of personal data.*

Publish the seller's DID on an external site (SNS, personal blog, portfolio, institutional website) before declaring its URL. Issue or import a self-issued `SITLA-sd-jwt/1` VC of type `urn:sitla:credential:TrustReferences:1` with issuer and subject equal to the current seller DID. Its atomic disclosure at `/credentialSubject/claims/links` is an array of 1–50 distinct credential-free HTTPS URLs, each at most 2048 characters. Send `set_profile {credentialId}` and approve the reviewed links. No literal fields, personal-attribute form or paid disclosure plan is accepted.

The operator validates the supported VC, signature, authority, subject, status and link syntax; it stores the original in private R2 and projects only the URLs, DID and source credential reference to D1. Search by account identifier, DID or literal URL substring; `search_sellers` and `get_seller` return the DID and public links with `externalLinksVerified: false`. Locally revoked, expired, missing or mismatched credentials and withdrawn listings stop discovery. `get_seller_evidence` returns the selected link-list proof and issuer authority. SITLA never fetches, embeds or verifies the linked sites; a verifier may check the DID, site ownership, activity and other evidence independently. A self-declared URL is a trust reference, not an inherently trusted cryptographic trust anchor or proof of identity. No paid-profile purchase operations exist; compensated requests for additional information or credentials use ordinary work.

`present_credentials` requires explicit credential IDs, per-ID `disclosures` paths, audience and purpose. It returns only selected disclosures plus original issuer authority, and records a presentation log. Plain public search projections are not fresh credential presentations. Public issuer/subject metadata remains visible. The service receipt binds audience/purpose; a reusable unbound SD-JWT is not itself verifier-bound or a new holder signature. Use `get_credential`/owner export deliberately for full originals. A copied credential cannot be recalled after disclosure.

## 7. Open-market issuance, work and payments

*The market defines a work VC. The operator attests its own circulation and payment actions.*

A buyer can request a new or derived issuer claim through ordinary `create_work`, with the chosen issuer as seller, market-defined schema/terms and agreed price. A source credential does not authorize a custodian to manufacture an absent predicate. The issuer may use online DID authentication for an automated reissue or require external/in-person checks; timing, price and acceptance are not guaranteed by the protocol.

Work proposal/acceptance binds the exact terms digest. `add_work_record` requires an actual author-signed selective-disclosure credential and issuer authority; the record schema and meaning remain market-defined. Its holder approval and delivery receipt do not replace the author signature. No universal contract, milestone or occupational qualification schema is imposed.

Existing [Collection Agency](protocol-collection-agency.md), [Conditional Payments](protocol-conditional-payments.md), [Payment Records](protocol-payments.md) and [Stripe Japan](protocol-stripe-jp.md) govern direct work and limited fund holding. Seller receipt authority, valid-capture price-debt discharge, immutable prior reservations after revocation, stable retries and signed bilateral exports remain required. A response receipt is not provider confirmation or a second charge. `get_counterparty_payment_history` remains transaction-scoped, direct-session-only and returns minimal recorded binding/dispute summaries, never a reputation guarantee. Provider payment conditions are defined by the selected adapter.

All new payment paths require a connected seller before collection. Runtime discovery declares pre-connection collection unsupported; see [Stripe Japan](protocol-stripe-jp.md).

## 8. Storage, deletion and portability

*R2 stores originals; D1 stores indexes, control state and rights.*

The reference deployment stores exact JSON packages containing signed credential/approval originals and paid snapshots in a private R2 vault, addressed by SHA-256. D1 retains opaque pointers/digests/sizes, public search projections, status and transaction-control data. Complete credentials and private approvals are not D1 search documents. Vault access is authenticated and owner/counterparty scoped; there is no public bucket or media upload. Retrieve through MCP, verify exact bytes and retained issuer evidence locally. Storage custody can expose entrusted plaintext to the operator.

Writes archive first, then publish an index. Missing/tampered originals fail closed. A failed index write may leave an orphan requiring maintenance; it does not publish a valid credential. Deletion tracks interrupted object erasure for retry and removes only originals no longer referenced by permitted counterparties or financial records. Original copies retained by the issuer, counterparty or provider follow their own rights and retention rules. Status unknown is not equivalent to deletion or revocation.

Exports include original disclosures, issuer/root authority, approvals, current status observations and signed digest manifests with explicit page cursors. Reference pages contain at most five originals within a 128 KiB aggregate target (one larger original can occupy a page); private history pages use at most twenty records and a 256 KiB target. Continue from the actual returned cursor rather than assuming a fixed record count. A partial page MUST NOT be described as a complete vault. The frozen wire/1 canonicalization and root contexts remain stable; documentation revision 0.12 does not change their bytes. Credentials can be independently re-presented without the original operator when their format and issuer policy allow it; account-URI subjects and hosted status retain declared operator dependencies.

## 9. Credential direct messages

The [Credential DM](protocol-dm.md) profile adds an opt-in DID-addressed inbox, sender blocks, atomic quotas, original selective-disclosure credential delivery and generic email notices. Reception is not credential import, acceptance or a new job. Direct sessions and holder approval protect mutations; read mandates have no DM scope. Original bodies and delivery receipts use the same private R2 vault, with mailbox rights in D1. Delivery, SMTP acceptance, retrieval and explicit account acknowledgement are distinct events.


## Payment entry

The provider adapter defines connection eligibility and the next steps before payment. See [Stripe Japan payment entry](protocol-stripe-jp.md) for the current deployment's exact workflow, amounts and fees.
