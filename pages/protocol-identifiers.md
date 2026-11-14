# Operator Account Identifier Profile

*SITLA Protocol v0.5 — Optional Credential Semantics Profiles*\
**Account binding:** `sitla-account/1`\
**Optional handle:** `sitla-account-handle/1`\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## 1. Automatic Account Identity, Optional Public Name

*Everyone can share an account reference. Choosing a unique name is optional.*

When an operator adopts the account-binding profile, it automatically assigns every registered account an immutable public account URI and makes its account-to-controller credential available to the holder. Registration, credential portability and sharing MUST work without reserving a custom handle. Core does not require account recovery; a fresh account has a distinct URI. Ordinary display names may repeat and change; they are profile data, not authenticated account identifiers. [Core](protocol.md) defines the shared assurance limits.

**ACCOUNT-ID-1.** Separate account identity, presentation and sharing:

| Element | Required for this profile? | Meaning |
| --- | --- | --- |
| Public account URI | Yes, automatically assigned | Immutable operator-scoped account reference |
| Current controller DID | Yes, in the account-binding VC | Current authorized key-control relationship |
| Display name | Product/profile data; duplicates allowed | Human-facing label, not a unique authority |
| Profile URL and QR | Available without choosing a handle | Share the immutable account URI |
| User-chosen unique handle | No | Optional short address for public/professional use |

For example, `https://sitla.frourio.com/accounts/pQ7m2gXn4aB8cD6eF1hJ9k` is a shareable account URI. An owner may additionally claim `matsuda`, yielding `https://sitla.frourio.com/@matsuda`, displayed locally as `@sitla/matsuda`. Neither the display name nor handle is needed to bind the account to a DID.

This is uniqueness of an operator account, not one account per human, legal identity, nationality or worldwide uniqueness of a short word. Operators need not implement a human-name registry at all if they do not offer the optional handle profile.

## 2. Canonical Namespace and Immutable References

*Identify the operator with a full authority URI. Keep that identity separate from a short brand alias.*

**ACCOUNT-ID-2.** The namespace is a canonical HTTPS origin with lowercase ASCII/Punycode DNS hostname, no IP literal, credentials, query, fragment, port (including explicit `:443`) or trailing slash. DNS labels must be valid. Reject alternate spellings rather than silently rewriting signed values. Authenticate its VC issuer/delegation, securing/status adapters and controller-change policy through accepted authority material or an explicitly accepted HTTPS bootstrap. A claimed namespace or co-fetched public key does not authenticate itself. Domain ownership changes do not automatically replace pinned issuer histories.

Account URI is exactly `namespace + "/accounts/" + publicReference`. The operator generates a 22-character opaque token from `[A-Za-z0-9_-]` using at least 128 bits of entropy, atomically prevents collisions, and never reassigns an account URI. It is separate from the internal UUID, email and personal-data hashes. The token is an identifier string, not encoded key material, a password or a bearer capability. Different accounts/operators are not automatically joined because they share a person, display name or root DID.

A client may map the display prefix `sitla` to its canonical origin through trusted configuration. Such a short prefix is not globally unique; show the full authority for an unknown, ambiguous or first-used alias. No global brand registry or Frourio registration is required.

## 3. Account-Binding VC and Sharing

*Bind the immutable account to its current DID. Mutable public presentation stays outside that binding.*

**ACCOUNT-ID-3.** An `OperatorAccountBindingCredential` has one subject with these required fields:

- `id`: immutable public account URI.
- `profile`: `sitla-account/1`.
- `namespace`: canonical issuer-authorized operator origin.
- `controllerDid`: current user-held Core `did:sitla:v1` root DID. Other methods require separately declared resolver/assurance profiles.
- `bindingVersion`: nonnegative safe integer, monotonically advanced on each binding issuance/refresh and DID change.

[The account subject schema](../artifacts/account-v1/subject.schema.json) and [unsigned examples](../artifacts/account-v1/examples.json) contain **no handle or display-name fields**. Adding, renaming or removing a handle/display name does not change this subject, its account URI or its controller-binding counter. A valid account-binding VC is sufficient as this profile’s account credential; a verifier MUST NOT demand a handle credential in its place.

A complete VC follows the [W3C VC 2.0 model](https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/), with unique credential ID, accepted issuer, validity and supported status mechanism. The stable credential type is `urn:sitla:credential:OperatorAccountBindingCredential:1`. Use a separately identified, mutually supported securing/holder-binding adapter; no new cryptosuite is invented here. For JSON-LD, supply the extension context mapping `profile`, `namespace`, `controllerDid` and `bindingVersion` to `urn:sitla:account:1:<claim-name>`; namespace/controller DID are IRI-valued. Unsupported securing/context/status formats are explicit failures. Subject schema validation is not VC verification or proof of uniqueness.

**ACCOUNT-SHARE-1.** The default profile/share URL is the public account URI, and its QR payload is that same HTTPS URI. Both are generated without a custom handle and remain stable through DID, display-name and handle changes. Link/QR creation does not imply consent to a public directory or disclosure of all profile data. The destination applies the user’s publication and access settings; private/deleted/unavailable accounts must not leak hidden attributes through the link. Sensitive pairwise flows do not disclose this correlatable account URI by default.

A QR or link is a transport for the reference, not evidence of current controller possession. Scanning it must not approve a transaction, grant a login, reveal paid/private data or convey an authentication secret. A verifier still needs accepted credential/status evidence and a fresh context-bound controller proof. Media authorization URLs and revocable invitations have separate purposes and must not replace the stable identity URI silently. DNS/service availability is not an offline trust guarantee.

## 4. Optional Handle Credential and Lifecycle

*Give public-facing users an optional memorable address. Keep its lifecycle separate from identity and key management.*

**ACCOUNT-HANDLE-1.** The optional `OperatorAccountHandleCredential` uses type `urn:sitla:credential:OperatorAccountHandleCredential:1` and one subject: `id` (the same public account URI), `profile: sitla-account-handle/1`, `namespace`, `handle`, `handleUri` and `assignmentVersion`. The [handle subject schema](../artifacts/account-handle-v1/subject.schema.json) and [unsigned lifecycle examples](../artifacts/account-handle-v1/examples.json) define the claim shape. It carries no independent controller DID. Link it to an accepted current account-binding VC by exact account URI and namespace, not by display name, raw handle or an old DID.

The complete handle VC has its own issuer proof, validity and supported current-assignment status. JSON-LD uses an explicit extension context mapping claims to `urn:sitla:account-handle:1:<claim-name>`; namespace/handle URI are IRI-valued. As with account binding, schema shape alone grants no authority. Do not treat the absence of this optional VC as proof that a user has never registered a handle. Search/display may use a current authorized optional alias; authorization and operator-local account history use the account URI and current binding.

**ACCOUNT-HANDLE-2.** Handles match `[a-z0-9][a-z0-9_-]{2,31}`, and handle URI is exactly `namespace + "/@" + handle`. Reject uppercase, encoded alternatives and Unicode confusables. Other normalization schemes require a named profile. The operator atomically reserves a unique handle in its namespace, including concurrent requests, and advances a separate nonnegative safe-integer `assignmentVersion` for every assignment, rename, refresh or removal. A removed assignment's counter does not reset on later registration. Do not merge it with `bindingVersion`.

For rename/removal, retire the old handle VC and publish authenticated assignment status. Removal creates no new active handle VC and never removes the account or its default share URL. Cache users must verify current status before displaying an alias as active; merely omitting a handle from another response does not authenticate removal. Retired/deleted handles cannot be assigned to a different account in this baseline. Privacy-preserving reservations/tombstones follow the published retention policy and are not a public trail of former holders. A signed counter alone does not prove the operator enforces uniqueness.

## 5. DID Recovery, Portable History and Migration

*Recover control of the same account. Do not rewrite another issuer’s subject or signature.*

**ACCOUNT-ID-4.** A normal controller/root rotation proves existing authority and new-root control under the declared rotation profile. Keep the account URI/namespace, advance `bindingVersion`, issue the new account-binding VC and retire the old binding. Losing all accepted keys does not supply that authority: a newly enrolled account receives a new URI. An arbitrary external continuity VC or payment-provider rebinding does not restore the old account URI, handle, sessions, private data or credential-subject authority. Serialize authorized binding changes, preserve predecessor/current-version evidence and never accept a cached account/name credential as current login/payout authority.

An optional handle still belongs to the same account URI. A DID change alone need not reissue the handle VC or change `assignmentVersion`; presentation resolves the current accepted account binding. If the assignment itself is withdrawn or contested, its status is handled independently. Verifiers check issuer namespace authority, signatures/adapters, exact account matching, validity, status/current versions and fresh controller possession. Do not roll back a known newer or revoked binding/assignment. Conflicting states require review; offline/stale evidence cannot establish the latest controller or alias.

**ACCOUNT-ID-5.** Work/qualification issuers may choose the immutable account URI as a subject if they accept that operator's account-continuity policy. This is a claim about an account, not automatically a physical person. Other issuers may require direct root binding or their own reissuance. Existing root-bound VCs do not automatically inherit from an account/name credential. Changing custody to another operator does not transfer namespace ownership, balances, sessions or service authority.

**ACCOUNT-PORTABILITY-1.** Issuers of long-lived qualifications SHOULD use the holder-controlled root DID as the credential subject, with any operator account URI as an auxiliary claim, or select an independently specified portable subject scheme. Root rotation still follows the issuer's continuity/reissuance policy; it is not automatic inheritance. Exporting an account-URI-subject VC preserves its signed bytes but does not make its subject independent of that operator's domain, availability, namespace or account-continuity policy. Such a VC is **operator-bound, not interoperably migratable** under v0.5. Do not advertise account continuity within one namespace as cross-operator portability.

v0.5 defines no inter-operator migration credential schema or shared acceptance protocol. A separately identified future adapter must define both account URIs/namespaces, proof of authority/control at each end, holder consent, issuer acceptance, validity/status, anti-replay and conflict resolution before it can claim that relationship. Until then, a destination creates its own distinct account and the original issuer must explicitly reissue or accept a separately agreed linkage; copied handles, matching display names, a redirect or a unilateral operator assertion are insufficient. Never rewrite another issuer's subject/signature or infer balance, session or mandate transfer.

**ACCOUNT-MIGRATION-1.** The older combined profile [`sitla-account-id/1`](../artifacts/account-id-v1/README.md) remains a legacy optional name-bearing credential with its original mandatory-handle schema. Its schemas/examples are not silently rewritten. To adopt the recommended profiles, the operator validates existing authority/current control and issues a new `sitla-account/1` credential for the same account URI, advancing bindingVersion beyond the latest authenticated legacy value rather than resetting it. It may separately issue a handle VC if the user wants the existing name. Do not relabel a signed legacy credential or require a handle just to migrate or enroll. Document revision 0.5 retains the stable wire/1 signature domains.

Account closure follows [Account Lifecycle](protocol-lifecycle.md): suspend operator account/handle VCs while deletion is pending, revoke them on completion, stop fresh controller/session authority and never reassign the account URI or retired names. An old credential/QR may still be copied; status/freshness checks remain necessary. User-held roots and independently issued qualification VCs are not globally deleted.

## 6. Conformance and Scope

*Test ordinary accounts without names first; test optional names as a separate capability.*

| Requirements | Test | Required outcome |
| --- | --- | --- |
| ACCOUNT-ID-1–3, ACCOUNT-SHARE-1 | Register without choosing a handle; use duplicate display names; share URL/QR | Automatic unique account URI and binding; no name-selection blocker; access/consent unchanged |
| ACCOUNT-HANDLE-1–2 | Add, rename, remove a handle; present a handle for another account; race two assignments | Stable base identity/share URL; exact subject matching; authenticated status; no double assignment or prohibited reassignment |
| ACCOUNT-ID-4 | Change DID with/without a handle; replay old binding or stale assignment | Same account URI; new authorized controller; independent binding/assignment counters; no rollback |
| ACCOUNT-ID-5 | Present old root-bound university VC with a new account VC | Original issuer policy still controls qualification acceptance |
| ACCOUNT-MIGRATION-1 | Present legacy combined credential to an unaware verifier | Explicit profile support/issuance, no silent reinterpretation |

The reference checks unsigned subject shapes and canonical identifiers only. Issuance/securing adapters, account/handle reservation storage, status, controller-change policy, profile rendering, QR generation and live holder challenges remain operator implementation work. An operator namespace is a trust/availability dependency; removing mandatory handles does not create anonymous or globally person-unique accounts.
