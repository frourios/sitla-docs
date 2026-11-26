------------------------- MODULE ProviderRecovery -------------------------
\* SPDX-License-Identifier: Apache-2.0
\* HOLD-5 / AGENCY-7. Provider success, response, local recording and restart
\* are separate actions. The provider implements durable per-key deduplication.
EXTENDS Naturals, FiniteSets
VARIABLES kind, online, available, crashLeft, outageLeft, intent, alarm,
          confirmed, requests, replies, requestKey, requestDest, applied,
          destinations, currentDestination, checkedAbsent
vars == <<kind, online, available, crashLeft, outageLeft, intent, alarm,
          confirmed, requests, replies, requestKey, requestDest, applied,
          destinations, currentDestination, checkedAbsent>>
Slots == {1, 2}
Keys == {"stable", "fresh1", "fresh2"}
FreshKey(s) == IF s = 1 THEN "fresh1" ELSE "fresh2"
Init == /\ kind \in {"capture", "release", "refund"}
        /\ online = TRUE /\ available = TRUE /\ crashLeft = 1 /\ outageLeft = 1
        /\ intent = FALSE /\ alarm = FALSE /\ confirmed = FALSE /\ requests = {} /\ replies = {}
        /\ requestKey = [s \in Slots |-> "stable"]
        /\ requestDest = [s \in Slots |-> "original"]
        /\ applied = {} /\ destinations = {} /\ currentDestination = "original"
        /\ checkedAbsent = FALSE
PersistIntent ==
    /\ online /\ ~intent /\ intent' = TRUE /\ alarm' = TRUE
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, confirmed,
                   requests, replies, requestKey, requestDest, applied,
                   destinations, currentDestination, checkedAbsent>>
QueryAbsent ==
    /\ online /\ available /\ intent /\ ~confirmed /\ applied = {}
    /\ checkedAbsent' = TRUE
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   alarm, confirmed, requests, replies, requestKey, requestDest,
                   applied, destinations, currentDestination>>
Send(s) ==
    /\ online /\ available /\ intent /\ alarm /\ ~confirmed /\ checkedAbsent
    /\ s \notin requests /\ s \notin replies
    /\ requests' = requests \cup {s}
    /\ requestKey' = [requestKey EXCEPT ![s] = "stable"] \* MUTATION: stable key
    /\ requestDest' = [requestDest EXCEPT ![s] = "original"] \* MUTATION: frozen destination
    /\ checkedAbsent' = FALSE
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   alarm, confirmed, replies, applied, destinations, currentDestination>>
SendAny == \E s \in Slots : Send(s)
ProviderApply(s) ==
    /\ available /\ s \in requests
    /\ applied' = applied \cup {requestKey[s]}
    /\ destinations' = IF requestKey[s] \notin applied
                        THEN destinations \cup {requestDest[s]} ELSE destinations
    /\ requests' = requests \ {s} /\ replies' = replies \cup {s}
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   alarm, confirmed, requestKey, requestDest, currentDestination,
                   checkedAbsent>>
ApplyAny == \E s \in Slots : ProviderApply(s)
DropRequest(s) ==
    /\ s \in requests /\ requests' = requests \ {s}
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   alarm, confirmed, replies, requestKey, requestDest, applied,
                   destinations, currentDestination, checkedAbsent>>
DropReply(s) ==
    /\ s \in replies /\ replies' = replies \ {s}
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   alarm, confirmed, requests, requestKey, requestDest, applied,
                   destinations, currentDestination, checkedAbsent>>
RecordReply(s) ==
    /\ online /\ s \in replies /\ requestKey[s] = "stable"
    /\ confirmed' = TRUE /\ alarm' = FALSE /\ replies' = replies \ {s}
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   requests, requestKey, requestDest, applied, destinations,
                   currentDestination, checkedAbsent>>
Reconcile ==
    /\ online /\ available /\ intent /\ ~confirmed /\ "stable" \in applied
    /\ confirmed' = TRUE /\ alarm' = FALSE
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   requests, replies, requestKey, requestDest, applied,
                   destinations, currentDestination, checkedAbsent>>
Crash ==
    /\ online /\ crashLeft = 1 /\ online' = FALSE /\ crashLeft' = 0
    /\ checkedAbsent' = FALSE
    /\ UNCHANGED <<kind, available, outageLeft, intent, alarm, confirmed,
                   requests, replies, requestKey, requestDest, applied,
                   destinations, currentDestination>>
Restart ==
    /\ ~online /\ online' = TRUE
    /\ UNCHANGED <<kind, available, crashLeft, outageLeft, intent, alarm,
                   confirmed, requests, replies, requestKey, requestDest,
                   applied, destinations, currentDestination, checkedAbsent>>
Outage ==
    /\ available /\ outageLeft = 1 /\ available' = FALSE /\ outageLeft' = 0
    /\ checkedAbsent' = FALSE
    /\ UNCHANGED <<kind, online, crashLeft, intent, alarm, confirmed,
                   requests, replies, requestKey, requestDest, applied,
                   destinations, currentDestination>>
Recover ==
    /\ ~available /\ available' = TRUE
    /\ UNCHANGED <<kind, online, crashLeft, outageLeft, intent, alarm,
                   confirmed, requests, replies, requestKey, requestDest,
                   applied, destinations, currentDestination, checkedAbsent>>
Rebind ==
    /\ currentDestination = "original" /\ currentDestination' = "new"
    /\ UNCHANGED <<kind, online, available, crashLeft, outageLeft, intent,
                   alarm, confirmed, requests, replies, requestKey, requestDest,
                   applied, destinations, checkedAbsent>>
Idle == UNCHANGED vars
Next == \/ PersistIntent \/ QueryAbsent \/ SendAny \/ ApplyAny
        \/ \E s \in Slots : DropRequest(s) \/ DropReply(s) \/ RecordReply(s)
        \/ Reconcile \/ Crash \/ Restart \/ Outage \/ Recover \/ Rebind \/ Idle
Spec == Init /\ [][Next]_vars /\ WF_vars(Restart) /\ WF_vars(Recover)
        /\ WF_vars(PersistIntent) /\ WF_vars(QueryAbsent)
        /\ SF_vars(SendAny) /\ SF_vars(ApplyAny) /\ WF_vars(Reconcile)
TypeOK == /\ kind \in {"capture", "release", "refund"}
          /\ online \in BOOLEAN /\ available \in BOOLEAN
          /\ crashLeft \in 0..1 /\ outageLeft \in 0..1
          /\ intent \in BOOLEAN /\ alarm \in BOOLEAN /\ confirmed \in BOOLEAN
          /\ requests \subseteq Slots /\ replies \subseteq Slots
          /\ requestKey \in [Slots -> Keys]
          /\ requestDest \in [Slots -> {"original", "new"}]
          /\ applied \subseteq Keys /\ destinations \subseteq {"original", "new"}
          /\ currentDestination \in {"original", "new"} /\ checkedAbsent \in BOOLEAN
AtMostOneProviderEffect == Cardinality(applied) <= 1
FrozenDestination == destinations \subseteq {"original"}
NoInventedConfirmation == confirmed => "stable" \in applied
DurableBeforeEffect == (requests # {} \/ applied # {}) => intent
PendingHasAlarm == intent /\ ~confirmed => alarm
EventuallyConfirmed == intent ~> confirmed
=============================================================================
