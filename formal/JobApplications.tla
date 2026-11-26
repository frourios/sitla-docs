-------------------------- MODULE JobApplications --------------------------
\* SPDX-License-Identifier: Apache-2.0
\* JOB-7. Intent IDs are scoped submission/idempotency keys, NOT VC IDs.
\* Alice reuses one still-valid application VC for two intentional submissions.
\* The finite ID universe is a checking bound, never a service application cap.
EXTENDS Naturals, FiniteSets
CONSTANTS ExpiresAt, MaxTime
ASSUME /\ ExpiresAt > 0 /\ ExpiresAt < MaxTime
Applicants == {"alice", "bob"}
Intents == {"alice-1", "alice-2", "bob-1"}
Owner(i) == IF i \in {"alice-1", "alice-2"} THEN "alice" ELSE "bob"
Credential(i) == IF Owner(i) = "alice" THEN "alice-vc" ELSE "bob-vc"
VARIABLES now, closed, closeAuthority, submissions, commits, committedAt,
          submittedBy, sourceCredential, stage, approvals, technicalGate, permitted
vars == <<now, closed, closeAuthority, submissions, commits, committedAt,
          submittedBy, sourceCredential, stage, approvals, technicalGate, permitted>>
Init == /\ now = 0 /\ closed = FALSE /\ closeAuthority = "none"
        /\ submissions = {} /\ commits = [i \in Intents |-> 0]
        /\ committedAt = [i \in Intents |-> MaxTime + 1]
        /\ submittedBy = [i \in Intents |-> "none"]
        /\ sourceCredential = [i \in Intents |-> "none"]
        /\ stage = [i \in Intents |-> "none"] /\ approvals = {} /\ technicalGate = TRUE /\ permitted = {}
Open == ~closed /\ now < ExpiresAt
MayAdmit(i) ==
    /\ Open /\ technicalGate /\ i \notin submissions
    /\ TRUE \* MUTATION: no per-applicant quota
    /\ TRUE \* MUTATION: no request capacity
Submit(i, actor, body) ==
    LET fresh == i \notin submissions IN
    /\ actor = Owner(i) /\ body = "exact"
    /\ (i \in submissions \/ MayAdmit(i))
    /\ submissions' = submissions \cup {i}
    /\ commits' = [commits EXCEPT ![i] = @ + (IF fresh THEN 1 ELSE 0)] \* MUTATION: retry deduplication
    /\ committedAt' = [committedAt EXCEPT ![i] = IF fresh THEN now ELSE @]
    /\ submittedBy' = [submittedBy EXCEPT ![i] = IF fresh THEN actor ELSE @]
    /\ sourceCredential' = [sourceCredential EXCEPT ![i] = IF fresh THEN Credential(i) ELSE @]
    /\ stage' = [stage EXCEPT ![i] = IF fresh THEN "received" ELSE @]
    /\ permitted' = IF fresh /\ technicalGate THEN permitted \cup {i} ELSE permitted
    /\ closed' = closed \* MUTATION: submit must not close
    /\ UNCHANGED <<now, closeAuthority, approvals, technicalGate>>
Conflict(i, actor) ==
    /\ i \in submissions /\ actor = Owner(i)
    \* A changed body under the existing scoped key is rejected, not a new row.
    /\ UNCHANGED vars
Unpublish(actor) ==
    /\ actor = "requester" /\ ~closed
    /\ closed' = TRUE /\ closeAuthority' = "requester"
    /\ UNCHANGED <<now, submissions, commits, committedAt, submittedBy,
                   sourceCredential, stage, approvals, technicalGate, permitted>>
Negotiate(i) ==
    /\ i \in submissions /\ stage[i] = "received"
    /\ stage' = [stage EXCEPT ![i] = "negotiating"]
    /\ UNCHANGED <<now, closed, closeAuthority, submissions, commits,
                   committedAt, submittedBy, sourceCredential, approvals, technicalGate, permitted>>
ApproveWork(i) ==
    /\ stage[i] = "negotiating" /\ i \notin approvals
    \* Abstract fresh, mutually bound approval for THIS work/submission.
    /\ approvals' = approvals \cup {i}
    /\ UNCHANGED <<now, closed, closeAuthority, submissions, commits,
                   committedAt, submittedBy, sourceCredential, stage, technicalGate, permitted>>
Contract(i) ==
    /\ stage[i] = "negotiating" /\ i \in approvals
    /\ stage' = [stage EXCEPT ![i] = "contracted"]
    /\ closed' = closed \* MUTATION: contract must not close
    /\ UNCHANGED <<now, closeAuthority, submissions, commits,
                   committedAt, submittedBy, sourceCredential, approvals, technicalGate, permitted>>
Deliver(i) ==
    /\ stage[i] = "contracted"
    /\ stage' = [stage EXCEPT ![i] = "delivered"]
    /\ UNCHANGED <<now, closed, closeAuthority, submissions, commits,
                   committedAt, submittedBy, sourceCredential, approvals, technicalGate, permitted>>
Ignore(i) ==
    /\ stage[i] \in {"received", "negotiating"}
    /\ stage' = [stage EXCEPT ![i] = "ignored"]
    /\ UNCHANGED <<now, closed, closeAuthority, submissions, commits,
                   committedAt, submittedBy, sourceCredential, approvals, technicalGate, permitted>>
Tick == /\ now < MaxTime /\ now' = now + 1
        /\ UNCHANGED <<closed, closeAuthority, submissions, commits, committedAt,
                       submittedBy, sourceCredential, stage, approvals, technicalGate, permitted>>
Throttle == /\ technicalGate' = ~technicalGate
            /\ UNCHANGED <<now, closed, closeAuthority, submissions, commits, committedAt, submittedBy, sourceCredential, stage, approvals, permitted>>
Idle == UNCHANGED vars
Next == \/ \E i \in Intents, a \in Applicants \cup {"stranger"}, b \in {"exact", "changed"} : Submit(i, a, b)
        \/ \E i \in Intents, a \in Applicants : Conflict(i, a)
        \/ \E a \in Applicants \cup {"requester", "stranger"} : Unpublish(a)
        \/ \E i \in Intents : Negotiate(i) \/ ApproveWork(i) \/ Contract(i) \/ Deliver(i) \/ Ignore(i)
        \/ Tick \/ Throttle \/ Idle
Spec == Init /\ [][Next]_vars /\ WF_vars(Tick)
TypeOK == /\ now \in 0..MaxTime /\ closed \in BOOLEAN
          /\ closeAuthority \in {"none", "requester"}
          /\ submissions \subseteq Intents /\ commits \in [Intents -> 0..2]
          /\ committedAt \in [Intents -> 0..(MaxTime + 1)]
          /\ submittedBy \in [Intents -> Applicants \cup {"none"}]
          /\ sourceCredential \in [Intents -> {"none", "alice-vc", "bob-vc"}]
          /\ stage \in [Intents -> {"none", "received", "negotiating", "contracted", "delivered", "ignored"}]
          /\ approvals \subseteq submissions
          /\ technicalGate \in BOOLEAN /\ permitted \subseteq submissions
OnlyRequesterCloses == closed => closeAuthority = "requester"
ExactlyOncePerIntent == \A i \in Intents : commits[i] = IF i \in submissions THEN 1 ELSE 0
BeforeApplicationExpiry == \A i \in submissions : committedAt[i] < ExpiresAt
CorrectApplicantAndCredential == \A i \in submissions :
    (submittedBy[i] = Owner(i) /\ sourceCredential[i] = Credential(i))
NoBusinessApplicationLimit == Open /\ technicalGate => (\A i \in Intents \ submissions : ENABLED Submit(i, Owner(i), "exact"))
TechnicalAdmissionRespected == submissions \subseteq permitted
PerWorkApproval == \A i \in Intents : stage[i] \in {"contracted", "delivered"} => i \in approvals
CommittedMetadataStable == [][\A i \in submissions :
    (committedAt'[i] = committedAt[i] /\ submittedBy'[i] = submittedBy[i] /\
     sourceCredential'[i] = sourceCredential[i])]_vars
SubmissionsNeverLost == [][submissions \subseteq submissions']_vars
\* Deliberately FALSE quota/auto-close claims: witnesses of allowed behaviors.
AtMostOnePerApplicant == \A a \in Applicants : Cardinality({i \in submissions : Owner(i) = a}) <= 1
AtMostOneApplicant == Cardinality({Owner(i) : i \in submissions}) <= 1
ContractClosesListing == (\E i \in Intents : stage[i] \in {"contracted", "delivered"}) => closed
=============================================================================
