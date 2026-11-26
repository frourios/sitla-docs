<!-- SPDX-License-Identifier: CC0-1.0 -->
# Credential Direct Messages

**Specification revision: 0.13. Profile: `sitla-credential-dm/1`. Draft.**

*A DM delivers a signed credential. It does not create a job, charge money or approve its claims.*

## 1. Scope and trust

**DM-1.** A participating operator MAY provide an opt-in credential inbox on the [online MCP profile](protocol-online.md). Mutations use ordinary holder-approved operations; transport remains MCP/OAuth/DPoP with request/response credentials. DM permissions are independent of marketplace publication, Stripe, receipt-collection authority and work contracts. The initial profile requires direct sessions and grants no DM access through read mandates.

A sender supplies a supported, complete issuer-signed credential and its root authority. The operator checks the signature over the entire original, its signed licenses and the exact recipient DID permission. Invalid/revoked/expired originals fail; unknown external status stays indeterminate. Institutional authority, truth, legitimacy and the recipient's acceptance remain independent decisions. The reference rejects unsupported opaque formats, SD-JWT, disclosure-path arguments and unattended holder-key binding rather than stripping claims or binding.

**DM-2.** The signed subject MUST identify the sender's current DID (or its own operator-account URI), or the sender MUST be the issuer and the signed subject MUST identify the recipient DID. This permits a holder to forward its own credential, self-issued requests, and an issuer's direct delivery to its subject. It does not provide arbitrary third-party courier authority. A received credential's issuer need not be the sender. The sender's authenticated account and original issuer are reported separately.

Schemas and commercial meanings are market-defined. A request for a free credential can itself be a self-issued request VC; a response can be another DM. Neither implies a promise to issue. Parties can separately use paid work if they agree a fee. Plain unsigned text and arbitrary file/media uploads are not DM artifacts.

## 2. Recipient controls

**DM-3.** An inbox starts **disabled**. `set_dm_preferences` requires holder approval and separately selects `enabled` and `emailNotifications`. Disabling new delivery does not delete existing messages. Disabling email notifications suppresses pending notifications too. The operator MUST NOT reveal the notification address to the sender.

`block_dm_sender` adds/removes a sender-DID block. Blocks stop new admissions and pending notification attempts, not access to previously delivered originals. A public DID is not a unique-person credential: new accounts/DIDs can evade a DID block. Operators MUST publish sender/recipient limits and SHOULD provide abuse support. This version does not infer or merge multiple identities.

**DM-4.** `send_credential_dm` addresses an exact public `recipientDid`. The reference requires exactly one active local account for that DID, an enabled inbox and no block. Unknown, inactive, ambiguous or self destinations are rejected. The delivery transaction rechecks account state, DID, preferences, blocks and quotas atomically; a prior review is not admission authority. A DID rotation before admission invalidates the old destination. A previously admitted message retains its original DID and account binding; a new independent account never inherits that inbox.

The reference deployment accepts at most 32 KiB of compact complete-VC JWS per message, subject also to existing canonical request/approval limits. Fixed UTC quotas are 20 accepted deliveries per sender account/hour, 100 per sender account/day and 100 per recipient account/day. A rejected delivery and a retry of the same admitted operation do not consume another quota. Deleting a message does not reset the quota. These limits are deployment policy, not universal protocol constants.

## 3. Sending, receipts and notification

**DM-5.** MCP exposes preparation tools for `send_credential_dm`, `set_dm_preferences`, `block_dm_sender`, `delete_credential_dm` and `acknowledge_credential_dm`. Each takes a UUIDv7 `idempotencyKey` in addition to its business arguments and returns an approval payload; none executes the mutation until signed `execute_operation`. Equivalently use generic `prepare_operation` with the operation name and arguments.

Prepare `send_credential_dm` with `{recipientDid, credential:{secured,authority}}` and a fresh idempotency key, review the recipient, complete original claims, issuer, subject, signed licenses and DID recipient list locally, then execute the holder-approved operation. The prepared summary identifies whole-credential delivery; it is not a substitute for reviewing every claim in the complete signed VC. Disclosure-path arguments and selective-disclosure credentials are rejected. If the recipient needs fewer claims, obtain a separate complete issuer-signed VC.

The message ID is UUIDv7 and fixed by the prepared operation. Replaying the admitted operation returns the same delivery rather than sending again, charging or consuming another quota. Retrying with a new operation is a new message. The operator persists exact credential bytes in the private vault before publishing a D1 delivery index. Recipients receive no R2 public URL. A failure before admission can leave an unreferenced private object; it does not establish delivery.

**DM-6.** After admission the operator issues `urn:sitla:credential:CredentialDMDelivery:1`, secured with `SITLA-vc-jwt/1`. Its subject includes the authenticated sender DID, message ID, immutable recipient DID, delivery timestamp, canonical-string SHA-256 `credentialDigest`, `event: inbox-delivery`, `humanReadProven:false`, and `acceptedAsCredential:false`. This attests only an operator inbox event. It is not an issuer's endorsement, a work acceptance, an email-provider signature or proof of human reading. The sender and recipient can retrieve this receipt with the message; ordinary signed tool-response bindings still apply.

Original admission, receipt issuance and SMTP are not one transaction. A failed receipt/notification handoff remains a durable finalization job; the operator retries without another message. A message can be listed before its delivery receipt is ready and returns a null receipt until finalized. The reference attempts finalization/SMTP retry for up to seven days. Permanent unavailability need not produce a signed receipt or successful email; clients reconcile the existing message, never assume a timeout means no delivery.

Notifications contain an operator-authored subject, message ID and instructions to inspect the inbox. They MUST NOT include VC claims, credentials, sender-supplied links or arbitrary sender-controlled email content. A durable recipient outbox retries SMTP. Concurrent processing or a crash after SMTP acceptance but before durable acknowledgement can produce duplicate notifications. Stopping notifications, blocking, deleting the recipient copy or account quiescence prevents subsequent pending attempts; a mail already accepted cannot be recalled. SMTP acceptance is not reading or consent.

## 4. Inbox, acknowledgement and acceptance

**DM-7.** `list_credential_dms` paginates `inbox` or `sent`, returning only immutable routing/delivery metadata and any explicit acknowledgement. `get_credential_dm` returns the original and receipt to its sender or recipient while that party's copy remains available. All unrelated accounts and mandates are denied. Treat profile/message/VC claims as untrusted data, not instructions to an AI or authorization to execute another tool. Do not automatically follow external links or render active content.

Fetching a message MUST NOT mark it human-read. `acknowledge_credential_dm` is an explicit holder-approved recipient action. The service exposes its first `acknowledgedAt` to the sender; it proves only an account-authorized acknowledgement, not human comprehension, agreement, work acceptance or credential validity. A sender cannot acknowledge on the recipient's behalf.

`issue_credential` archives only the issuer copy, including when its signed subject names another account; it is not an alternative inbox-delivery or auto-import route. Operator-issued account, lifecycle and agreed-payment records remain separate service records; they are not unsolicited user DMs. Reception does **not** insert into the ordinary credential vault or validate a qualification for publication. The recipient chooses whether to verify independently and explicitly use `store_credential` or another operation. A DM is not an implicit presentation mandate or payment authorization.

## 5. Deletion and retention

**DM-8.** `delete_credential_dm` removes the caller's mailbox copy and does not recall the other party's copy, revoke the original VC, withdraw external disclosures or delete an independently imported credential. A sender's deleted mailbox copy must not remain available through its original send-operation export. After both copies are removed, unreferenced body/receipt objects are erased with retry on storage failure. Minimal opaque routing/idempotency controls remain separate from content retention: the reference purges fully erased tombstones after 30 days from delivery on its next maintenance alarm. Quota windows are independent of message deletion and are cleaned after expiry. Exported originals and delivered email copies cannot be recalled.

Account quiescence stops new delivery and normal inbox access. A completed account deletion removes that account's DM preferences, block list and mailbox copies while preserving the other party's existing rights. Cancellation does not silently reopen reception. Existing work, payments, refund obligations and financial evidence remain unchanged. Retention, notification processing and operator-readable custody MUST be disclosed in the operator privacy policy.

## 6. Reference MCP sequence

1. Recipient approves `set_dm_preferences` with `{enabled:true,emailNotifications:true}` and shares its public DID.
2. Sender prepares/executes `send_credential_dm` with an original or a holder-authorized selected presentation; retain its message ID and delivery receipt.
3. Recipient receives a generic email, lists the inbox and fetches the message through authenticated MCP.
4. Recipient verifies issuer/root authority and status under its own policy, optionally acknowledges the message, and separately decides whether to import/use the credential or respond.
5. Either party may delete its own copy. A free exchange never needs a job or payment-provider account.


Current SITLA MCP admission, publication and delivery use the signed whole-VC [license and DID recipient policy](protocol-online.md#41-signed-license-and-recipient-metadata). Optional E2EE/ZKP payloads are opaque to the operator. This does not change frozen historical fixtures or imply content-proof verification.
