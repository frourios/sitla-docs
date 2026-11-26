<!-- SPDX-License-Identifier: CC0-1.0 -->
# Bounded TLA+ verification of SITLA v0.15

Six models check the four highest-priority state-machine requirements and the public request/currency boundary. TLC explores every reachable state of each supplied finite configuration, checks safety and temporal properties, and rejects deadlocks. Eighteen weakened variants must fail with specific invariant counterexamples. Five additional unmodified-model checks deliberately disprove overly strong claims about cache freshness, advertisement/contract equality, one-time/one-person application limits and automatic closure; they witness permitted behavior, not defects. No production services, user credentials or secrets are contacted by the models.

This verifies the models, not the TypeScript implementation. The models are separate abstractions, not a mechanically proved composition or refinement. An implementation review must identify the durable commit point corresponding to each action, and verify its database/DO/provider atomicity. Passing tests, this model check and actual provider guarantees are distinct evidence.

## Models and requirements

| Model | Specification mapping | State and safety checks | Progress checked |
|---|---|---|---|
| [ConditionalPayment](ConditionalPayment.tla) | [COLLECT-1–4, HOLD-2–5](../pages/protocol-conditional-payments.md) | Seller authority before capture; buyer deposit, seller acceptance and buyer inspection before release; one immutable decision; new release strictly before the refund deadline; gross refund; committed release may complete after the deadline | Captured money eventually reaches release/refund, including absent notification or acceptance, under the stated clock/provider-conflict assumptions |
| [ProviderRecovery](ProviderRecovery.tla) | [HOLD-5](../pages/protocol-conditional-payments.md), [AGENCY-7](../pages/protocol-collection-agency.md) | Durable intent/alarm before sending; separate remote effect, reply and local recording; lost/reordered messages; restart; no invented confirmation; one provider effect per logical operation; immutable destination despite rebinding | A persisted intent eventually becomes confirmed after recovery and fair retry/processing |
| [CollectionAuthority](CollectionAuthority.tla) | [AGENCY-4–7](../pages/protocol-collection-agency.md) | Active grant, exact scope, connection and remaining budget checked atomically at reservation; withdrawal does not mutate existing snapshots; expiry cannot reopen; capture discharges debt independently of remittance; no second collection | A captured reservation can finish remittance even after withdrawal or connection change |
| [ApprovalExecution](ApprovalExecution.tla) | [WIRE-4–5 and PASSKEY-2](../pages/protocol-wire.md), [Online §2](../pages/protocol-online.md), [LIFE-2](../pages/protocol-lifecycle.md) | Concurrent prechecks do not grant execution authority; commit consumes each approval once and checks current epochs, key status, expiry, exact context/payload and shared passkey counter; committed work is recorded before its abstract effect | Every committed command eventually receives its abstract effect; expiry or revocation does not cancel an already committed command |
| [JobApplications](JobApplications.tla) | [JOB-7](../pages/protocol-marketplace.md) | Two applicants and repeated submissions from one applicant (including reuse of a valid VC); no per-person/request business quota; exact retries commit once and preserve old work state; only requester unpublish closes the listing; distinct work approvals | No hiring/response/delivery promise; time advances and fresh submissions remain admissible while open and within expiry |

Current context binding abstracts signature validity, actor, key role, approved amount/currency, audience/resource/sender, purpose, policy and payload/terms digests. Invalid cases are equivalence classes (`wrongActor`, `wrongAmount`, etc.), not implementations of parsers or crypto. `body = original` means the request under the existing idempotency key exactly matches its prepared/signed payload; `changed` cannot execute. Challenges/keys are distinct per approval, and the two workers can choose the same approval. Zero-to-zero passkey counters are allowed, but the same challenge still commits once. Two distinct approvals with counter 1 compete against a shared current counter, checked and updated at commit.

Public requests add a separate [PublicJobRequests](PublicJobRequests.tla) model mapping [JOB-1–6](../pages/protocol-marketplace.md) and [MONEY-1–3](../pages/protocol-payments.md). It checks vault-before-index ordering, a lightweight-index field allowlist, current JPY-only admission, explicit money units in later work VCs, authoritative application expiry, independent client verification before a subjective trust decision, and explicit agreement before work. Cached hints never create contract authority. Negotiation may change the reward/completion policy and delivery text may differ from the advertisement; agreed monetary terms/policies are frozen at work commitment. No truth, quality, matching, deadline-of-delivery, legal liability or compensation guarantee is asserted.

## Bounds and assumptions

Each `.cfg` is executable and authoritative. There are no state constraints or simulation-only runs that hide later reachable states. Terminal/stuttering actions are explicit; deadlock checking is enabled. Natural-number clocks saturate after crossing all relevant deadlines; they do not wrap around. No symmetry reduction is used for liveness checking.

- **ConditionalPayment:** one transaction, buyer/seller/stranger actors, acceptance tick 2, refund tick 3 and final tick 4. The draft starts after eligibility/connection checks. The current model admits captures before the checkout/acceptance expiry; delayed provider observation is handled separately in ProviderRecovery. One provider conflict can block automatic decisions and later resolve. Weak fairness is assumed for clock advancement, conflict resolution, the deadline alarm and committed completions. No fairness is imposed on buyer/seller cooperation. Release/refund completion is abstract; its exactly-once provider behavior belongs to ProviderRecovery. Refund amount is represented as the fixed gross entitlement, not a provider fee calculation.
- **ProviderRecovery:** one logical capture, release or refund (all three initial choices), two reusable in-flight request slots, one Worker crash and one provider outage. Any number of message losses/retries is possible through cycles; two requests/replies can be processed out of order. Durable state survives restart. Queries/acknowledgements are authentic and scoped to the original operation; the provider honors per-key deduplication throughout this modelled reconciliation interval. Idempotency-key expiry, permanently missing provider records, provider violations and simultaneous independent transactions are outside this model. Weak fairness covers restart, availability recovery, intent persistence, absence queries and successful reconciliation. Strong fairness of sending/processing rules out losing every request forever. Progress under permanent outage or permanent dispute is deliberately not claimed.
- **CollectionAuthority:** two payment IDs compete for one remaining gross-price budget slot (`Gross=5`, `Fee=1`, `Budget=5`, abstract units). Authority may be signed before connection, but every new reservation needs a verified original-seller connection. A destination named in the grant must match at reservation; otherwise the original seller's verified destination is frozen then. A withdrawal/rebind can interleave at any point. `Expire` abstracts a definitively expired *unfunded* reservation, not an uncertain remote capture; it assumes the provider can no longer collect that expired reservation. Release of budget while a capture is still uncertain is not proved safe. Retries of identical IDs return the original result, changed requests conflict, and expired IDs stay closed. Remittance weak fairness assumes transient transfer failures eventually recover. Legacy null-destination collections, dispute/refund accounting and multi-seller allocation are not covered here.
- **ApprovalExecution:** two workers, two approvals, two epoch values, counters 0/1, expiry tick 2 and a saturated clock at 2. The pending immutable payload and signed epoch zero are already prepared. Any worker can check an approval before or after logout/key revocation; authorization is rechecked at the atomic commit. Signatures/contexts and key status are abstract inputs, and command execution is a durable set membership, not a network payment call. The external effect's failure/reconciliation is separately modelled. Weak fairness covers clock advancement and applying committed commands; neither approving nor successfully committing is forced. Claims about actual authenticator signatures, backup flags, token parsing or human understanding remain ordinary verification requirements.

- **PublicJobRequests:** one original/requester/applicant, five request equivalence classes (valid JPY, USD, absent unit, subminimum reward and invalid signature), current supported currencies `{JPY}`, reward minimum 500, expense zero, expiry tick 2 and final tick 3. Strings represent hashes and opaque original bodies; this is not a cryptographic proof. The original vault can return an original, unavailable body or tampered bytes, so a service label is insufficient for client verification. The cache may remain stale indefinitely: there is no fairness promise of refresh/purge. The client's accept/reject choice is independent and does not attest human understanding; server application admission independently rechecks current state/expiry even if the caller skipped verification. A prior application can proceed to separately approved work after expiry/closure. Negotiated rewards 500/600 and public/internal result policies are abstract alternatives. One agreed reward component is modelled per later VC; fee/net accounting and other expense components remain abstract. Monetary progress/completion/collection/instruction/payment-event VCs carry their own code/exponent and must match agreed units. Unknown details/extensions are opaque and cannot change a price or authority. Weak fairness covers clock advancement/indexing; pending publication eventually indexes or ceases to be eligible, not an unconditional publication guarantee. This model retains one representative applicant/economic flow and its latest application time; `Apply` has no already-applied gate. Multiple applicant/submission histories are checked in JobApplications. Request refresh/revision, replicas, clock skew, external status availability, the detailed application VC format and all possible future currencies are outside this bounded model. Future support requires a revised declared capability; no USD/FX route is enabled here.

- **JobApplications:** one request, two fixed authenticated applicants and three scoped submission-intent IDs, two owned by Alice and one by Bob. Both Alice intents reference the **same** still-valid application VC. These are checking universes, not a production capacity or a per-person count limit. The admission predicate depends on current open/expiry state and an unused intent key, never on how many applications/contracts already exist. Atomic submission commits model the authoritative admission/idempotency barrier; interleavings include requester closure and expiry before/after commit. Exact retries are permitted even after closure/expiry as retrieval of the old result, never new admission; changed arguments conflict and cannot reset old negotiation/work state. The requester may ignore received/pending submissions or explicitly unpublish. Negotiation, mutually approved contract formation and delivery are independent per intent, and never close the request. Requester/account moderation/revocation policies, actual signature checking, network receipt delivery and arbitrarily many identities are outside this bounded model. Weak fairness advances the clock; no participant action, response, hiring or delivery is forced. The model does not prove all cardinalities; it checks that the common admission predicate imposes no business-history quota within the supplied finite universe.

These bounds expose the stated races; they do not prove correctness for arbitrarily many participants, failures, transactions or clock representations. Account deletion, DM admission, VC recipient-policy races, vault garbage collection and bilateral export consistency are candidates for future separate models, not implied coverage.

## Run locally or in CI

Use Java 21 (`java` on `PATH`) and Python 3.10+; no pip packages or application dependencies are required:

```sh
cd docs
python3 formal/check.py
# Equivalent package script, if Node/npm are installed:
npm run test:formal
```

The runner downloads the official stable [TLC 1.7.4 release](https://github.com/tlaplus/tlaplus/releases/tag/v1.7.4) into ignored `formal/.cache/`, checks the SHA-256 in [tools.lock.json](tools.lock.json), and uses one worker, fixed fingerprint/seed and a 1 GiB heap. The upstream published SHA-1 is `bee4a54f3ee3d4afc347c3240ec2d9e93b075104`; the checked-in SHA-256 was calculated from that same release asset. Never substitute the mutable rolling 1.8.0 asset under this lock. A supplied JAR is also checked against the lock:

```sh
python3 formal/check.py --jar /path/to/tla2tools.jar --java /path/to/java
```

A check has a 180-second timeout; timeout, parser/type error, wrong exit status, missing completion marker or unexpected counterexample fails the command. Positive checks must exit zero after completed exhaustive exploration. Weakened checks must exit with TLC invariant-violation code 12, name the expected invariant and include an actual behavior trace. A parser failure does not count as detecting a bug. Only successful completion of all 29 checks writes `formal/.cache/reports/results.json`, including source/config/JAR hashes and state counts. Individual logs retain counterexample traces, including on a failing check. Runs use isolated temporary model/state directories; TLC binaries and generated state databases are not committed.

[Standalone docs CI](../.github/workflows/ci.yml) runs the checker on pushes and PRs. It caches only `formal/.cache/tla2tools.jar`, keyed by runner OS and the hash of `formal/tools.lock.json`; restored JARs still pass the runner’s SHA-256 check. Model checking always runs, including on a cache hit. The workflow retains only `formal/.cache/reports/` as a seven-day Actions artifact, including expected counterexamples. The parent application's CI tests the Worker implementation separately. These models do not constrain or check that implementation, so TLC is not a parent deployment prerequisite.

## Counterexample regression checks

| Weakened rule | Required counterexample |
|---|---|
| Remove the release deadline check | `ReleaseBeforeDeadline`: an accepted job releases at/after expiry |
| Remove buyer inspection | `ReleaseAuthorized`: release commits with inspection false |
| Generate retry keys per request slot | `AtMostOneProviderEffect`: two requests for one logical effect produce two distinct provider effects |
| Use the newest connected destination | `FrozenDestination`: an effect uses the rebound destination |
| Admit reservations after withdrawal | `NoReservationAfterWithdrawal`: a withdrawn grant creates a new reservation |
| Remove the remaining-budget check | `BudgetRespected`: both requests reserve the last budget slot |
| Remove atomic approval consumption | `ApprovalAtMostOnce`: two workers commit the same signed approval, including zero counters |
| Remove the current-epoch check | `CurrentEpochAtCommit`: an old signed approval commits after logout-all |
| Admit unsupported job currencies | `JPYOnlyAdmission`: USD or an absent code reaches the vault/index admission path |
| Copy details into the lightweight-index projection | `IndexOnlyProjection`: the row contains a forbidden heavy field |
| Remove fresh application expiry | `ApplicationBeforeExpiry`: a new application commits at/after expiry despite a cached hint |
| Trust the operator label | `ClientVerifiedBeforeTrust`: reliance occurs without verifying the original |
| Omit the work VC currency | `MoneyUnitExplicit`: a later monetary work-flow VC loses its unit |
| Reject a repeat applicant | `NoBusinessApplicationLimit`: Alice's second fresh submission is blocked by history |
| Impose one submission per request | `NoBusinessApplicationLimit`: another fresh submission is blocked after the first |
| Automatically close on application | `OnlyRequesterCloses`: an application hides the listing without requester approval |
| Automatically close on contract | `OnlyRequesterCloses`: hiring hides the listing without requester approval |
| Count same-key retries as submissions | `ExactlyOncePerIntent`: retry commits the same intent more than once |

These are eighteen selected guard-removal checks, not exhaustive mutation coverage. The regular Node/Python schema/signature suites remain separate and required. The request schema/projection semantic tests use unsigned examples and make no new signature-interoperability claim.

The five **permitted-behavior witnesses** keep the unmodified models and ask TLC to refute `CacheAlwaysFresh`, `ContractEqualsAdvertisement`, `AtMostOnePerApplicant`, `AtMostOneApplicant` and `ContractClosesListing`. Their expected counterexamples show a retained cache past expiry, explicitly negotiated reward changes, Alice reapplying with the same VC under a fresh intent, two different applicants, and a contract while the listing remains open. None is a model bug or repaired by the checker. Failing to find these witnesses fails CI, preventing an accidental stronger guarantee.

## Recorded verification

Checked with the locked TLC JAR and Temurin Java 21 on 2026-11-27. All safety and temporal properties passed for the supplied configurations; all eighteen weakened variants produced the required counterexamples.

| Positive model | Generated states | Distinct states |
|---|---:|---:|
| ConditionalPayment | 536 | 223 |
| ProviderRecovery | 9,270 | 1,722 |
| CollectionAuthority | 1,153 | 211 |
| ApprovalExecution | 1,102,465 | 241,708 |
| PublicJobRequests | 1,349,336 | 75,979 |
| JobApplications | 225,467 | 21,274 |

Re-run after changing any model/configuration; these counts describe this finite check, not a bound-independent proof. The authoritative fresh-run results and traces are the CI artifact/ignored local report with source hashes.

The models, configurations and checker code are Apache-2.0 under [the reference-code license](../reference/LICENSE); this README and the underlying specification prose are CC0-1.0 as described in [LICENSING.md](../LICENSING.md). The externally downloaded TLC tool has its own upstream license and is not vendored or relicensed.
