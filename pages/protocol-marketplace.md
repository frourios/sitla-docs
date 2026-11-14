# Marketplace Profile

*SITLA Protocol v0.3 — Optional Design Profile*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 14, 2026

## 1. Open-Market Scope

*Participants define the work. An operator handles circulation and authorized payment instructions.*

This profile extends [Core](protocol.md); Core Section 2 contains the common assurance limits. Operator branding does not restrict protocol participation by nationality. Buyers may accept an unverified self-description for a small task or require accepted official/institutional credentials for consequential work. Missing evidence remains missing even when the buyer accepts the risk. Public bodies, universities and companies can participate as buyers, sellers or issuers, subject to their own participation authority.

**MARKET-1.** Parties define VC schemas, meanings, signatures and workflows; the protocol mandates no contract/delivery/acceptance taxonomy. A project may use design review, interim inspection, change order, objection, milestone approval or professional-reference VCs in any agreed sequence. Independent agents or contract-management tools interpret them. Unknown semantics do not prevent bounded storage/transport, but are not claimed to be verified. Cryptographic compatibility is separately declared in the [Proof Package Profile](protocol-packages.md).

## 2. Verification and Issuance as Work

*An institution can charge for the agreed examination or issuance process. Payment does not compel a favorable assertion.*

An issuer publishes its procedure, evidence requirements, price and refusal/refund conditions. A requester can arrange face-to-face examination or records checks, prove control of the intended subject's DID, and receive a credential if the issuer approves its own assertion. The same circulation/payment interface can support that request without a protocol-wide definition of a degree or official identity.

The institution's authority, participation conditions and ability to use an intermediary must be established independently. An account name is not official endorsement. Public evidence such as [JPKI certificate fields](https://www.jpki.go.jp/download/howto_iphone/certificate.html) is a possible research input, not an implemented integration or automatic nationality claim. An accepted issuer and its scope remain the buyer's policy.

## 3. Approval, Payment and Optional References

*Evidence can be an agreed input to payment authorization. Receiving an arbitrary VC is not permission to transfer money.*

**MARKET-2.** Payment instructions bind payer, payee, amount/currency, terms reference, idempotency key and explicitly approved execution conditions. When a party delegates condition evaluation to an inspector, agent or external contract system, the instruction names that authority and accepted signal. Unexpected event types, unsupported required proofs or missing authority do not trigger execution. Provider-confirmed events matched to the instruction are payment evidence; a browser return or qualification proof is not.

Payment execution/payout custody use an actual external provider. Escrow, milestone capture/release, refunds, disputes and adjudication require separately declared capabilities and agreements. No offline financial finality is implied by the disaster profile. Numerical fees and who pays processing costs are [commercial information](business-model.md), not protocol requirements or an assurance level.

**MARKET-3.** Parties may issue/export work records and publish selected references under public DIDs. Neither a standard portfolio nor reciprocal ratings/job-count schemas are required. A buyer's public seller profile does not permit publication of its purchases, name, exact prices or deliverables without the applicable disclosure permission. Independently created accounts are not automatically linked. Buyer-selected evidence policies assess prominent-name bindings, collusion, invented work and repeated references.

## 4. Illustrative Sequence

*Select the evidence at the decision point. The order and number of work records remain contractual choices.*

1. Search returns `service-json` candidate descriptions; the agent treats them as data, not tool instructions.
2. The buyer chooses service trust, user approval, issuer disclosure or named ZKP and records a local verification outcome when it performs verification.
3. Parties negotiate terms and any desired milestones outside or within a supported service workflow.
4. A required approval uses Core's bound action record; optional work VCs follow the parties' schemas.
5. The payer authorizes a supported instruction; a provider-confirmed result records its outcome.
6. Parties exchange any inspection/delivery/reference records their agreement requires and disclose them only under their permissions.

The Core API examples distinguish `verification_result` from `acceptance_decision`. This sequence is illustrative, not a mandatory one-payment or final-acceptance state machine. A qualification issuance request may itself be the entire job.

## 5. Conformance and Current Scope

*Test the boundary between an event and permission to act on it.*

| Requirements | Test | Expected result |
| --- | --- | --- |
| MARKET-1 | Use a non-Japanese seller without official VC and an unfamiliar milestone schema | Buyer chooses assurance; no nationality certification or imposed work taxonomy |
| MARKET-2 | Submit a valid inspection VC not covered by payment authority; retry altered amount | No transfer without matching authority; no duplicate or substituted payment |
| MARKET-3 | Publish a buyer's name from its public seller profile; duplicate reference records | Disclosure requires its actual permission; no protocol-guaranteed career metric |

Existing paid-profile checkout is not implementation of arbitrary task payments, institutional issuance, milestones, escrow or adjudication. Those features require their own service integration and terms. This document changes none of the deployed tools.
