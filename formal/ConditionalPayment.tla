------------------------ MODULE ConditionalPayment ------------------------
\* SPDX-License-Identifier: Apache-2.0
\* HOLD-2..5, COLLECT-1..4. One transaction; provider effects abstracted as
\* completion actions. ProviderRecovery separately checks uncertain effects.
EXTENDS Naturals, FiniteSets
CONSTANTS AcceptBy, RefundAt, MaxTime
ASSUME /\ AcceptBy > 0 /\ AcceptBy < RefundAt /\ RefundAt <= MaxTime
VARIABLES phase, now, authorized, captured, notified, accepted, decision,
          decisions, conflict, releaseAt, releaseInspection, releaseActor,
          releasePredecessor, refundGross
vars == <<phase, now, authorized, captured, notified, accepted, decision,
          decisions, conflict, releaseAt, releaseInspection, releaseActor,
          releasePredecessor, refundGross>>
Actors == {"buyer", "seller", "stranger"}
Init == /\ phase = "draft" /\ now = 0 /\ authorized = FALSE /\ captured = FALSE
        /\ notified = FALSE /\ accepted = FALSE /\ decision = "none" /\ decisions = {}
        /\ conflict = "clear" /\ releaseAt = MaxTime + 1
        /\ releaseInspection = FALSE /\ releaseActor = "none"
        /\ releasePredecessor = "none" /\ refundGross = FALSE
Authorize(a) ==
    /\ phase = "draft" /\ a = "seller" /\ now < AcceptBy
    /\ phase' = "checkout" /\ authorized' = TRUE
    /\ UNCHANGED <<now, captured, notified, accepted, decision, decisions,
                   conflict, releaseAt, releaseInspection, releaseActor,
                   releasePredecessor, refundGross>>
Capture ==
    /\ phase = "checkout" /\ authorized /\ now < AcceptBy
    /\ phase' = "deposit" /\ captured' = TRUE
    /\ UNCHANGED <<now, authorized, notified, accepted, decision, decisions,
                   conflict, releaseAt, releaseInspection, releaseActor,
                   releasePredecessor, refundGross>>
Notify(a, binding) ==
    /\ phase = "deposit" /\ a = "buyer" /\ binding = "exact"
    /\ now < AcceptBy
    /\ phase' = "acceptance" /\ notified' = TRUE
    /\ UNCHANGED <<now, authorized, captured, accepted, decision, decisions,
                   conflict, releaseAt, releaseInspection, releaseActor,
                   releasePredecessor, refundGross>>
Accept(a, predecessor) ==
    /\ phase = "acceptance" /\ a = "seller" /\ predecessor = "deposit"
    /\ now < AcceptBy
    /\ phase' = "held" /\ accepted' = TRUE
    /\ UNCHANGED <<now, authorized, captured, notified, decision, decisions,
                   conflict, releaseAt, releaseInspection, releaseActor,
                   releasePredecessor, refundGross>>
Release(a, predecessor, inspection) ==
    /\ phase = "held" /\ decision = "none" /\ conflict # "blocked"
    /\ a = "buyer" /\ predecessor = "acceptance"
    /\ inspection = TRUE \* MUTATION: inspection guard
    /\ now < RefundAt \* MUTATION: deadline guard
    /\ phase' = "releasing" /\ decision' = "release"
    /\ decisions' = decisions \cup {"release"}
    /\ releaseAt' = now /\ releaseInspection' = inspection
    /\ releaseActor' = a /\ releasePredecessor' = predecessor
    /\ UNCHANGED <<now, authorized, captured, notified, accepted, conflict,
                   refundGross>>
Refund(a) ==
    /\ captured /\ decision = "none" /\ conflict # "blocked"
    /\ phase \in {"deposit", "acceptance", "held"}
    /\ (a = "seller" \/ (a = "alarm" /\
             (now >= RefundAt \/ (~accepted /\ now >= AcceptBy))))
    /\ phase' = "refunding" /\ decision' = "refund"
    /\ decisions' = decisions \cup {"refund"} /\ refundGross' = TRUE
    /\ UNCHANGED <<now, authorized, captured, notified, accepted, conflict,
                   releaseAt, releaseInspection, releaseActor, releasePredecessor>>
CompleteRelease ==
    /\ phase = "releasing" /\ conflict # "blocked"
    /\ phase' = "released"
    /\ UNCHANGED <<now, authorized, captured, notified, accepted, decision,
                   decisions, conflict, releaseAt, releaseInspection,
                   releaseActor, releasePredecessor, refundGross>>
CompleteRefund ==
    /\ phase = "refunding" /\ conflict # "blocked"
    /\ phase' = "refunded"
    /\ UNCHANGED <<now, authorized, captured, notified, accepted, decision,
                   decisions, conflict, releaseAt, releaseInspection,
                   releaseActor, releasePredecessor, refundGross>>
ExpireUnfunded ==
    /\ ~captured /\ phase \in {"draft", "checkout"} /\ now >= AcceptBy
    /\ phase' = "expired"
    /\ UNCHANGED <<now, authorized, captured, notified, accepted, decision,
                   decisions, conflict, releaseAt, releaseInspection,
                   releaseActor, releasePredecessor, refundGross>>
Block ==
    /\ conflict = "clear" /\ captured
    /\ conflict' = "blocked"
    /\ UNCHANGED <<phase, now, authorized, captured, notified, accepted,
                   decision, decisions, releaseAt, releaseInspection,
                   releaseActor, releasePredecessor, refundGross>>
Resolve ==
    /\ conflict = "blocked" /\ conflict' = "resolved"
    /\ UNCHANGED <<phase, now, authorized, captured, notified, accepted,
                   decision, decisions, releaseAt, releaseInspection,
                   releaseActor, releasePredecessor, refundGross>>
Tick == /\ now < MaxTime /\ now' = now + 1
        /\ UNCHANGED <<phase, authorized, captured, notified, accepted,
                       decision, decisions, conflict, releaseAt,
                       releaseInspection, releaseActor, releasePredecessor, refundGross>>
Terminal == /\ phase \in {"released", "refunded", "expired"}
            /\ UNCHANGED vars
Next == \/ \E a \in Actors : Authorize(a)
        \/ Capture
        \/ \E a \in Actors, b \in {"exact", "wrong"} : Notify(a, b)
        \/ \E a \in Actors, p \in {"deposit", "wrong"} : Accept(a, p)
        \/ \E a \in Actors, p \in {"acceptance", "wrong"}, i \in BOOLEAN : Release(a, p, i)
        \/ \E a \in Actors \cup {"alarm"} : Refund(a)
        \/ CompleteRelease \/ CompleteRefund \/ ExpireUnfunded
        \/ Block \/ Resolve \/ Tick \/ Terminal
Spec == Init /\ [][Next]_vars /\ WF_vars(Tick) /\ WF_vars(Resolve)
        /\ WF_vars(Refund("alarm")) /\ WF_vars(CompleteRelease)
        /\ WF_vars(CompleteRefund) /\ WF_vars(ExpireUnfunded)
TypeOK == /\ phase \in {"draft", "checkout", "deposit", "acceptance", "held",
                        "releasing", "refunding", "released", "refunded", "expired"}
          /\ now \in 0..MaxTime /\ decision \in {"none", "release", "refund"}
          /\ decisions \subseteq {"release", "refund"}
          /\ conflict \in {"clear", "blocked", "resolved"}
          /\ authorized \in BOOLEAN /\ captured \in BOOLEAN
          /\ notified \in BOOLEAN /\ accepted \in BOOLEAN
          /\ releaseAt \in 0..(MaxTime + 1)
          /\ releaseInspection \in BOOLEAN /\ refundGross \in BOOLEAN
          /\ releaseActor \in Actors \cup {"none"}
          /\ releasePredecessor \in {"none", "acceptance", "wrong"}
OneDecision == Cardinality(decisions) <= 1
CollectionAuthorized == captured => authorized
ReleaseAuthorized == decision = "release" =>
    (accepted /\ notified /\ captured /\ releaseInspection /\
     releaseActor = "buyer" /\ releasePredecessor = "acceptance")
ReleaseBeforeDeadline == decision = "release" => releaseAt < RefundAt
RefundIsGross == decision = "refund" => (captured /\ refundGross)
CompletionMatchesDecision == /\ (phase = "released" => decision = "release")
                             /\ (phase = "refunded" => decision = "refund")
DecisionStable == [][decision # "none" => decision' = decision]_vars
FundedTerminates == captured ~> (phase \in {"released", "refunded"})
=============================================================================
