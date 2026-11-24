<!-- SPDX-License-Identifier: CC0-1.0 -->
# Selective-disclosure circulation fixtures

The [online profile](../../pages/protocol-online.md) defines the supported standard subset and explicit DID-issuer extension. [TypeScript definitions](../../reference/circulation.ts) describe the tool request/response and claim-source records. [Reference verification](../../reference/sd-jwt.ts) is Apache-2.0; this directory and its nonpersonal vectors are CC0-1.0.

`vectors.json` contains full and selectively disclosed RFC 9901 issuer-JWT examples with public Ed25519 key, plus four rejections including a validly signed duplicate-key payload. No signing secret is published. Node and Python verify these bytes independently. This covers signature/disclosure reproduction only; issuer trust, root grant validation, current status, key-binding JWTs, replay, live authorization and commercial execution require their separately declared checks. Existing core/payment fixture counts describe their frozen legacy profiles, not this adapter.
