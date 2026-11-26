# Operator Account Identifier Profile

*SITLA Protocol v0.13 — Optional Credential Semantics Profiles*\
**Account binding:** `sitla-account/1`\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## 1. Automatic Account Identity

*Every account has a stable reference. Public trust references link the DID to external sites.*

When an operator adopts the account-binding profile, it automatically assigns every registered account an immutable public account URI and makes its account-to-controller credential available to the holder. Registration, credential portability and sharing require no chosen public name. Core does not require account recovery; a fresh account has a distinct URI. External trust references are self-declared links, not authenticated account identifiers. [Core](protocol.md) defines the shared assurance limits.

**ACCOUNT-ID-1.** Separate account identity, presentation and sharing:

| Element | Required for this profile? | Meaning |
| --- | --- | --- |
| Public account URI | Yes, automatically assigned | Immutable operator-scoped account reference |
| Current controller DID | Yes, in the account-binding VC | Current authorized key-control relationship |
| Profile URL and QR | Automatically available | Share the immutable account URI |

For example, `https://sitla.frourio.com/accounts/pQ7m2gXn4aB8cD6eF1hJ9k` is a shareable account URI. Seller discovery uses the DID and [external trust references](protocol-online.md); no custom account-name registry or alias URL is provided.

This is uniqueness of an operator account, not one account per human, legal identity, nationality or worldwide uniqueness of a short word.

## 2. Canonical Namespace and Immutable References

*Identify the operator with a full authority URI. Keep that identity separate from a short brand alias.*

**ACCOUNT-ID-2.** The namespace is a canonical HTTPS origin with lowercase ASCII/Punycode DNS hostname, no IP literal, credentials, query, fragment, port (including explicit `:443`) or trailing slash. DNS labels must be valid. Reject alternate spellings rather than silently rewriting signed values. Authenticate its VC issuer/delegation, securing/status adapters and controller-change policy through accepted authority material or an explicitly accepted HTTPS bootstrap. A claimed namespace or co-fetched public key does not authenticate itself. Domain ownership changes do not automatically replace pinned issuer histories.

Account URI is exactly `namespace + "/accounts/" + publicReference`. The operator generates a 22-character opaque token from `[A-Za-z0-9_-]` using at least 128 bits of entropy, atomically prevents collisions, and never reassigns an account URI. It is separate from the internal UUID, email and personal-data hashes. The token is an identifier string, not encoded key material, a password or a bearer capability. Different accounts/operators are not automatically joined because they share a person, display name or root DID.

No global brand registry or Frourio registration is required.

## 3. Account-Binding VC and Sharing

*Bind the immutable account to its current DID. Mutable public presentation stays outside that binding.*

**ACCOUNT-ID-3.** An `OperatorAccountBindingCredential` has one subject with these required fields:

- `id`: immutable public account URI.
- `profile`: `sitla-account/1`.
- `namespace`: canonical issuer-authorized operator origin.
- `controllerDid`: current user-held Core `did:sitla:v1` root DID. Other methods require separately declared resolver/assurance profiles.
- `bindingVersion`: nonnegative safe integer, monotonically advanced on each binding issuance/refresh and DID change.

[The account subject schema](../artifacts/account-v1/subject.schema.json) and [unsigned examples](../artifacts/account-v1/examples.json) contain **no handle or display-name fields**. Changing external trust references does not change this subject, its account URI or its controller-binding counter. A valid account-binding VC is sufficient as this profile’s account credential.

A complete VC follows the [W3C VC 2.0 model](https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/), with unique credential ID, accepted issuer, validity and supported status mechanism. The stable credential type is `urn:sitla:credential:OperatorAccountBindingCredential:1`. Use a separately identified, mutually supported securing/holder-binding adapter; no new cryptosuite is invented here. For JSON-LD, supply the extension context mapping `profile`, `namespace`, `controllerDid` and `bindingVersion` to `urn:sitla:account:1:<claim-name>`; namespace/controller DID are IRI-valued. Unsupported securing/context/status formats are explicit failures. Subject schema validation is not VC verification or proof of uniqueness.

**ACCOUNT-SHARE-1.** The default profile/share URL is the public account URI, and its QR payload is that same HTTPS URI. Both remain stable through authorized DID changes and changes to external trust references. Link/QR creation does not imply consent to a public directory or disclosure of all profile data. The destination applies the user’s publication and access settings; private/deleted/unavailable accounts must not leak hidden attributes through the link. Sensitive pairwise flows do not disclose this correlatable account URI by default.

A QR or link is a transport for the reference, not evidence of current controller possession. Scanning it must not approve a transaction, grant a login, reveal private data or convey an authentication secret. A verifier still needs accepted credential/status evidence and a fresh context-bound controller proof. Media authorization URLs and revocable invitations have separate purposes and must not replace the stable identity URI silently. DNS/service availability is not an offline trust guarantee.

## 4. DID Recovery, Portable History and Migration

*Recover control of the same account. Do not rewrite another issuer’s subject or signature.*

**ACCOUNT-ID-4.** A normal controller/root rotation proves existing authority and new-root control under the declared rotation profile. Keep the account URI/namespace, advance `bindingVersion`, issue the new account-binding VC and retire the old binding. Losing all accepted keys does not supply that authority: a newly enrolled account receives a new URI. An arbitrary external continuity VC or payment-provider rebinding does not restore the old account URI, sessions, private data or credential-subject authority. Serialize authorized binding changes, preserve predecessor/current-version evidence and never accept a cached account credential as current login/payout authority.

Verifiers check issuer namespace authority, signatures/adapters, exact account matching, validity, status/current versions and fresh controller possession. Do not roll back a known newer or revoked binding. Offline/stale evidence cannot establish the latest controller.

**ACCOUNT-ID-5.** Work/qualification issuers may choose the immutable account URI as a subject if they accept that operator's account-continuity policy. This is a claim about an account, not automatically a physical person. Other issuers may require direct root binding or their own reissuance. Existing root-bound VCs do not automatically inherit from an account credential. Changing custody to another operator does not transfer namespace ownership, balances, sessions or service authority.

**ACCOUNT-PORTABILITY-1.** Issuers of long-lived qualifications SHOULD use the holder-controlled root DID as the credential subject, with any operator account URI as an auxiliary claim, or select an independently specified portable subject scheme. Root rotation still follows the issuer's continuity/reissuance policy; it is not automatic inheritance. Exporting an account-URI-subject VC preserves its signed bytes but does not make its subject independent of that operator's domain, availability, namespace or account-continuity policy. Such a VC is **operator-bound, not interoperably migratable** under v0.13. Do not advertise account continuity within one namespace as cross-operator portability.

v0.13 defines no inter-operator migration credential schema or shared acceptance protocol. A separately identified future adapter must define both account URIs/namespaces, proof of authority/control at each end, holder consent, issuer acceptance, validity/status, anti-replay and conflict resolution before it can claim that relationship. Until then, a destination creates its own distinct account and the original issuer must explicitly reissue or accept a separately agreed linkage; matching external links, a redirect or a unilateral operator assertion are insufficient. Never rewrite another issuer's subject/signature or infer balance, session or mandate transfer.

**ACCOUNT-MIGRATION-1.** The older combined profile [`sitla-account-id/1`](../artifacts/account-id-v1/README.md) remains a legacy optional name-bearing credential with its original mandatory-handle schema. Its schemas/examples are not silently rewritten. To adopt the recommended profiles, the operator validates existing authority/current control and issues a new `sitla-account/1` credential for the same account URI, advancing bindingVersion beyond the latest authenticated legacy value rather than resetting it. The retired `sitla-account-handle/1` artifacts are retained solely for historical verification, never for new issuance. Do not relabel a signed legacy credential. Document revision 0.13 retains the stable wire/1 signature domains.

Account closure follows [Account Lifecycle](protocol-lifecycle.md): suspend operator account VCs while deletion is pending, revoke them on completion, stop fresh controller/session authority and never reassign the account URI. An old credential/QR may still be copied; status/freshness checks remain necessary. User-held roots and independently issued qualification VCs are not globally deleted.

## 5. Conformance and Scope

*Test automatic account identity and stable references.*

| Requirements | Test | Required outcome |
| --- | --- | --- |
| ACCOUNT-ID-1–3, ACCOUNT-SHARE-1 | Register without choosing a name; share URL/QR | Automatic unique account URI and binding; no name-selection blocker; access/consent unchanged |
| ACCOUNT-ID-4 | Change DID; replay old binding | Same account URI; new authorized controller; monotonic binding counter; no rollback |
| ACCOUNT-ID-5 | Present old root-bound university VC with a new account VC | Original issuer policy still controls qualification acceptance |
| ACCOUNT-MIGRATION-1 | Present legacy combined credential to an unaware verifier | Explicit profile support/issuance, no silent reinterpretation |

The reference checks unsigned subject shapes and canonical identifiers only. Issuance/securing adapters, account reservation storage, status, controller-change policy, profile rendering, QR generation and live holder challenges remain operator implementation work. An operator namespace is a trust/availability dependency; an opaque account URI does not create anonymous or globally person-unique accounts.
