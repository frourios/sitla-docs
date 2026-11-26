# Bounded protocol models

The seven TLA+ models check protocol safety and selected progress properties. They are not a refinement proof for the Worker, provider, database or an arbitrary implementation. Standalone docs CI runs them; parent application CI separately tests runtime behavior.

| Model | Protocol boundary and finite bounds |
|---|---|
| ConditionalPayment | HOLD-1–5 / COLLECT-1–4: one transaction, buyer/seller/stranger, chosen duration 1 or 2 ticks, saturated time 0–6; capture can precede observation. The clock begins at provider capture, not draft creation or observation. Seller authorizes collection before capture. Buyer release requires the original collection predecessor and inspection; seller/alarm refunds gross. First durable decision wins, including completion after expiry. Two author roles have asymmetric public/internal policies and either zero or two ordered public job IDs. Both verified, exactly bound originals must be atomically available to both recipients before release. No party cooperation is assumed after that handoff. |
| ProviderRecovery | One capture/release/refund, two in-flight slots, one crash/outage, stable effect key and frozen destination. Responses may be lost/reordered; authentic provider queries and provider deduplication are assumed. |
| CollectionAuthority | Two reservations compete for one gross budget slot. Withdrawal is an atomic barrier for new reservations; original seller connection/destination is frozen. Direct/card capture requires an abstract durable result-pair readiness gate; the conditional model checks role/policy/list/copy structure. Expiry assumes an unfunded reservation cannot later capture; uncertain provider capture is not abstracted as safe expiry. |
| ApprovalExecution | Two workers/approvals/epochs, expiry tick 2. Consumption and current authorization are rechecked at atomic commit; external effects are separate. |
| PublicJobRequests | One original, five validity/currency/signature classes, JPY/0, minimum 500, expiry 2 and time 3. Projection excludes details/eligibility/extensions. Clients independently verify originals. Cached displays may outlive expiry. Once published, ID retrieval remains enabled through hiding, expiry, revocation and owner deletion; private pre-publication storage alone does not permit public retrieval. Party negotiation actions are environment choices, not operator APIs; agreed rewards 500/600 and result policies may differ from advertisements. Ordinary contact is independent of listing validity; its actual DM gate is the separate model below. |
| MarketplaceDM | Seller and request publication share reception preferences. Two senders/three message intents (two by one sender) are finite bounds, not quotas. Atomic publication enables DM while preserving email preference; effective listings block disable. Request expiry ceases to require reception, while an active seller listing still does. Individual blocks and a changing abstract technical gate restrict new messages. Contacts never unpublish a listing; repeat contacts do not require any application state. |
| DIDHistory | One affected scope, two verifier workers, four commits, one crash, committed/uncommitted successor configurations and ten artifact classes. Checks atomic whole-artifact commit, rollback/forks, dual-root proof, terminal revocation and deterministic retry identity. Cryptography is abstract verified input, checked concretely by the signed cross-language corpus. |

ConditionalPayment assumes weak fairness for advancing time, observing captured funds, resolving one temporary provider conflict, the deadline alarm and committed financial completions. No buyer/seller cooperation is assumed. Capture must occur early enough that the finite clock can reach the selected deadline. A permanently blocked provider or permanent outage has no termination guarantee. ProviderRecovery additionally assumes eventual provider recovery and fair successful retry/reconciliation; key expiry and untrustworthy provider responses are outside its bounds. PublicJobRequests assumes fair clock/index progress, never fair cache refresh or party agreement. MarketplaceDM is a safety model: no eventual delivery, response, hiring or opening of a technical gate is promised.

Opaque DM bodies, E2EE/ZKP contents, real signatures, wall-clock accuracy, arbitrary cardinalities, storage garbage collection, all possible currencies and network replicas are outside these models. Result VCs are mandatory evidence gates, not automatic release actions; a separately authorized financial instruction is required. The model's inspection input is a buyer declaration, not an operator judgement of work quality.

## Run

Java 21 and Python 3.10+ are sufficient:

```sh
cd docs
python3 formal/check.py
# Or use an existing exact, hash-pinned JAR:
python3 formal/check.py --jar /path/to/tla2tools.jar --java /path/to/java
```

The checker downloads TLC 1.7.4 only when needed and verifies the SHA-256 in [tools.lock.json](tools.lock.json), including restored caches. It uses one worker, fixed seed/fingerprint and a 1 GiB heap. Each check has a 180-second timeout. Parser errors, unexpected counterexamples, wrong exit codes or incomplete exploration fail. Positive models must finish exhaustive exploration; negative checks must produce the named invariant violation (exit 12) and a trace. Logs, source/config/JAR hashes and counts go to ignored `formal/.cache/reports/`; binaries/states are not committed. [Standalone CI](../.github/workflows/ci.yml) caches only the pinned JAR and keeps reports for seven days. Models run on cache hits too.

## Mutation and permitted-behavior checks

The 32 selected guard-removal variants check publication without enabling DM, disabling reception while published, contact-induced unpublication, bypassed DM technical gates, observation/retry resetting the deadline, six DID-history guards, four projection/currency/client-verification guards, late release, missing inspection, unstable provider keys, changed destination, withdrawal/budget races and approval consumption/epoch races. Eight further mutations target release/capture without the pair, changed policy/ID lists, missing signatures, a missing recipient copy, listing-dependent original access and original loss on deletion. They are not exhaustive mutation coverage. `NoBusinessContactLimit` uses actual `ENABLED Contact(i)` under current reception/block/technical conditions, rather than restating an admission predicate.

Four checks retain the unmodified models and deliberately refute stronger claims: `AtMostOnePerSender` (repeat messages are possible), `ContactClosesListing` (contact leaves a published listing open), `CacheAlwaysFresh` (cache may survive expiry) and `ContractEqualsAdvertisement` (parties may privately agree another price). These witnesses prevent accidental stronger guarantees; they are permitted behavior, not bugs.

## Recorded verification

All **43 checks** passed on 2026-11-27 with the locked JAR and Temurin Java 21: seven positive models, 32 named guard-removal counterexamples and four permitted-behavior witnesses.

| Positive model | Generated states | Distinct states |
|---|---:|---:|
| ConditionalPayment | 15,596 | 3,896 |
| ProviderRecovery | 9,270 | 1,722 |
| CollectionAuthority | 1,800 | 318 |
| ApprovalExecution | 1,102,465 | 241,708 |
| PublicJobRequests | 2,177,997 | 112,183 |
| MarketplaceDM | 35,300 | 3,584 |
| DIDHistory | 358,579 | 70,598 |

Counts describe only these finite configurations. Re-run after any model/config change; fresh reports and their source hashes are authoritative. Real DM counters, atomic D1 guards and payment failure recovery require separate application tests.

Models/configurations/checker are Apache-2.0 under [reference/LICENSE](../reference/LICENSE); this README/specification prose is CC0-1.0 under [LICENSING.md](../LICENSING.md). TLC retains its upstream license.
