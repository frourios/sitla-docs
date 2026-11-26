------------------------ MODULE MarketplaceDM ------------------------
\* SPDX-License-Identifier: Apache-2.0
\* Publication and enabling DM are one commit. DM remains independent of a
\* request's validity, negotiation, hiring and payment. No application state.
EXTENDS Naturals, FiniteSets
Kinds == {"seller","request"}
Intents == {"a1","a2","b1"}
Owner(i) == IF i = "b1" THEN "bob" ELSE "alice"
VARIABLES listings, everPublished, removed, dm, email, expired, technicalGate, blocked, messages, admittedGate
vars == <<listings, everPublished, removed, dm, email, expired, technicalGate, blocked, messages, admittedGate>>
Effective == ("seller" \in listings) \/ ("request" \in listings /\ ~expired)
Init == /\ listings = {} /\ everPublished = {} /\ removed = {}
        /\ dm = FALSE /\ email \in BOOLEAN /\ expired = FALSE
        /\ technicalGate \in BOOLEAN /\ blocked = {} /\ messages = {}
        /\ admittedGate = [i \in Intents |-> FALSE]
Publish(k) ==
    /\ k \in Kinds
    /\ k # "request" \/ ~expired
    /\ listings' = listings \cup {k}
    /\ everPublished' = everPublished \cup {k}
    /\ removed' = removed \ {k}
    /\ dm' = TRUE \* MUTATION: publication enables reception
    /\ UNCHANGED <<email, expired, technicalGate, blocked, messages, admittedGate>>
Unpublish(k) ==
    /\ k \in listings
    /\ listings' = listings \ {k}
    /\ removed' = removed \cup {k}
    /\ UNCHANGED <<everPublished, dm, email, expired, technicalGate, blocked, messages, admittedGate>>
Disable ==
    /\ ~Effective \* MUTATION: published reception guard
    /\ dm' = FALSE
    /\ UNCHANGED <<listings, everPublished, removed, email, expired, technicalGate, blocked, messages, admittedGate>>
Enable ==
    /\ TRUE
    /\ dm' = TRUE
    /\ UNCHANGED <<listings, everPublished, removed, email, expired, technicalGate, blocked, messages, admittedGate>>
Contact(i) ==
    /\ i \in Intents \ messages
    /\ dm
    /\ technicalGate \* MUTATION: technical gate
    /\ Owner(i) \notin blocked
    /\ messages' = messages \cup {i}
    /\ admittedGate' = [admittedGate EXCEPT ![i] = technicalGate]
    /\ listings' = listings \* MUTATION: contact keeps listing
    /\ UNCHANGED <<everPublished, removed, dm, email, expired, technicalGate, blocked>>
Expire ==
    /\ ~expired
    /\ expired' = TRUE
    /\ UNCHANGED <<listings, everPublished, removed, dm, email, technicalGate, blocked, messages, admittedGate>>
Gate ==
    /\ TRUE
    /\ technicalGate' \in BOOLEAN
    /\ UNCHANGED <<listings, everPublished, removed, dm, email, expired, blocked, messages, admittedGate>>
Block(a) ==
    /\ a \in {"alice","bob"}
    /\ blocked' = blocked \cup {a}
    /\ UNCHANGED <<listings, everPublished, removed, dm, email, expired, technicalGate, messages, admittedGate>>
Idle == UNCHANGED vars
Next == \/ \E k \in Kinds : Publish(k) \/ Unpublish(k)
        \/ Disable \/ Enable \/ Expire \/ Gate
        \/ \E i \in Intents : Contact(i)
        \/ \E a \in {"alice","bob"} : Block(a)
        \/ Idle
Spec == Init /\ [][Next]_vars
TypeOK == /\ listings \subseteq Kinds /\ everPublished \subseteq Kinds /\ removed \subseteq Kinds
          /\ dm \in BOOLEAN /\ email \in BOOLEAN /\ expired \in BOOLEAN
          /\ technicalGate \in BOOLEAN /\ blocked \subseteq {"alice","bob"}
          /\ messages \subseteq Intents /\ admittedGate \in [Intents -> BOOLEAN]
PublishedRequiresDM == Effective => dm
OnlyOwnerUnpublishes == everPublished \ removed = listings
TechnicalAdmissionRespected == \A i \in messages : admittedGate[i]
NoBusinessContactLimit == \A i \in Intents \ messages :
    (dm /\ technicalGate /\ Owner(i) \notin blocked) => ENABLED Contact(i)
EmailPreferenceStable == [][email' = email]_vars
\* Deliberately false witnesses: repeat contacts and contact after expiry are allowed.
AtMostOnePerSender == \A a \in {"alice","bob"} : Cardinality({i \in messages : Owner(i)=a}) <= 1
ContactClosesListing == messages # {} => listings = {}
=============================================================================
