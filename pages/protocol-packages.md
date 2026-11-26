# Proof Package Profile

*SITLA Protocol v0.16 — Experimental Optional Design Profile*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)\
**Date:** November 27, 2026

## 1. Roles and Distribution

*Authors publish; operators execute; buyers decide what to accept. Those are separate authorities.*

This profile extends [Core](protocol.md). A specification author defines fields, meaning and securing formats; an issuer adopts a version or publishes its own; an implementation author provides a compatible circuit/adapter. These roles may share an organization but do not imply one another's authority. Ordinary credential circulation needs no ZKP package.

**PKG-1.** Authors publish on GitHub, organizational sites or other identified origins. Operators and independent mirrors may cache licensed public artifacts, but are not exclusive authors, registries or approval authorities. The analogy is [Go modules and replaceable proxies](https://go.dev/ref/mod), not inheritance of Go's runtime/protocol or dependence on Google. Integrity identifies selected bytes; it does not establish safe execution, correct predicates or issuer honesty. Core Section 2 defines the shared trust limits.

## 2. Immutable Releases and Compatibility

*Pin a release and all its dependencies. A mutable URL is a location, not identity.*

**PKG-2.** A reference binds package identifier, exact version and authenticated canonical-manifest digest. Publisher signatures bind the complete manifest. First adoption needs an accepted publisher key/namespace policy or independently obtained digest; fetching a checksum alongside untrusted bytes is not that policy. Key changes require accepted authorization. A lock record fixes direct/transitive artifacts and toolchain/runtime requirements; changed bytes under a pinned release fail rather than rewrite the lock.

The issuer's signed credential or cryptographically bound issuance metadata identifies its exact schema/securing profile. Circuits must verify that actual signature and original conditions, not an unsigned outer type label. Compatible issuers can reuse a parameterized circuit. Different securing formats are not interchangeable just because their fields have the same names.

**PKG-3.** A manifest identifies source and compiled-artifact digests, verification key, proving system/parameters, supported credential revisions, input/output schema, predicate semantics, subject/holder binding, status behavior, dependency lock, runtime/resource limits, tests/build instructions, licenses, audit status and setup assumptions. Prover and verifier assets are separate entries with sizes/digests. Compare per-circuit, universal and transparent setup costs; no family is production-approved by this draft.

```json
{
  "package_id":"https://example.org/credential-packages/inspection",
  "version":"1.0.0",
  "manifest_digest":"sha256:<accepted-manifest>",
  "specification_digest":"sha256:<credential-profile>",
  "circuit_id":"selected-milestone-assertion",
  "verification_key_digest":"sha256:<accepted-key>",
  "dependency_lock_digest":"sha256:<resolved-lock>"
}
```

This is an illustrative proposed record, not a deployed package API. Native signing speed does not predict in-circuit cost. Ed25519, P-256, canonicalization and full witness processing require actual benchmarks. An issuer-signed Boolean may meet the buyer's need more simply. Disclosure mechanisms such as [RFC 9901](https://www.rfc-editor.org/rfc/rfc9901), November 2025, require their own holder-binding and VC profiles.

## 3. Caches and Bounded Execution

*Cache public tooling, not credentials. Execution approval grants no new permission to use a user's data.*

**PKG-4.** Origins, mirrors and authenticated offline bundles serve the same pinned bytes. Public caches contain no user VCs, keys, private witnesses or sensitive work payloads. Export permitted artifacts, licenses and locks rather than only live pointers. Independently witnessed checksum records can expose inconsistent publication but are optional; no universal online checksum server is required. Offline nodes know only the safety notices and approvals they obtained. Withdrawal/deprecation never silently rewrites historical keys/artifacts.

**PKG-5.** The service/wallet decides execution support; the buyer independently approves evidence packages and issuers. A cached/listed or issuer-endorsed package is not automatically runnable or acceptable. A buyer cannot force a custodian to run unsupported code. Retrieval is separate from credential processing and bounds destinations, redirects, wire/decompressed bytes and time.

No automatic package-controlled builds/plugins/witness generators get vault, host filesystem, ambient secrets or network access. An approved engine and reviewed adapters execute in a metered worker with bounded CPU, memory and input/output. Review includes public-output semantics and the proving stack: sandboxing alone cannot stop a malicious prover encoding secrets into an allowed output. Source availability and reproducibility support review, not a universal safety assertion.

## 4. Composed Proof Requests

*Bind the requested predicates to one subject and one context. Verify against the buyer's pinned keys.*

**ZK-1.** Requests fix package/circuit/key digests, parameters, audience, purpose, challenge, expiry, accepted anchors, subject/account commitment and status policy. Multiple proofs share a session-scoped subject commitment or audited composition relation; separate people's claims cannot be combined. Identify whether account mapping depends on the named custodian or an independent issuer.

**ZK-2.** Return request digest, package references, proofs, verified public outputs and per-issuer status observations. Derive display values from verified inputs. A substituted weaker circuit or different dependency/key fails, even if signed by a known author. Hosted-only verification reports its actual operator. Consent, scope, entitlement and query/work quotas precede proving; unrestricted threshold/predicate oracles and unsalted low-entropy commitments are excluded.

## 5. Conformance and Maturity

*Adopt a small reviewed set before expanding. Measure phone, server and air-interface costs separately.*

| Requirements | Test | Expected result |
| --- | --- | --- |
| PKG-1–2 | Fetch from origin, two mirrors and offline lock; mutate a dependency or publisher | Selected bytes match; changed or unauthenticated artifacts rejected |
| PKG-3 | Reproduce artifacts and test actual issuer bytes, malformed inputs and setup provenance | Supported profile explicit; no proof from unsigned lookalike fields |
| PKG-4–5 | Submit a listed but unapproved network/file-reading generator with private witness | No automatic execution or secret access; explicit unsupported policy |
| ZK-1–2 | Mix subjects/context, swap keys or weaken a predicate | Required relation fails; acceptance does not relabel invalid proof |

The catalog, resolver/proxy, independent verifier, circuit audits and device prover are proposed work. Record download sizes, compile/prove/verify percentiles, memory, failures and cold starts with hardware/versions. [Disaster deployment](protocol-portability.md) additionally needs cached prover assets when device proving is required.
