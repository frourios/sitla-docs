------------------------- MODULE PublicJobRequests -------------------------
\* SPDX-License-Identifier: Apache-2.0
\* JOB-1..6 / MONEY-1..3. One public request, a possibly stale cache, one
\* participant, privately negotiated terms and monetary VCs from the later work flow.
EXTENDS Naturals, FiniteSets
CONSTANTS SupportedCurrencies, ExpiresAt, MaxTime, MinimumReward
ASSUME /\ SupportedCurrencies = {"JPY"} /\ MinimumReward = 500
       /\ ExpiresAt > 0 /\ ExpiresAt < MaxTime
Cases == {"valid", "usd", "missing-unit", "cheap", "bad-signature"}
Codes == {"JPY", "USD", "absent"}
Stages == {"progress", "completion", "collection", "instruction", "payment-event"}
MinorUnit(c) == IF c = "USD" THEN 2 ELSE 0
Money(a, c) == [amountMinor |-> a, currency |-> c, currencyExponent |-> MinorUnit(c)]
ValidAmount(m, minimum) ==
    /\ m.currency \in SupportedCurrencies \* MUTATION: supported currency
    /\ m.currencyExponent = MinorUnit(m.currency)
    /\ m.amountMinor >= minimum
Request(c) ==
    [id |-> "request-original", issuer |-> "requester", subject |-> "requester",
     licenses |-> {"CC0-1.0"}, validUntil |-> ExpiresAt,
     summary |-> "public summary", details |-> "vault-only detailed body",
     eligibility |-> "vault-only applicant conditions", extensions |-> "vault-only opaque data",
     reward |-> Money(IF c = "cheap" THEN 499 ELSE 500,
                      CASE c = "usd" -> "USD" [] c = "missing-unit" -> "absent" [] OTHER -> "JPY"),
     estimatedExpenses |-> Money(0, "JPY"), completionLicenses |-> {"CC0-1.0"},
     desiredDueAt |-> MaxTime, signatureValid |-> c # "bad-signature"]
Admissible(r) == /\ r.signatureValid /\ r.issuer = r.subject
                 /\ r.licenses = {"CC0-1.0"}
                 /\ ValidAmount(r.reward, MinimumReward)
                 /\ ValidAmount(r.estimatedExpenses, 0)
Projection(r) ==
    [credentialId |-> r.id, credentialDigest |-> "exact-original-digest",
     requester |-> r.issuer, summary |-> r.summary, reward |-> r.reward,
     estimatedExpenses |-> r.estimatedExpenses, completionLicenses |-> r.completionLicenses,
     validUntil |-> r.validUntil, desiredDueAt |-> r.desiredDueAt]
    \* MUTATION: projection ends here
ProjectionKeys == {"credentialId", "credentialDigest", "requester", "summary", "reward",
                   "estimatedExpenses", "completionLicenses", "validUntil", "desiredDueAt"}
VARIABLES published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached, displayed,
          fetched, verified, trust, trustProof, contacted, contactAt,
          proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
          workStage, workMoney, delivery
vars == <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached, displayed,
          fetched, verified, trust, trustProof, contacted, contactAt,
          proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
          workStage, workMoney, delivery>>
EmptyMoney == Money(0, "JPY")
Init == /\ published = FALSE /\ publicationOccurred = FALSE /\ selected \in Cases /\ now = 0 /\ archived = FALSE /\ indexed = FALSE
        /\ row = [credentialId |-> "none"] /\ closed = FALSE /\ revoked = FALSE
        /\ cached = FALSE /\ displayed = FALSE /\ fetched = "none"
        /\ verified = FALSE /\ trust = "undecided" /\ trustProof = FALSE
        /\ contacted = FALSE /\ contactAt = MaxTime + 1
        /\ proposal = EmptyMoney /\ proposedPolicy = "public" /\ approved = FALSE
        /\ contract = FALSE /\ agreed = EmptyMoney /\ agreedPolicy = "public"
        /\ workStage = "none" /\ workMoney = EmptyMoney /\ delivery = "none"
Archive ==
    /\ ~archived /\ Admissible(Request(selected)) /\ now < ExpiresAt
    /\ archived' = TRUE
    /\ UNCHANGED <<published, publicationOccurred, selected, now, indexed, row, closed, revoked, cached, displayed,
                   fetched, verified, trust, trustProof, contacted, contactAt,
                   proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
Index ==
    /\ archived /\ ~indexed /\ ~closed /\ ~revoked /\ now < ExpiresAt
    /\ published' = TRUE /\ publicationOccurred' = TRUE
    /\ indexed' = TRUE /\ row' = Projection(Request(selected))
    /\ UNCHANGED <<selected, now, archived, closed, revoked, cached, displayed,
                   fetched, verified, trust, trustProof, contacted, contactAt,
                   proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
RefreshCache ==
    /\ cached' = (indexed /\ ~closed /\ ~revoked /\ now < ExpiresAt)
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, displayed,
                   fetched, verified, trust, trustProof, contacted, contactAt,
                   proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
DisplayCache ==
    /\ cached /\ displayed' = TRUE
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   fetched, verified, trust, trustProof, contacted, contactAt,
                   proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
Close ==
    /\ indexed /\ ~closed /\ closed' = TRUE
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, revoked, cached, displayed,
                   fetched, verified, trust, trustProof, contacted, contactAt,
                   proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
Revoke ==
    /\ indexed /\ ~revoked /\ revoked' = TRUE
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, cached, displayed,
                   fetched, verified, trust, trustProof, contacted, contactAt,
                   proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
DeleteOwner ==
    /\ publicationOccurred
    /\ closed' = TRUE
    /\ published' = published \* MUTATION: deletion keeps public original
    /\ UNCHANGED <<publicationOccurred,selected,now,archived,indexed,row,revoked,cached,displayed,fetched,verified,trust,trustProof,contacted,contactAt,proposal,proposedPolicy,approved,contract,agreed,agreedPolicy,workStage,workMoney,delivery>>
ReadOriginal(proof) ==
    /\ published \* MUTATION: archive retrieval independent of listing
    /\ proof \in {"original", "tampered", "unavailable"}
    /\ fetched' = proof /\ verified' = FALSE
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, trust, trustProof, contacted, contactAt, proposal,
                   proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
ProofValid == fetched = "original" /\ Request(selected).signatureValid
VerifyClient ==
    /\ fetched # "none" /\ verified' = ProofValid
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, fetched, trust, trustProof, contacted, contactAt,
                   proposal, proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
\* An operator's untrusted assertion always says valid in this hostile-source
\* scenario. The client's own verification, not that assertion, gates reliance.
OperatorSaysValid == TRUE
ChooseTrust(score) ==
    /\ verified \* MUTATION: independent verification
    /\ score \in {"reject", "accept"} /\ trust' = score /\ trustProof' = ProofValid
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, fetched, verified, contacted, contactAt, proposal,
                   proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
\* Ordinary contact is independent of publication/expiry; DM's gate is modelled separately.
Contact ==
    /\ contacted' = TRUE /\ contactAt' = now
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, fetched, verified, trust, trustProof, proposal,
                   proposedPolicy, approved, contract, agreed, agreedPolicy,
                   workStage, workMoney, delivery>>
\* The following party actions are environment choices, not operator negotiation APIs.
Negotiate(a, c, policy) ==
    /\ contacted /\ ~contract /\ ValidAmount(Money(a, c), MinimumReward)
    /\ policy \in {"public", "internal"}
    /\ proposal' = Money(a, c) /\ proposedPolicy' = policy /\ approved' = FALSE
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, fetched, verified, trust, trustProof, contacted,
                   contactAt, contract, agreed, agreedPolicy, workStage, workMoney, delivery>>
ApproveTerms ==
    /\ contacted /\ ~contract /\ proposal.amountMinor >= MinimumReward
    /\ approved' = TRUE
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, fetched, verified, trust, trustProof, contacted,
                   contactAt, proposal, proposedPolicy, contract, agreed,
                   agreedPolicy, workStage, workMoney, delivery>>
StartWork ==
    /\ approved /\ ~contract /\ contract' = TRUE
    /\ agreed' = proposal /\ agreedPolicy' = proposedPolicy
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, fetched, verified, trust, trustProof, contacted,
                   contactAt, proposal, proposedPolicy, approved,
                   workStage, workMoney, delivery>>
RecordMoneyVC(stage, c, body) ==
    /\ contract /\ stage \in Stages /\ c \in Codes
    /\ ValidAmount(Money(agreed.amountMinor, c), MinimumReward)
    /\ c = agreed.currency /\ MinorUnit(c) = agreed.currencyExponent
    /\ body \in {"as-described", "different"}
    /\ workStage' = stage
    /\ workMoney' = [amountMinor |-> agreed.amountMinor, currency |-> c,
                     currencyExponent |-> MinorUnit(c)] \* MUTATION: explicit work unit
    /\ delivery' = body
    /\ UNCHANGED <<published, publicationOccurred, selected, now, archived, indexed, row, closed, revoked, cached,
                   displayed, fetched, verified, trust, trustProof, contacted,
                   contactAt, proposal, proposedPolicy, approved, contract,
                   agreed, agreedPolicy>>
Tick == /\ now < MaxTime /\ now' = now + 1
        /\ UNCHANGED <<published, publicationOccurred, selected, archived, indexed, row, closed, revoked, cached,
                       displayed, fetched, verified, trust, trustProof, contacted,
                       contactAt, proposal, proposedPolicy, approved, contract,
                       agreed, agreedPolicy, workStage, workMoney, delivery>>
Idle == UNCHANGED vars
Next == \/ Archive \/ Index \/ RefreshCache \/ DisplayCache \/ Close \/ Revoke \/ DeleteOwner
        \/ \E p \in {"original", "tampered", "unavailable"} : ReadOriginal(p)
        \/ VerifyClient \/ \E s \in {"reject", "accept"} : ChooseTrust(s)
        \/ Contact
        \/ \E a \in {499, 500, 600}, c \in Codes, p \in {"public", "internal"} : Negotiate(a, c, p)
        \/ ApproveTerms \/ StartWork
        \/ \E s \in Stages, c \in Codes, b \in {"as-described", "different"} : RecordMoneyVC(s, c, b)
        \/ Tick \/ Idle
Spec == Init /\ [][Next]_vars /\ WF_vars(Tick) /\ WF_vars(Index)
TypeOK == /\ selected \in Cases /\ now \in 0..MaxTime
          /\ archived \in BOOLEAN /\ indexed \in BOOLEAN /\ closed \in BOOLEAN
          /\ revoked \in BOOLEAN /\ cached \in BOOLEAN /\ displayed \in BOOLEAN
          /\ fetched \in {"none", "original", "tampered", "unavailable"}
          /\ verified \in BOOLEAN /\ trust \in {"undecided", "reject", "accept"}
          /\ trustProof \in BOOLEAN /\ contacted \in BOOLEAN
          /\ contactAt \in 0..(MaxTime + 1)
          /\ approved \in BOOLEAN /\ contract \in BOOLEAN
          /\ proposedPolicy \in {"public", "internal"} /\ agreedPolicy \in {"public", "internal"}
          /\ workStage \in Stages \cup {"none"} /\ delivery \in {"none", "as-described", "different"}
          /\ proposal \in [amountMinor : {0, 499, 500, 600}, currency : Codes, currencyExponent : {0, 2}]
          /\ agreed \in [amountMinor : {0, 499, 500, 600}, currency : Codes, currencyExponent : {0, 2}]
          /\ workMoney \in [amountMinor : {0, 499, 500, 600}, currency : Codes, currencyExponent : {0, 2}]
OriginalForever == publicationOccurred => (published /\ archived)
RetrievalIndependentOfListing == published => ENABLED ReadOriginal("original")
OriginalBeforeIndex == indexed => archived
IndexOnlyProjection == indexed => DOMAIN row = ProjectionKeys
JPYOnlyAdmission == archived =>
    (Request(selected).reward.currency \in SupportedCurrencies /\
     Request(selected).estimatedExpenses.currency \in SupportedCurrencies)
ClientVerifiedBeforeTrust == trust # "undecided" => trustProof
WorkNeedsAgreement == contract => (contacted /\ approved /\ agreed = proposal /\ agreedPolicy = proposedPolicy)
MoneyUnitExplicit == workStage # "none" =>
    (workMoney.currency # "absent" /\ workMoney.currencyExponent = MinorUnit(workMoney.currency))
WorkMoneyMatchesAgreement == workStage # "none" =>
    (workMoney = agreed /\ workMoney.currency \in SupportedCurrencies)
PendingPublicationSettles == archived ~> (indexed \/ closed \/ revoked \/ now >= ExpiresAt)
AgreedTermsStable == [][contract => (agreed' = agreed /\ agreedPolicy' = agreedPolicy)]_vars
\* Deliberately FALSE claims, checked separately as permitted-behavior witnesses.
CacheAlwaysFresh == cached => now < ExpiresAt
ContractEqualsAdvertisement == contract => agreed.amountMinor = Request(selected).reward.amountMinor
=============================================================================
