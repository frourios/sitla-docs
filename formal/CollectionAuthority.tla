----------------------- MODULE CollectionAuthority -----------------------
\* SPDX-License-Identifier: Apache-2.0
\* AGENCY-4..7: two requests compete for a single remaining budget slot.
\* An accepted grant may predate connection; every new reservation requires it.
EXTENDS Naturals, FiniteSets
CONSTANTS Payments, Gross, Fee, Budget
ASSUME /\ IsFiniteSet(Payments) /\ Cardinality(Payments) = 2
       /\ Gross > Fee /\ Fee >= 0 /\ Budget = Gross
VARIABLES grant, grantDestination, connection, status, snapshot,
          captures, transfers, paid, debtDischarged
vars == <<grant, grantDestination, connection, status, snapshot,
          captures, transfers, paid, debtDischarged>>
EmptySnapshot == [active |-> FALSE, connected |-> FALSE,
                  destination |-> "none", authorizedDestination |-> "none",
                  gross |-> 0, fee |-> 0, budgetBefore |-> 0, binding |-> "none"]
Init == /\ grant = "none" /\ grantDestination = "none" /\ connection = "none"
        /\ status = [p \in Payments |-> "unused"]
        /\ snapshot = [p \in Payments |-> EmptySnapshot]
        /\ captures = [p \in Payments |-> 0]
        /\ transfers = [p \in Payments |-> 0]
        /\ paid = {} /\ debtDischarged = {}
UsedBudget == Cardinality({p \in Payments : status[p] \in {"reserved", "captured"}}) * Gross
Connect == /\ connection = "none" /\ connection' = "original"
           /\ UNCHANGED <<grant, grantDestination, status, snapshot, captures,
                          transfers, paid, debtDischarged>>
Rebind == /\ connection = "original" /\ connection' = "new"
          /\ UNCHANGED <<grant, grantDestination, status, snapshot, captures,
                         transfers, paid, debtDischarged>>
Authorize == /\ grant = "none" /\ grant' = "active"
             /\ grantDestination' = connection
             /\ UNCHANGED <<connection, status, snapshot, captures,
                            transfers, paid, debtDischarged>>
Withdraw == /\ grant = "active" /\ grant' = "withdrawn"
            /\ UNCHANGED <<grantDestination, connection, status, snapshot,
                           captures, transfers, paid, debtDischarged>>
Reserve(p, binding) ==
    /\ status[p] = "unused"
    /\ grant = "active" \* MUTATION: withdrawal barrier
    /\ connection # "none"
    /\ (grantDestination = "none" \/ grantDestination = connection)
    /\ binding = "exact"
    /\ UsedBudget + Gross <= Budget \* MUTATION: atomic budget check
    /\ snapshot' = [snapshot EXCEPT ![p] =
         [active |-> grant = "active", connected |-> connection # "none",
          destination |-> connection, authorizedDestination |-> grantDestination,
          gross |-> Gross, fee |-> Fee, budgetBefore |-> UsedBudget, binding |-> binding]]
    /\ status' = [status EXCEPT ![p] = "reserved"]
    /\ UNCHANGED <<grant, grantDestination, connection, captures,
                   transfers, paid, debtDischarged>>
Capture(p) ==
    /\ status[p] = "reserved"
    /\ status' = [status EXCEPT ![p] = "captured"]
    /\ captures' = [captures EXCEPT ![p] = @ + 1]
    /\ debtDischarged' = debtDischarged \cup {p}
    /\ UNCHANGED <<grant, grantDestination, connection, snapshot,
                   transfers, paid>>
Expire(p) ==
    /\ status[p] = "reserved"
    /\ status' = [status EXCEPT ![p] = "expired"]
    /\ UNCHANGED <<grant, grantDestination, connection, snapshot, captures,
                   transfers, paid, debtDischarged>>
Remit(p) ==
    /\ status[p] = "captured" /\ p \notin paid
    /\ paid' = paid \cup {p}
    /\ transfers' = [transfers EXCEPT ![p] = @ + 1]
    /\ UNCHANGED <<grant, grantDestination, connection, status, snapshot,
                   captures, debtDischarged>>
RemitAny == \E p \in Payments : Remit(p)
Retry(p, body) ==
    /\ status[p] # "unused"
    /\ body \in {"exact", "changed"}
    \* exact => original reservation/result (including withdrawn grant);
    \* changed => conflict; expired => never reopened. All preserve state.
    /\ UNCHANGED vars
Idle == UNCHANGED vars
Next == \/ Connect \/ Rebind \/ Authorize \/ Withdraw
        \/ \E p \in Payments, b \in {"exact", "wrong"} : Reserve(p, b)
        \/ \E p \in Payments : Capture(p) \/ Expire(p) \/ Remit(p)
        \/ \E p \in Payments, b \in {"exact", "changed"} : Retry(p, b)
        \/ Idle
Spec == Init /\ [][Next]_vars /\ WF_vars(RemitAny)
TypeOK == /\ grant \in {"none", "active", "withdrawn"}
          /\ grantDestination \in {"none", "original", "new"}
          /\ connection \in {"none", "original", "new"}
          /\ status \in [Payments -> {"unused", "reserved", "captured", "expired"}]
          /\ captures \in [Payments -> 0..1] /\ transfers \in [Payments -> 0..1]
          /\ paid \subseteq Payments /\ debtDischarged \subseteq Payments
          /\ snapshot \in [Payments ->
               [active : BOOLEAN, connected : BOOLEAN,
                destination : {"none", "original", "new"},
                authorizedDestination : {"none", "original", "new"},
                gross : {0, Gross}, fee : {0, Fee},
                budgetBefore : 0..(2 * Gross), binding : {"none", "exact", "wrong"}]]
NoReservationAfterWithdrawal == \A p \in Payments : status[p] # "unused" => snapshot[p].active
ConnectedBeforeReservation == \A p \in Payments : status[p] # "unused" => snapshot[p].connected
BudgetRespected == UsedBudget <= Budget
ReservationBound == \A p \in Payments : status[p] # "unused" =>
    /\ snapshot[p].binding = "exact"
    /\ snapshot[p].gross = Gross /\ snapshot[p].fee = Fee
    /\ snapshot[p].budgetBefore + Gross <= Budget
    /\ (snapshot[p].authorizedDestination = "none" \/
        snapshot[p].authorizedDestination = snapshot[p].destination)
NoSecondCollection == \A p \in Payments : captures[p] <= 1 /\ transfers[p] <= 1
CaptureDischargesDebt == debtDischarged = {p \in Payments : status[p] = "captured"}
RemittanceRequiresCapture == paid \subseteq debtDischarged
SnapshotStable == [][\A p \in Payments : status[p] # "unused" => snapshot'[p] = snapshot[p]]_vars
ExpiredStaysExpired == [][\A p \in Payments : status[p] = "expired" => status'[p] = "expired"]_vars
DebtNeverRevived == [][debtDischarged \subseteq debtDischarged']_vars
RemittanceProgress == \A p \in Payments : (p \in debtDischarged) ~> (p \in paid)
=============================================================================
