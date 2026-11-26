# Media References and Optional Hosting

*SITLA Protocol v0.13 — Media Handling Requirements*\
**License:** [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## 1. Hosting Is an Optional Capability

*An operator can support external links without accepting a single media upload.*

**MEDIA-1.** Core conformance MUST NOT require operator-hosted images, audio or video. An operator that accepts only external media references can conform to Core and the other profiles it actually implements. An implementation that offers no media handling can also conform; unsupported media operations must be explicit. Upload, storage, proxying, thumbnails, transcoding, embedding, preservation and media delivery are separately declared optional capabilities, not implied by accepting a URL in a VC. A URL-only operator must not advertise those capabilities as available.

Operators publish their supported reference schemes and handling policy, whether resources are linked, fetched, embedded or cached, any provider/authentication restrictions, and unsupported operations. Hosting operators additionally publish accepted types, quotas, retention/export/deletion, access controls, URL expiry/revocation and costs. Storage vendors, numerical capacity limits and particular video/image services are local deployment choices, not common protocol requirements. Capability declarations describe actual behavior; a published specification is not an implementation.

## 2. A Signed Link Is a Reference, Not a Verified File

*The credential's issuer asserts the link. Its signature does not authenticate everything currently served there.*

**MEDIA-2.** A self-issued or third-party VC may contain external image, audio, video or portfolio URLs under the credential designer's declared schema. The protocol imposes no universal media claim name or hosting provider. Preserve the original signed credential and its exact reference; display transformations, resolved redirects, thumbnails and extracted metadata are separate observations. The verifier must still establish issuer/key authority, securing format, status and the intended claim semantics. A self-issued link establishes an assertion by that issuer, not independent proof of authorship, copyright, subject identity, safety, truth or work quality.

A bare URL refers to a location whose content, visibility or availability can change. It is not immutable evidence of a particular file. Distinguish a web/viewing page from a directly retrievable resource; a video-platform page is not a fixed video byte stream. Operators MUST NOT silently download a rendition, hash it and present that digest as if the credential issuer had signed it.

**MEDIA-3.** If a use case needs content integrity, use a supported credential/resource adapter that binds the URL to the exact target bytes and a named cryptographic digest algorithm/encoding. The adapter must define retrieval/representation and decoding rules, digest scope and how to obtain those same bytes. Reuse an accepted standard adapter where available; a publisher may provide a downloadable immutable artifact separately from a streaming/viewing link. The existing wire request/evidence digest fields are not arbitrary media digests. This document introduces no new wire schema or media-signature suite.

Check the digest before asserting a match. A changed, inaccessible, authentication-gated or unsupported representation produces an explicit mismatch/unavailable/unsupported observation, never an invented successful check. A digest proves matching bytes, not safe content, ownership, permanent availability or permission to view. ZKP over a reference alone proves no fact about the remote media contents; a package claiming otherwise must specify and prove that relationship.

## 3. Disclosure and Payment Boundaries

*Charging to reveal a link does not make its destination purchaser-only.*

**MEDIA-4.** Operators apply consent, mandates and purchase entitlements to the information they disclose, including private URLs. An external destination has its own access controls and terms. A hidden or unlisted link can be copied or forwarded; the mere fact that its URL was sold does not enforce continued purchaser-only viewing. State whether payment purchases link disclosure, controlled access or another agreed service. Do not promise buyer-specific expiry, recall of copies or exclusive viewing unless the actual destination/adapter enforces those properties.

Signed media URLs are access mechanisms, not stable identity references or proof of content integrity. Publish their expiry and actual revocation behavior; do not put login, approval, recovery or deletion-cancellation secrets in media references. Credential validity/status and destination access are separate: a valid VC may link to an unavailable file, and revoking a VC or presentation mandate does not itself disable an external URL.

## 4. Safe Retrieval and Recipient Privacy

*Receiving a link need not cause a network request.*

**MEDIA-5.** Treat media references, captions, page metadata and extracted text as untrusted data, never agent instructions or authority to execute tools. Show a usable reference without requiring automatic preview or external contact. Explain when viewing/embedding contacts another provider and may disclose IP, browser, referrer or account information. Do not silently disclose private credential contents or authorization tokens to a destination, preview service or embed provider. Viewer consent/access policy governs loading third-party media; accepting a VC is not blanket consent to external tracking.

If the operator fetches/proxies a resource, enforce scheme/origin/network policy, check each redirect and resolved destination, reject unauthorized internal/private-network targets, and bound bytes, duration, decompression and parsing. Do not forward operator/client credentials to arbitrary URLs. Validate actual content type and isolate active content; provider branding, MIME labels, a filename or a digest alone does not make a file safe. Clients fetching resources directly need equivalent controls appropriate to their environment. A URL-only operator that never fetches or embeds should declare that simpler boundary.

## 5. Export, Deletion and Conformance

*Portability preserves a signed reference; it cannot compel an external host to keep or erase its contents.*

**MEDIA-6.** Export supported credential bytes with their original media references and any signed integrity metadata. Explain which hosted files are exportable and which external resources remain the holder's responsibility. Exporting a link is not a promise to archive its contents, preserve an external account or transfer another provider's access permissions. Do not rewrite a signed VC just to substitute a local media URL; use a separately identified derivative with its own provenance if needed.

Follow [Account Lifecycle](protocol-lifecycle.md) for operator-held files, caches and issued access links. Declaration of URL-only support does not exempt retained previews/caches from deletion, retention or disclosure policy. Deleting an operator account or withdrawing a mandate stops that operator's authority; it does not delete a third-party upload, invalidate a third-party link, erase a recipient's copy or revoke another issuer's credential. Report actual expiry/status and uncertainty; do not claim instantaneous worldwide removal.

| Requirements | Conformance case | Expected behavior |
| --- | --- | --- |
| MEDIA-1 | Run a reference-only operator with uploads disabled | No media store/vendor/quota is needed for conformance; upload is explicitly unsupported |
| MEDIA-2–3 | Change destination bytes or supply a viewing-page URL | Signature on the reference remains distinct from content verification; mismatch/unavailable is not success |
| MEDIA-4 | Reveal a paid link, then forward it or revoke the VC | Disclose the destination's actual controls; no implied purchaser-only access or external recall |
| MEDIA-5 | Receive a tracking link, internal-network redirect or hostile caption | No automatic contact or tool authority; fetching follows declared policy and resource limits |
| MEDIA-6 | Export/delete an account containing URLs, cached previews and hosted files | Preserve signed references on export; enforce local deletion policy without claims about external copies |

These are requirements and adversarial scenarios, not implemented media adapters or executed conformance fixtures. Node/Python wire tests do not certify media fetchers, hosting, third-party providers or content preservation.
