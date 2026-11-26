------------------------------- MODULE DIDHistory -------------------------------
\* SPDX-License-Identifier: Apache-2.0
\* One affected authority scope, two verifiers, finite authenticated artifacts.
\* Cryptographic verification/deterministic signing are assumptions checked by vectors.
EXTENDS Integers, FiniteSets
CONSTANT MaxCommits
Workers == {"a", "b"}
Candidates == {"g0", "retry", "g1a", "g1b", "revoke", "reopen", "invalid", "good", "rogue", "single"}
Roots == {"none", "good", "rogue", "single"}
VARIABLES store, revision, maxSeq, terminalSeen, conflictSeen, genuineSeen,
          pending, seenRevision, plans, crashes, protected
vars == <<store, revision, maxSeq, terminalSeen, conflictSeen, genuineSeen,
          pending, seenRevision, plans, crashes, protected>>
Initial == [seq |-> -1, head |-> "none", revoked |-> FALSE,
            conflict |-> FALSE, root |-> "none", bad |-> FALSE]
Init == /\ store = Initial /\ revision = 0 /\ maxSeq = -1
        /\ terminalSeen = FALSE /\ conflictSeen = FALSE /\ genuineSeen = FALSE
        /\ pending = [w \in Workers |-> "none"]
        /\ seenRevision = [w \in Workers |-> 0]
        /\ plans = [w \in Workers |-> Initial]
        /\ crashes = 0 /\ protected \in BOOLEAN
Seq(c) == CASE c \in {"g0", "retry", "invalid"} -> 0
            [] c \in {"g1a", "g1b"} -> 1
            [] c = "revoke" -> 2 [] OTHER -> 3
Head(c) == IF c = "retry" THEN "g0" ELSE c \* MUTATION: retry identity
Previous(c) == CASE c \in {"g0", "retry", "invalid"} -> "none"
                 [] c \in {"g1a", "g1b"} -> "g0"
                 [] c = "revoke" -> "g1a" [] OTHER -> "revoke"
Plan(c, s) ==
    IF c = "invalid" THEN s \* MUTATION: whole artifact verification
    ELSE IF s.conflict THEN s
    ELSE IF c \in {"good", "rogue", "single"} THEN
        IF c = "single" THEN s \* MUTATION: both root proofs
        ELSE IF protected /\ c = "rogue" THEN s \* MUTATION: committed successor
        ELSE IF s.root = "none" THEN [s EXCEPT !.root = c]
        ELSE IF s.root = c THEN s ELSE [s EXCEPT !.conflict = TRUE]
    ELSE IF s.revoked THEN s \* MUTATION: terminal revocation
    ELSE IF Seq(c) < s.seq THEN s
    ELSE IF Seq(c) = s.seq THEN
        IF Head(c) = s.head THEN s ELSE [s EXCEPT !.conflict = TRUE]
    ELSE IF Seq(c) = s.seq + 1 /\ Previous(c) = s.head THEN
        [s EXCEPT !.seq = Seq(c), !.head = Head(c),
                  !.revoked = (c = "revoke"), !.bad = (c = "invalid")]
    ELSE s
Stage(w,c) == /\ pending[w] = "none"
              /\ pending' = [pending EXCEPT ![w] = c]
              /\ seenRevision' = [seenRevision EXCEPT ![w] = revision]
              /\ plans' = [plans EXCEPT ![w] = Plan(c,store)]
              /\ UNCHANGED <<store,revision,maxSeq,terminalSeen,conflictSeen,genuineSeen,crashes,protected>>
Commit(w) == /\ pending[w] # "none" /\ revision < MaxCommits
             /\ seenRevision[w] = revision \* MUTATION: atomic compare-and-commit
             /\ store' = plans[w]
             /\ revision' = revision + (IF store' = store THEN 0 ELSE 1)
             /\ maxSeq' = IF store'.seq > maxSeq THEN store'.seq ELSE maxSeq
             /\ terminalSeen' = (terminalSeen \/ store'.revoked)
             /\ conflictSeen' = (conflictSeen \/ store'.conflict)
             /\ genuineSeen' = (genuineSeen \/ (store'.conflict /\ pending[w] # "retry"))
             /\ pending' = [pending EXCEPT ![w] = "none"]
             /\ seenRevision' = [seenRevision EXCEPT ![w] = 0]
             /\ plans' = [plans EXCEPT ![w] = Initial]
             /\ UNCHANGED <<crashes,protected>>
Discard(w) == /\ pending[w] # "none"
              /\ pending' = [pending EXCEPT ![w] = "none"]
              /\ seenRevision' = [seenRevision EXCEPT ![w] = 0]
              /\ plans' = [plans EXCEPT ![w] = Initial]
              /\ UNCHANGED <<store,revision,maxSeq,terminalSeen,conflictSeen,genuineSeen,crashes,protected>>
Crash == /\ crashes = 0 /\ crashes' = 1
         /\ pending' = [w \in Workers |-> "none"]
         /\ seenRevision' = [w \in Workers |-> 0]
         /\ plans' = [w \in Workers |-> Initial]
         /\ UNCHANGED <<store,revision,maxSeq,terminalSeen,conflictSeen,genuineSeen,protected>>
Idle == UNCHANGED vars
Next == (\E w \in Workers, c \in Candidates : Stage(w,c))
        \/ (\E w \in Workers : Commit(w) \/ Discard(w)) \/ Crash \/ Idle
Spec == Init /\ [][Next]_vars
TypeOK == /\ store.seq \in -1..3 /\ store.root \in Roots
          /\ revision \in 0..MaxCommits /\ crashes \in 0..1
          /\ pending \in [Workers -> Candidates \cup {"none"}]
NoRollback == store.seq = maxSeq
TerminalRevocation == terminalSeen => store.revoked
ConflictSticky == conflictSeen => store.conflict
WholeArtifactAtomic == ~store.bad
DualRootProofs == store.root # "single"
Precommitment == protected => store.root # "rogue"
NoSpuriousConflict == store.conflict => genuineSeen
=============================================================================
