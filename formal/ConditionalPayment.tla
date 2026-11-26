------------------------ MODULE ConditionalPayment ------------------------
\* SPDX-License-Identifier: Apache-2.0
\* HOLD-1..5: independent negotiation; selected duration, provider capture time,
\* delayed observation, stable deadline and first durable decision.
EXTENDS Naturals, FiniteSets
CONSTANT MaxTime
ASSUME MaxTime = 6
Actors == {"buyer", "seller", "stranger"}
VARIABLES results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, phase, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross
vars == <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, phase, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Roles == {"buyer","seller"}
Policies == [buyer |-> "public",seller |-> "internal"]
JobLists == {<<>>,<<"job1","job2">>,<<"job2","job1">>}
Init == /\ results = {} /\ copies = {}
        /\ resultPolicy = [a \in Roles |-> "none"]
        /\ resultJobs = [a \in Roles |-> <<>>]
        /\ resultBinding = [a \in Roles |-> "none"]
        /\ resultSigned = [a \in Roles |-> FALSE]
        /\ jobIds \in {<<>>,<<"job1","job2">>}
        /\ phase = "draft" /\ now = 0 /\ authorized = FALSE
        /\ captured = FALSE /\ captureAt = 0 /\ observed = FALSE
        /\ fundedAt = 0 /\ refundAt = 0 /\ duration \in {1,2}
        /\ decision = "none" /\ decisions = {} /\ conflict = "clear"
        /\ releaseAt = MaxTime+1 /\ releaseInspection = FALSE
        /\ releaseActor = "none" /\ releasePredecessor = "none" /\ refundGross = FALSE
Authorize(a) ==
    /\ phase = "draft"
    /\ a = "seller"
    /\ phase' = "checkout"
    /\ authorized' = TRUE
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, now, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Capture ==
    /\ phase = "checkout"
    /\ authorized
    /\ now <= MaxTime-2
    /\ captured' = TRUE
    /\ captureAt' = now
    /\ phase' = "captured"
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, now, authorized, observed, fundedAt, refundAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Observe ==
    /\ captured
    /\ ~observed
    /\ observed' = TRUE
    /\ fundedAt' = captureAt
    /\ refundAt' = captureAt + duration \* MUTATION: capture origin
    /\ phase' = "held"
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, now, authorized, captured, captureAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Retry ==
    /\ observed
    /\ refundAt' = refundAt \* MUTATION: immutable deadline
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, phase, now, authorized, captured, captureAt, observed, fundedAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
ArchiveResult(a,policy,ids,binding,signed) ==
    /\ phase = "held" /\ now < refundAt /\ decision = "none"
    /\ a \in Roles \ results
    /\ a = "seller" \/ "seller" \in results
    /\ policy = Policies[a] \* MUTATION: result policy
    /\ ids = jobIds \* MUTATION: result job IDs
    /\ binding = "exact" /\ signed \* MUTATION: result signature
    /\ results' = results \cup {a}
    /\ copies' = copies \cup {<<a,p>> : p \in Roles} \* MUTATION: both recipient copies
    /\ resultPolicy' = [resultPolicy EXCEPT ![a] = policy]
    /\ resultJobs' = [resultJobs EXCEPT ![a] = ids]
    /\ resultBinding' = [resultBinding EXCEPT ![a] = binding]
    /\ resultSigned' = [resultSigned EXCEPT ![a] = signed]
    /\ UNCHANGED <<jobIds,phase,now,authorized,captured,captureAt,observed,fundedAt,refundAt,duration,decision,decisions,conflict,releaseAt,releaseInspection,releaseActor,releasePredecessor,refundGross>>
Release(a, predecessor, inspection) ==
    /\ phase = "held"
    /\ decision = "none"
    /\ conflict # "blocked"
    /\ a = "buyer"
    /\ predecessor = "collection"
    /\ results = Roles \* MUTATION: results before release
    /\ inspection = TRUE \* MUTATION: inspection guard
    /\ now < refundAt \* MUTATION: deadline guard
    /\ decision' = "release"
    /\ decisions' = decisions \cup {"release"}
    /\ phase' = "releasing"
    /\ releaseAt' = now
    /\ releaseInspection' = inspection
    /\ releaseActor' = a
    /\ releasePredecessor' = predecessor
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, conflict, refundGross>>
Refund(a) ==
    /\ phase = "held"
    /\ decision = "none"
    /\ conflict # "blocked"
    /\ a = "seller" \/ (a = "alarm" /\ now >= refundAt)
    /\ decision' = "refund"
    /\ decisions' = decisions \cup {"refund"}
    /\ phase' = "refunding"
    /\ refundGross' = TRUE
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor>>
CompleteRelease ==
    /\ phase = "releasing"
    /\ conflict # "blocked"
    /\ phase' = "released"
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
CompleteRefund ==
    /\ phase = "refunding"
    /\ conflict # "blocked"
    /\ phase' = "refunded"
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Block ==
    /\ captured
    /\ conflict = "clear"
    /\ conflict' = "blocked"
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, phase, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Resolve ==
    /\ conflict = "blocked"
    /\ conflict' = "resolved"
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, phase, now, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Tick ==
    /\ now < MaxTime
    /\ now' = now+1
    /\ UNCHANGED <<results, copies, resultPolicy, resultJobs, resultBinding, resultSigned, jobIds, phase, authorized, captured, captureAt, observed, fundedAt, refundAt, duration, decision, decisions, conflict, releaseAt, releaseInspection, releaseActor, releasePredecessor, refundGross>>
Idle == UNCHANGED vars
Next == \/ \E a \in Actors : Authorize(a)
        \/ Capture \/ Observe \/ Retry
        \/ \E a \in Roles,p \in {"public","internal"},ids \in JobLists,b \in {"exact","wrong"},sig \in BOOLEAN : ArchiveResult(a,p,ids,b,sig)
        \/ \E a \in Actors, p \in {"collection", "wrong"}, i \in BOOLEAN : Release(a,p,i)
        \/ \E a \in Actors \cup {"alarm"} : Refund(a)
        \/ CompleteRelease \/ CompleteRefund \/ Block \/ Resolve \/ Tick \/ Idle
Spec == Init /\ [][Next]_vars /\ WF_vars(Tick) /\ WF_vars(Observe)
        /\ WF_vars(Resolve) /\ WF_vars(Refund("alarm"))
        /\ WF_vars(CompleteRelease) /\ WF_vars(CompleteRefund)
TypeOK == /\ phase \in {"draft","checkout","captured","held","releasing","refunding","released","refunded"}
          /\ now \in 0..MaxTime /\ duration \in {1,2}
          /\ authorized \in BOOLEAN /\ captured \in BOOLEAN /\ observed \in BOOLEAN
          /\ captureAt \in 0..MaxTime /\ fundedAt \in 0..MaxTime /\ refundAt \in 0..(MaxTime+2)
          /\ decision \in {"none","release","refund"} /\ decisions \subseteq {"release","refund"}
          /\ conflict \in {"clear","blocked","resolved"}
ResultsBeforeRelease == decision = "release" => results = Roles
ResultBindingsPinned == \A a \in results : resultPolicy[a]=Policies[a] /\ resultJobs[a]=jobIds /\ resultBinding[a]="exact" /\ resultSigned[a]
ResultDeliveryAtomic == \A a \in results,p \in Roles : <<a,p>> \in copies
OneDecision == Cardinality(decisions) <= 1
CollectionAuthorized == captured => authorized
CaptureBasedDeadline == observed => (fundedAt = captureAt /\ refundAt = captureAt + duration)
ReleaseAuthorized == decision = "release" =>
    (captured /\ observed /\ releaseInspection /\ releaseActor = "buyer" /\ releasePredecessor = "collection")
ReleaseBeforeDeadline == decision = "release" => releaseAt < refundAt
RefundIsGross == decision = "refund" => (captured /\ refundGross)
CompletionMatchesDecision == /\ (phase = "released" => decision = "release")
                             /\ (phase = "refunded" => decision = "refund")
DecisionStable == [][decision # "none" => decision' = decision]_vars
FundedTerminates == captured ~> (phase \in {"released","refunded"})
=============================================================================
