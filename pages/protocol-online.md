<!-- SPDX-License-Identifier: CC0-1.0 -->
# Online MCP Credential Circulation

**Specification revision: 0.14. Application profile: `SITLA-online/1`. Whole-credential circulation: `SITLA-vc-jwt/1`. Draft.**

*Standard MCP and OAuth carry credential operations; credentials do not replace the transport or the authorization server.*

## 1. Boundaries and supported standards

This is the online reference deployment profile. Operators MUST advertise its actual capabilities. The [Core](protocol.md) trust boundaries and existing payment, lifecycle and account profiles still apply. Published optional ZKP packages, disaster DIDComm and inter-operator account migration are not runtime capabilities and return `unsupported_profile`.

| Layer | Format and responsibility |
| --- | --- |
| Transport | MCP Streamable HTTP and standard JSON-RPC, tool discovery, schemas, errors and `_meta` |
| Authorization | OAuth authorization code, PKCE S256, exact redirect/resource binding and DPoP sender-constrained tokens |
| Principal | A holder or operator DID with explicit, root-signed operational key authority |
| Credential circulation | Complete VC, Ed25519 JWS and the license/access policy below |
| Human authorization | Existing wire/1 `ApprovedAction`, including enrolled WebAuthn assertions |
| Service evidence | Operator-signed response and payment credentials; acceptance remains the verifier's policy |

An OAuth issuer remains an HTTPS issuer identifier. Its origin, registered callbacks, RP ID and protected-resource URLs MUST NOT be replaced with a DID. Operator and holder DIDs identify credential issuers; URLs locate MCP, OAuth, policies and status resources. An account URI remains an operator-local reference, not a substitute for a portable credential subject.

Normative upstream references: [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414), [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449), and [DID Core](https://www.w3.org/TR/did-core/). The experimental `did:sitla` method, issuer-key authorization, vocabulary and hosted status adapter are explicit SITLA extensions, not standardized DID-method registration, OpenID4VC conformance or blanket support for every VC format.

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

## 4. Complete signed credentials and policy

`SITLA-vc-jwt/1` uses `application/vc+jwt`, compact three-part JWS, protected `typ: vc+jwt`, `alg: EdDSA` and an explicitly root-authorized `kid`. The complete VCDM 2.0 credential, including `licenses` and `didAllowList`, is signed. Required JWT aliases `iss`, `sub`, `jti`, `vct`, integer `iat` and optional `exp` MUST agree with issuer, subject ID, credential ID, last type, validFrom and validUntil. This is a SITLA application adapter; it does not claim universal VC-JWT interoperability.

The original travels with `{descriptor, authorization}`. Verify DID derivation, ML-DSA grant, issuance purpose, assertion-role key, JWS signature/`kid`, issuer and issuance time within the grant. Reject redirected keys (`jwk`, `jku`, `x5u`, critical extensions), duplicate JSON keys, noncanonical base64url, malformed/expired claims and unsupported holder binding (`cnf`). Decoded JSON is bounded to 64 KiB, depth 32 and 10,000 nodes; compact credentials to 256 KiB. External status is not fetched automatically; unknown status stays indeterminate. A signature does not prove truth or institutional authority.

SITLA MUST reject SD-JWT, `~` disclosure serializations, nested `_sd`, `_sd_alg`, `...` placeholders and disclosure requests. It MUST NOT strip claims, assemble a derived credential or accept unsupported originals through an opaque-storage escape hatch. `storeOpaque` and per-credential `disclosures` arguments are removed. To disclose different information, obtain separate complete issuer-signed VCs, either in advance or by requesting reissuance. Missing claims are not evidence that the issuer certified their absence.

`issue_credential` requires the actual issuer-signed complete VC. Subject DID, type and claims match the reviewed recipient and arguments. The operator archives for the issuer; the recipient separately accepts opt-in DM delivery and explicitly imports. Issuer-selected UUIDv7 IDs and hosted status remain bound to the original ID/issuer; importing another status URL grants no authority. Custody is not subject ownership.

The normative license and DID access rules below apply to all supported admission, storage, publication, DM and presentation routes. Frozen legacy direct-JWS and SD-JWT fixtures remain historical verification material. They are not accepted by the current MCP merely because their signatures are valid. No historical signature is relabeled or silently assigned new permissions.

### 4.1 Signed license and recipient metadata

General DID/VC formats may carry zero or more arbitrary license identifiers and DID entries; the SITLA MCP imposes these narrower admission rules. Use top-level `licenses: string[]` and optional `didAllowList: string[]` (absent means `[]`). Identifiers are exact, case-sensitive strings, 1–2048 characters, at most 100 per array. `CC0-1.0` and `LicenseRef-SITLA-Internal-1.0` are the two recognized licenses. The latter refers to SITLA Internal Use Permission 1.0, governed by the service terms/privacy policy, not a public dedication.

| Object/use | Required licenses | Recipient list |
|---|---|---|
| Public DID document | Exactly `["CC0-1.0"]` | MUST be absent, even an empty property is not accepted as a DID setting |
| Public seller TrustReferences VC | Exactly `["CC0-1.0"]` | Absent or empty |
| General public VC | Exactly `["CC0-1.0"]` | Absent or empty |
| General internal VC | SITLA permission plus zero or more other licenses | Zero or more entries |
| Account/email/notification/Stripe binding and tool control VCs | Exactly `["LicenseRef-SITLA-Internal-1.0"]` | Absent or empty |
| Transaction progress VC | SITLA permission plus zero or more other licenses | MUST include the counterparty's `did:sitla` |
| Transaction result VC | Exactly the issuer-side policy agreed before starting work | Exactly the agreed entries; a nonpublic result sent to the counterparty must authorize that DID |

CC0 MUST NOT be combined with another license or a restrictive recipient list. A general VC with no recognized license is rejected. Unknown additional license identifiers in the SITLA branch and external DID entries are preserved and do not cause rejection by themselves. SITLA neither interprets them nor grants any rights from them; it does not certify their validity. External DIDs never satisfy a SITLA recipient check. Unknown licenses cannot loosen a recognized restriction. Issuers remain responsible for having permission to apply the declared license.

A license governs use, and the list governs service disclosure. SITLA permission with no recognized allowed recipient grants no third-party presentation or DM right. Authenticated owner retrieval/export and necessary internal service processing remain possible. An allowlist does not automatically deliver a VC, override consent/mandates, or allow the recipient to forward it. Only exact current `did:sitla` matches authorize third-party disclosure. DID rotation does not rewrite old signed lists; obtain a new credential for a new recipient DID. A CC0 credential may be disclosed after ordinary authentication, mandate and delivery checks. CC0 does not force every stored object to appear in search.

SITLA's published DID representations contain CC0 metadata and no allowlist. The frozen root descriptor and DID derivation bytes are unchanged; public keys and routing information do not contain secret keys. MCP has no arbitrary private-DID-document upload capability. Confidential supporting material belongs in a suitable internal VC, not the public DID representation.

### 4.2 Optional E2EE and ZKP between parties

Parties MAY agree on any end-to-end encryption or ZKP scheme and put its opaque ciphertext/proof in an otherwise valid complete VC. SITLA checks the outer issuer signature, known policy, routing, size, expiry/status and business fields needed for the operation. It does not decrypt, generate or verify the encrypted claims or proof, guarantee their truth, select an algorithm, or provide keys. Required readable authorization/payment fields cannot be replaced with ciphertext. No successful outer signature check is a successful ZKP or ciphertext-content check.

A derived proof from an old VC must be verified by the recipient against the original issuer commitment/signature and the agreed scheme. A newly holder-signed wrapper remains that holder's assertion; it is not a reissued credential from the original issuer. Some original signature schemes cannot efficiently support a desired proof. Parties handle this limitation themselves. Do not send private proof witnesses or plaintext secrets to SITLA.

SITLA can still see sender/recipient metadata and timing. A VC intended to conceal even the existence of communication MUST travel outside SITLA (for example DIDComm or another mutually chosen service), without granting SITLA permission. Such a VC is not admissible to the SITLA MCP. Terms/privacy and applicable obligations still govern data that is submitted.

## 5. Requests and signed responses

*Credential evidence is application data inside ordinary MCP.*

Authenticated `tools/call` includes `_meta["io.frourio.sitla/request"]` containing a compact session-signed `vc+jwt` (no `~`, no selectively disclosable fields). It includes the full VCDM context, credential ID/type, issuer, validity and subject ID, consistently bound to JWT aliases. Its `iss`/`sub` is the current account DID; `aud` is the independently pinned operator DID. Required claims include `licenses: ["LicenseRef-SITLA-Internal-1.0"]`, an absent/empty `didAllowList`, `vct: urn:sitla:credential:ToolRequest:1`, exact `resource`, `tool`, canonical `argumentsDigest`, `senderThumbprint`, random `jti`, `iat`, and `exp` within five minutes. The Ed25519 `kid` is `<actor-did>#session-<sender-jwk-thumbprint>`. Verify using the already authenticated DPoP session sender, not an arbitrary embedded key. A session-authorized request is not a root-authorized issuer assertion or new human consent. Reject replay, altered tool/arguments, wrong audience/resource/key and expired requests. A delegate remains bounded by its separate mandate.

A business tool result or handled business error includes `responseCredential`, an operator complete-VC JWS with type `urn:sitla:credential:ToolResponse:1`, five-minute expiry, exact tool/request ID, canonical SHA-256 of the request-credential **string**, requester DID, mandate ID, outcome and `resultDigest`. The latter hashes the canonical business object before adding the receipt, using the wire canonical byte rules with a separate 2 MiB/100,000-node application-page limit. The receipt has no fictitious live credential-status entry and is not a second copy of private data. Check the operator authority and compare all bindings; then apply independent acceptance policy.

MCP initialize/list/notifications, OAuth browser/token exchange, public HTTP pages, HTTP/JSON-RPC parse errors and transport/authentication failures remain standard control messages. Public bootstrap tools receive signed responses with no authenticated requester; they cannot prove first-use trust. Signature availability is not guaranteed during operator failure. An unsigned or unverifiable result MUST NOT be upgraded to signed evidence.

## 6. Trust references and whole-credential presentation

*Discover external trust references, not a marketplace of personal data.*

Publish the seller's DID on an external site (SNS, personal blog, portfolio, institutional website) before declaring its URL. Issue or import a self-issued `SITLA-vc-jwt/1` VC of type `urn:sitla:credential:TrustReferences:1` with issuer and subject equal to the current seller DID. Its complete claim at `/credentialSubject/claims/links` is an array of 1–50 distinct credential-free HTTPS URLs, each at most 2048 characters. Send `set_profile {credentialId}` and review the entire public credential, not only its projected links. Approval binds both the public VC and its link projection. No literal fields, personal-attribute form or paid disclosure plan is accepted.

The operator validates the supported VC, signature, authority, subject, status and link syntax; it stores the original in private R2 and projects only the URLs, DID and source credential reference to D1. Search by account identifier, DID or literal URL substring; `search_sellers` and `get_seller` return the DID and public links with `externalLinksVerified: false`. Locally revoked, expired, missing or mismatched credentials and withdrawn listings stop discovery. Old SD-JWT or unlicensed credentials never qualify for public search; their originals remain available for owner export and require reissuance to publish under the new policy. `get_seller_evidence` returns the complete CC0 credential and issuer authority. SITLA never fetches, embeds or verifies the linked sites; a verifier may check the DID, site ownership, activity and other evidence independently. A self-declared URL is a trust reference, not an inherently trusted cryptographic trust anchor or proof of identity. No paid-profile purchase operations exist; compensated requests for additional information or credentials use ordinary work.

`present_credentials` requires credential IDs, audience and purpose and returns each exact complete signed original plus issuer authority, after applying its recipient policy and the mandate. Selection-path arguments are rejected. A presentation log and service receipt bind the request; neither adds a fresh holder signature to the original VC. Plain search projections are not fresh presentations. Review every claim before public CC0 issuance/publication. A copied credential cannot be recalled.

## 7. Open-market issuance, work and payments

*The market defines a work VC. The operator attests its own circulation and payment actions.*

A buyer can request a new or derived issuer claim through ordinary `create_work`, with the chosen issuer as seller, market-defined schema/terms and agreed price. A source credential does not authorize a custodian to manufacture an absent predicate. The issuer may use online DID authentication for an automated reissue or require external/in-person checks; timing, price and acceptance are not guaranteed by the protocol.

Work proposal/acceptance binds the exact terms digest, including required `resultPolicies: {buyer: {licenses, didAllowList}, seller: {licenses, didAllowList}}`. Each side names the policy for VCs it will issue as results. Public portfolio use requires the corresponding CC0 result; a private agreement must choose SITLA permission and explicitly authorize the counterparty. `add_work_record` requires `phase: progress|result`: progress requires SITLA permission plus the peer DID; result must match that issuer's negotiated license/list sets and authorize delivery. Existing work without an agreed result policy cannot submit a result until a new agreement is made. Escrow creation also requires and freezes `resultPolicies` in its reviewed arguments and signed instructions; the caller's business `termsDigest` must commit to the same agreement. `add_work_record` requires an actual author-signed complete credential and issuer authority; the record schema and meaning remain market-defined. Its holder approval and delivery receipt do not replace the author signature. No universal contract, milestone or occupational qualification schema is imposed.

Existing [Collection Agency](protocol-collection-agency.md), [Conditional Payments](protocol-conditional-payments.md), [Payment Records](protocol-payments.md) and [Stripe Japan](protocol-stripe-jp.md) govern direct work and limited fund holding. Seller receipt authority, valid-capture price-debt discharge, immutable prior reservations after revocation, stable retries and signed bilateral exports remain required. A response receipt is not provider confirmation or a second charge. `get_counterparty_payment_history` remains transaction-scoped, direct-session-only and returns minimal recorded binding/dispute summaries, never a reputation guarantee. Provider payment conditions are defined by the selected adapter.

All new payment paths require a connected seller before collection. Runtime discovery declares pre-connection collection unsupported; see [Stripe Japan](protocol-stripe-jp.md).

## 8. Storage, deletion and portability

*R2 stores originals; D1 stores indexes, control state and rights.*

The reference deployment stores exact JSON packages containing signed credential/approval originals and paid snapshots in a private R2 vault, addressed by SHA-256. D1 retains opaque pointers/digests/sizes, public search projections, status and transaction-control data. Complete credentials and private approvals are not D1 search documents. Vault access is authenticated and owner/counterparty scoped; there is no public bucket or media upload. Retrieve through MCP, verify exact bytes and retained issuer evidence locally. Storage custody can expose entrusted plaintext to the operator.

Writes archive first, then publish an index. Missing/tampered originals fail closed. A failed index write may leave an orphan requiring maintenance; it does not publish a valid credential. Deletion tracks interrupted object erasure for retry and removes only originals no longer referenced by permitted counterparties or financial records. Original copies retained by the issuer, counterparty or provider follow their own rights and retention rules. Status unknown is not equivalent to deletion or revocation.

Exports include complete signed originals, issuer/root authority, approvals, current status observations and signed digest manifests with explicit page cursors. Reference pages contain at most five originals within a 128 KiB aggregate target (one larger original can occupy a page); private history pages use at most twenty records and a 256 KiB target. Continue from the actual returned cursor rather than assuming a fixed record count. A partial page MUST NOT be described as a complete vault. The frozen wire/1 canonicalization and root contexts remain stable; documentation revision 0.14 does not change their bytes. Credentials can be independently re-presented without the original operator when their format and issuer policy allow it; account-URI subjects and hosted status retain declared operator dependencies.

## 9. Credential direct messages

The [Credential DM](protocol-dm.md) profile adds an opt-in DID-addressed inbox, sender blocks, atomic quotas, complete signed credential delivery under its license and DID recipient policy and generic email notices. Reception is not credential import, acceptance or a new job. Direct sessions and holder approval protect mutations; read mandates have no DM scope. Original bodies and delivery receipts use the same private R2 vault, with mailbox rights in D1. Delivery, SMTP acceptance, retrieval and explicit account acknowledgement are distinct events.


## Payment entry

The provider adapter defines connection eligibility and the next steps before payment. See [Stripe Japan payment entry](protocol-stripe-jp.md) for the current deployment's exact workflow, amounts and fees.

Operator payment-event and delivery receipts describe operator actions and remain SITLA-internal with the participating DID recipients; negotiated `resultPolicies` govern the parties’ result VCs, not permission to publish private processor references.

## 10. Public job requests and monetary units

The new [public request profile](protocol-marketplace.md) specifies CC0 request listing, lightweight summary search, original retrieval from R2 and signed application reception before the existing negotiation/work flow. D1 stores only the declared projection and source/routing/status metadata; request details, applicant conditions and arbitrary extensions remain exclusively in the complete R2 original. Search cannot match those omitted fields. Cached projections can outlive a posting; no fresh application or work/payment authority follows from a cached result.

All newly supported money-bearing work/transaction VCs follow [MONEY-1–3](protocol-payments.md): their own signed currency and exponent, current JPY/0-only admission, and explicit future capability negotiation. Currency is not inferred from another VC. The public request's completion-license proposal is independent of its own CC0 license; final issuer-side result policies are negotiated and signed into the work terms.

These are specification requirements awaiting corresponding Worker operations/issuance changes. The existing generic VC vault, DM, work and payment tools do not by themselves implement public request discovery/application admission, and the specification's independent TLA+ checks do not certify Worker conformance. Participants verify the originals and determine their own trust rather than relying on SITLA's projection or verdict.
