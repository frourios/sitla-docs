# Account Lifecycle Profile

*SITLA Protocol v0.7 — Core Lifecycle Semantics and Optional Exchange Profile*\
**Exchange profile:** `sitla-account-lifecycle/1`\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## 1. Four Different Operations

*End a login, withdraw a delegation, or close an operator account with an explicit scope.*

Core implementations MUST define these lifecycle effects for the sessions, delegations and accounts they provide. The optional `sitla-account-lifecycle/1` exchange schemas offer common request/receipt semantics without prescribing a particular MCP tool name, HTTP route or interface. The prose revision and existing wire/1 contexts remain unchanged. Operators declare exchange support rather than pretending that existing deployed tools implement it.

| Operation | Session effect | Mandate effect | Account/credential effect |
| --- | --- | --- | --- |
| `logout` | Current session and its token family | Unchanged | Active; credentials unchanged |
| `logout-all` | All existing account session/token families | Independently authorized mandates remain | Active; credentials unchanged |
| `revoke-mandate` | No unrelated login change | Exact target and all authority derived solely from it | Active; account/handle credentials unchanged |
| `delete-account` | All sessions/token families | All owner-controlled mandates and descendants | Immediate restricted state, then closed account; operator account/handle VCs suspended then revoked |

**LIFE-1.** Show these scopes before authorization. A name, account URI, QR, credential copy or request field is not authorization. Bind operator, account, caller, request/digest, target, policy, expiry and current session/recovery epochs. Reject cross-account/cross-operator substitution. Financial/contract cancellation and key destruction are separate operations and are never inferred from these commands. An operation receipt is an operator assertion about its actions, not cryptographic proof of physical erasure or worldwide revocation.

## 2. Current and All-Device Logout

*Invalidate the credentials that represent a login, without accidentally changing separate permissions.*

**LOGOUT-1.** For `logout`, determine the current session from authenticated server-side context, not a user-supplied session ID. Invalidate that session, rotated refresh-token family, session-derived API/access credentials and continuation channels. A sender-constrained token still needs revocation checks; DPoP possession alone does not restore a revoked session. Other sessions remain usable. Clear the client’s relevant local tokens/session storage, but do not erase wallet roots, another service's credentials or OS-synced passkeys.

**LOGOUT-2.** `logout-all` atomically advances the account’s session epoch or equivalent barrier and disables every session family, including the initiating one and agents logged in through those sessions. Refresh/reconnect/approval callbacks racing the barrier must fail if they rely on an older epoch. Issuing replacement session tokens from an old refresh token is not a logout-all implementation. Fresh account login remains possible through authorized authentication after completion.

Distinguish a **session-derived credential** from an **independent mandate**. A separately authorized server-side job or grant can remain valid after logout; its independent execution authority must have explicit scope and cannot masquerade as a surviving interactive session. To stop that authority, revoke its mandate. Interfaces must make this distinction clear when an agent or financial delegation remains active. Declared OAuth token revocation follows its negotiated standard, such as [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009), alongside the account/session barrier; this profile does not redefine OAuth endpoints or assert that one token revocation globally logs out an account.

Current-session logout requires the applicable authenticated session; it must not demand a new root signature just to leave. All-device logout requires fresh, appropriately scoped approval or an authorized incident-containment procedure. Recovery-only access does not automatically gain destructive account privileges. Browser-only clients also need CSRF/caller-origin protection; native/agent clients follow their authenticated sender-binding profile.

## 3. Withdrawing a Mandate

*Remove future authority, including delegated descendants, while preserving unrelated grants and existing contractual records.*

**MANDATE-1.** The authorizing account or an explicitly authorized revoker may withdraw a named mandate. Verify target ownership and authority from server state. An agent cannot revoke another owner's or an unrelated client's grant merely by knowing its ID. Reject wildcard/empty targets in this single-target operation; a separately declared bulk interface needs its own explicit scope/approval.

Revocation covers delegated grants, tokens, subscriptions, queued execution and presentation authority derived solely from the target. Preserve independent authorizations; do not infer that all grants to the same agent are the same mandate. Prevent re-delegation or token renewal from a withdrawn ancestor, and recheck current authority immediately before an irreversible execution. Existing holder/issuer signatures and qualification facts do not become false because a presentation mandate was withdrawn.

A completed revocation stops future authorized effects at the operator’s recorded barrier. It does not claw back delivered information, undo a provider-confirmed payment, cancel a job contract or prove that a third party destroyed copies. For in-flight work, serialize the authority check and execution commitment; record which side of the barrier an effect committed on. Late provider callbacks reconcile that existing effect and never recreate revoked authority.

## 4. Requesting and Completing Account Deletion

*Closing the account removes operating authority. It does not delete the person’s identity from every issuer or service.*

**DELETE-1.** Require fresh, explicit account-owner approval bound to `delete-account`, the exact account/operator and the canonical request. A suitable ApprovedAction/passkey ceremony uses the existing approval profile with the lifecycle request digest as its reviewed `payload_digest`; authenticate its actor, scope, challenge, epochs, audience and terms under this separately declared lifecycle adapter. Do not inject approval bytes into the request hash or silently treat a request-evidence operation as a deletion request. Session possession alone, an email-only claim or external continuity VC or an arbitrary caller-supplied consent Boolean is insufficient.

Offer data/VC export before confirmation, show remaining jobs, payments, balances, withdrawal of grants, retained-record rules and the consequence for external copies. The user may knowingly proceed without exporting; export completion or an external wallet’s availability is not a compulsory deletion prerequisite. A statutory privacy request can use a separately declared legal intake, but does not restore login or ordinary account authority. An unauthenticated support report, reused email, external continuity VC or fresh account cannot execute deletion of the old account.

**DELETE-SAFETY-1.** For accounts with balances or active mandates, operators SHOULD notify a pre-enrolled independent notification route and offer a short cancellation grace period before irreversible purge. Publish `deletionCancellationGraceSeconds` (a nonnegative integer), its scope, the exact deadline, notification behavior and the reason if no grace is offered; the protocol fixes no universal duration. Freeze the applicable policy/deadline at acceptance and do not shorten an in-flight grace. Quiescence and revocation still begin immediately; grace is not continued login, payout, disclosure or mandate authority. Preserve only the data needed to honor the declared grace and retention policy, and do not claim completion while the account remains restorable under that grace.

Cancellation, if offered, requires a **separate explicitly negotiated operation**, fresh owner approval and independent-route verification or equivalent reviewed evidence. The original deletion approval, revoked session, read-only status capability or possession of an email notification cannot cancel it. A contested/compromised recovery cannot approve restoration by default; route it to independent ownership review. Record cancellation before the deadline/purge barrier; reject races that arrive after the irreversible cutoff. Cancellation does not reactivate old sessions, revoked mandates or retired credentials: any renewed login, grant or credential needs its own current authorization. State explicitly which data can still be restored and what is already irrecoverable. The existing lifecycle request/receipt schemas intentionally contain no `cancel-delete` operation or `cancelled` state; implementations need a separately named adapter rather than inventing values in `sitla-account-lifecycle/1`. Lawful privacy requests remain a separate process; a convenience grace must not obstruct their timely handling.

**DELETE-2.** An accepted deletion request commits an immediate quiescence barrier: disable all account sessions and RP credential associations, withdraw owner-controlled mandates/descendants, stop new login/issuance/disclosure/sales/task acceptance and suspend affected operator account/handle credentials. Keep the account URI and retired handles non-reassignable. A recovery callback, delayed webhook, agent retry or new browser session must not resurrect the account. Disabling the local RP association does not erase a private passkey from a hardware authenticator or other RPs.

Process remaining storage/presentation links, media URLs, queued work and credential status consistently with that barrier. Do not claim revocation of a previously issued signed media URL before its verifier/expiry actually enforces it. Reconcile existing payment/work obligations through separately authorized settlement operations with restricted access; deletion is not a payment cancellation, balance confiscation or a grant to change a beneficiary. A delayed settlement must not restore ordinary account access. An active or restricted account must never be shown as completely erased merely because a delete button was clicked.

**DELETE-3.** Distinguish `accepted`, `processing`, `completed` and `rejected`. `accepted`/`processing` mean authority is already disabled while purge/status/settlement handling continues. `completed` means the operator account is closed, its account/handle credentials are revoked, ordinary serving/storage has been removed as promised, and any retained-record exceptions are explicitly recorded. It does not mean every backup, payment-provider record or third-party copy has vanished. Issuer signatures, copied data and user-held wallet secrets remain outside the operator's deletion power.

List retained categories, purposes, retention basis and a deadline or bounded determination rule; restrict their use/access. A retention exception is not permission to keep a public profile searchable or continue using private data for new work. Follow the published operator retention/backup policy and the separate privacy-request process. A continuing dispute must not become an unexplained perpetual account lock or hidden indefinite retention. Account deletion is not a promise of instantaneous backup/media/foreign-issuer erasure.

## 5. Authorization, Races and Idempotency

*Record the authority change before reporting success. Retrying a request must not widen its scope.*

**LIFE-2.** The [request schema](../artifacts/lifecycle-v1/request.schema.json) fixes `protocol: sitla-wire/1`, exchange profile, operation, operator/account, request ID, client audience, purpose, fresh challenge, issue/expiry, accepted policy digest, expected session/recovery epochs, idempotency key and nullable mandate ID. Only `revoke-mandate` carries a non-null exact mandate target. Hash the canonical request bytes. Authorization comes from the caller’s accepted session/approval and current server state, not the repeated account/epoch fields in the JSON.

Bind idempotency to operator/account/actor, operation, target and canonical request. Changed content under an existing key is `idempotency_conflict`. Recheck current authorization on retries; no revoked token or idempotency key becomes a bearer account-access credential. A normal unauthenticated repeat logout may return a generic acknowledgement with no account/session-existence disclosure; it is not a private receipt proving a particular account's state.

Use a linearizable revocation barrier or equivalent enforcement across every protected online handler. Check epochs/status on access, refresh, streaming/reconnect, queued dispatch and irreversible commitment. Do not report `completed` while ordinary online credentials can still execute after the claimed cutoff. If a protected handler cannot obtain the required current revocation state, it fails closed for the affected operation. Independently acting/offline parties retain the uncertainty described below.

**LIFE-3.** Logout and single-mandate revocation receipts are `completed` or `rejected`. Deletion can additionally be `accepted`/`processing`. Successful effects carry `effective_at`, the authority cutoff, and `recorded_at`; completion additionally carries `completed_at`. For asynchronous deletion, the final completion time can be after request expiry because it continues a request authorized before that expiry. It cannot authorize another command. Rejected requests report no new scope effects. Existing scope/account state is not reset by a rejection.

After logout/deletion, do not require the revoked session to query completion. If asynchronous status is offered, a nonsecret status reference has separately issued, expiring, sender-constrained, read-only case authorization or a reviewed support route. That authorization reveals only the necessary operation status/retention receipt, cannot cancel deletion or reopen the account, and is not embedded as a bearer secret in a URL/QR. Status absence or authorization expiry does not undo an accepted deletion. A deletion-cancellation/restore flow, if offered, is a separately declared and authorized operation outside this profile.

## 6. Receipts, Portability and Offline Limits

*Use explicit scopes and authenticated status, not the mere absence of an account page.*

`session_epoch` in a receipt is the committed snapshot at the cutoff, not an instruction to roll back later state. All-session logout/deletion strictly advance it; other successful operations preserve the authenticated request epoch. A status reference is a canonical same-origin HTTPS resource without credentials, query or fragment; authorization is supplied separately. `retained_records` describes deletion exceptions only: an empty array on logout does not assert that normal audit logs were erased.

The [receipt schema](../artifacts/lifecycle-v1/receipt.schema.json) binds the request digest and actual committed session/mandate/account/credential scopes. The optional [signed receipt](../artifacts/lifecycle-v1/signed-receipt.schema.json) wraps that receipt as `payload`, signed over canonical payload bytes with an accepted operator Ed25519 key and domain `SITLA/lifecycle-receipt/1`. This is a separately named lifecycle receipt contract, not a modification of existing wire/1 evidence-request/service-assertion schemas. The [public fixtures](../artifacts/lifecycle-v1/examples.json) use disposable signing keys and synthetic state only; a fixture key is not a live operator authority.

**LIFE-4.** Deletion revokes this operator’s account-binding and handle credentials and its own operating delegations; it does not revoke a university's qualification VC, rewrite historical contract signatures, destroy the user's DID/root key, log them out of other operators or cancel an external operator’s grants. External verifiers must apply their accepted status/continuity policy. Retain a minimal authenticated account/credential tombstone or status observation as permitted by operator policy; an HTTP 404 alone is not proof of revocation. Never reassign the deleted account URI or retired handle to a different holder.

**LIFE-5.** A network partition, cached token, old snapshot, signed URL or previously exported VC can outlive a local logout/deletion event. Publish actual status/expiry observations and online enforcement bounds. An offline verifier must not label old positive evidence as fresh/current or assume that a global logout happened everywhere. On reconnection, fetch authenticated updates, preserve known newer revocations and reconcile effects without changing historical observations. These controls provide no global emergency stop for every disconnected system.

## 7. Conformance and Deployment Boundary

| Requirements | Adversarial case | Expected result |
| --- | --- | --- |
| LOGOUT-1–2, LIFE-2 | Refresh/reconnect races; another device; autonomous grant | Appropriate session families stop; no old-epoch renewal; independent mandate scope is explicit |
| MANDATE-1 | Guess another owner's ID; derive a child token after withdrawal | No unauthorized target action; descendants stop; unrelated grants remain |
| DELETE-1–3, DELETE-SAFETY-1 | Unauthenticated or continuity-only caller; export unavailable; delayed provider callback; retained dispute record | No destructive authority bypass; informed deletion remains possible; no resurrection; retention explained |
| LIFE-2–3 | Retry changed target/key; query after session revocation | No wider effects, duplicate operation or bearer-status leak |
| LIFE-3–5 | Claim completion with active account, unchanged credentials, missing cutoff or old offline status | Structural/semantic rejection or explicit uncertainty; no fabricated global erasure |

These are specification and static receipt-validation artifacts. The reference does not implement sessions, revocation storage, job interruption, account purge, settlement, proof-of-erasure or distributed atomicity. Existing runtime tool contracts remain authoritative until those capabilities are implemented and advertised. The common trust limits in Core apply.
