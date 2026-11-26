------------------------- MODULE ApprovalExecution -------------------------
\* SPDX-License-Identifier: Apache-2.0
\* WIRE-4..5 / PASSKEY-2 / LIFE-2. Two workers may verify the same challenge
\* before either commits; only commit atomically consumes it and checks epochs.
EXTENDS Naturals, FiniteSets
CONSTANTS Workers, Approvals, ExpiresAt, MaxTime
ASSUME /\ IsFiniteSet(Workers) /\ Cardinality(Workers) = 2
       /\ IsFiniteSet(Approvals) /\ Cardinality(Approvals) = 2
       /\ ExpiresAt > 0 /\ ExpiresAt <= MaxTime
VARIABLES now, epoch, grantValid, phase, chosen, context, body, seenEpoch,
          counterAfter, counter, consumed, commits, executed, audit
vars == <<now, epoch, grantValid, phase, chosen, context, body, seenEpoch,
          counterAfter, counter, consumed, commits, executed, audit>>
Contexts == {"bound", "wrongActor", "wrongSignature", "wrongAmount",
             "wrongAudience", "wrongPurpose", "wrongKeyRole", "wrongPolicy"}
Init == /\ now = 0 /\ epoch = 0 /\ grantValid = TRUE
        /\ phase = [w \in Workers |-> "idle"]
        /\ chosen = [w \in Workers |-> CHOOSE a \in Approvals : TRUE]
        /\ context = [w \in Workers |-> "bound"]
        /\ body = [w \in Workers |-> "original"]
        /\ seenEpoch = [w \in Workers |-> 0]
        /\ counterAfter = [w \in Workers |-> 0]
        /\ counter = 0 /\ consumed = {} /\ commits = [a \in Approvals |-> 0]
        /\ executed = {} /\ audit = {}
Check(w, a, c, b, n) ==
    /\ phase[w] = "idle"
    /\ phase' = [phase EXCEPT ![w] = "checked"]
    /\ chosen' = [chosen EXCEPT ![w] = a]
    /\ context' = [context EXCEPT ![w] = c]
    /\ body' = [body EXCEPT ![w] = b]
    \* Both approvals were prepared/signed under epoch zero and digest original.
    /\ seenEpoch' = [seenEpoch EXCEPT ![w] = 0]
    /\ counterAfter' = [counterAfter EXCEPT ![w] = n]
    /\ UNCHANGED <<now, epoch, grantValid, counter, consumed, commits, executed, audit>>
CounterOK(w) == (counter = 0 /\ counterAfter[w] = 0) \/ counterAfter[w] > counter
Commit(w) ==
    LET a == chosen[w] IN
    /\ phase[w] = "checked"
    /\ context[w] = "bound" /\ body[w] = "original"
    /\ seenEpoch[w] = epoch \* MUTATION: epoch barrier
    /\ grantValid /\ now < ExpiresAt /\ CounterOK(w)
    /\ a \notin consumed \* MUTATION: atomic consumption
    /\ consumed' = consumed \cup {a}
    /\ commits' = [commits EXCEPT ![a] = @ + 1]
    /\ counter' = counterAfter[w]
    /\ phase' = [phase EXCEPT ![w] = "committed"]
    /\ audit' = audit \cup {
        [approval |-> a, context |-> context[w], body |-> body[w],
         epoch |-> epoch, signedEpoch |-> seenEpoch[w], time |-> now,
         counterBefore |-> counter, counterAfter |-> counterAfter[w]]}
    /\ UNCHANGED <<now, epoch, grantValid, chosen, context, body, seenEpoch,
                   counterAfter, executed>>
\* Invalid/expired/stale attempts and retries may return rejection or the
\* already-recorded result; neither creates a new commitment.
Reject(w) ==
    /\ phase[w] = "checked" /\ phase' = [phase EXCEPT ![w] = "rejected"]
    /\ UNCHANGED <<now, epoch, grantValid, chosen, context, body, seenEpoch,
                   counterAfter, counter, consumed, commits, executed, audit>>
Apply(a) ==
    /\ a \in consumed /\ a \notin executed /\ executed' = executed \cup {a}
    /\ UNCHANGED <<now, epoch, grantValid, phase, chosen, context, body,
                   seenEpoch, counterAfter, counter, consumed, commits, audit>>
ApplyAny == \E a \in Approvals : Apply(a)
LogoutAll ==
    /\ epoch = 0 /\ epoch' = 1
    /\ UNCHANGED <<now, grantValid, phase, chosen, context, body, seenEpoch,
                   counterAfter, counter, consumed, commits, executed, audit>>
RevokeKey ==
    /\ grantValid /\ grantValid' = FALSE
    /\ UNCHANGED <<now, epoch, phase, chosen, context, body, seenEpoch,
                   counterAfter, counter, consumed, commits, executed, audit>>
Tick == /\ now < MaxTime /\ now' = now + 1
        /\ UNCHANGED <<epoch, grantValid, phase, chosen, context, body, seenEpoch,
                       counterAfter, counter, consumed, commits, executed, audit>>
Idle == UNCHANGED vars
Next == \/ \E w \in Workers, a \in Approvals, c \in Contexts,
              b \in {"original", "changed"}, n \in 0..1 : Check(w, a, c, b, n)
        \/ \E w \in Workers : Commit(w) \/ Reject(w)
        \/ ApplyAny \/ LogoutAll \/ RevokeKey \/ Tick \/ Idle
Spec == Init /\ [][Next]_vars /\ WF_vars(Tick) /\ WF_vars(ApplyAny)
TypeOK == /\ now \in 0..MaxTime /\ epoch \in 0..1 /\ grantValid \in BOOLEAN
          /\ phase \in [Workers -> {"idle", "checked", "committed", "rejected"}]
          /\ chosen \in [Workers -> Approvals] /\ context \in [Workers -> Contexts]
          /\ body \in [Workers -> {"original", "changed"}]
          /\ seenEpoch \in [Workers -> 0..1] /\ counterAfter \in [Workers -> 0..1]
          /\ counter \in 0..1 /\ consumed \subseteq Approvals
          /\ commits \in [Approvals -> 0..2] /\ executed \subseteq Approvals
          /\ audit \subseteq [approval : Approvals, context : Contexts,
                 body : {"original", "changed"}, epoch : 0..1, signedEpoch : 0..1,
                 time : 0..MaxTime, counterBefore : 0..1, counterAfter : 0..1]
ApprovalAtMostOnce == \A a \in Approvals : commits[a] <= 1
OnlyConsumedExecutes == executed \subseteq consumed
ExactBinding == \A e \in audit : e.context = "bound" /\ e.body = "original"
CurrentEpochAtCommit == \A e \in audit : e.epoch = e.signedEpoch
BeforeExpiry == \A e \in audit : e.time < ExpiresAt
CounterSerialized == \A e \in audit :
    (e.counterBefore = 0 /\ e.counterAfter = 0) \/ e.counterAfter > e.counterBefore
CommittedEventuallyApplied == \A a \in Approvals : (a \in consumed) ~> (a \in executed)
=============================================================================
