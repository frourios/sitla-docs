# SITLA Operator Deployment

*Founding operator configuration — informational, outside protocol conformance*  
**Date:** November 14, 2026

## 1. Operator Identity and Publication

*These values identify the Frourio-operated service. Independent implementations choose their own.*

| Setting | SITLA value |
| --- | --- |
| Operator | SITLA / Frourio, Inc. |
| Origin / proposed `operator_id` | `https://sitla.frourio.com` |
| Current MCP endpoint | `https://sitla.frourio.com/mcp` |
| Terms / privacy | `https://sitla.frourio.com/terms`, `https://sitla.frourio.com/privacy` |
| Documentation repository | `https://github.com/frourios/sitla-docs` |
| Raw documentation base | `https://raw.githubusercontent.com/frourios/sitla-docs/` followed by the pinned commit and file path |
| Commercial conditions | [Commercial Model](commercial.md), actual transaction terms and provider agreement |

These publication addresses do not confer issuer authority. No universal trust list or required recovery signer belongs to Frourio. WebAuthn/OAuth metadata, authority keys, witness configuration and authenticated operator discovery must be published and tested before their proposed capabilities are offered; this document does not fabricate deployed values.

## 2. Proposed Security and Operational Policy

*These are the operator’s proposed policy parameters. They describe proposed facilities, not current runtime enforcement.*

| Policy parameter | Proposed SITLA value |
| --- | --- |
| `challengeMaxAgeSeconds` | 300 |
| `routeRecheckMaxAgeSeconds` | 15,552,000 (180 days) |
| `pendingSeconds` | 172,800 (48 hours) |
| `restrictedSeconds` | 604,800 (seven days) |
| `contestIntakeWindowSeconds` | 86,400 |
| `contestMaxReportsPerCasePerWindow` | 5 |
| `contestMaxReportsPerPrincipalPerWindow` | 10 |
| `unverifiedRiskHoldMaxSeconds` | 86,400; continuation requires documented independent review |
| `contestAckSeconds` | 86,400 (24 hours) |
| `contestInitialBusinessDays` | 3 |
| `contestUpdateBusinessDays` | 3 |
| `updateCheckSeconds` | 86,400 (daily while connected) |
| `bundleRefreshMaxAgeSeconds` | 2,592,000 (30 days) |
| `bundleNormalUseMaxAgeSeconds` | 7,776,000 (90 days) |
| `drillMaxIntervalDays` | 180 |

The service calendar, policy revision/digest, actual recovery contacts, accepted issuer scopes and operational key references remain deployment work. Missing required configuration means the capability is unavailable, not that client software should invent it. Local recovery destinations are private account data, not public descriptor fields.

## 3. Implementation and Independence

*The protocol draft and the service have different release states.*

Current service capabilities include email-code authentication and paid profile disclosure through Stripe. Proposed passkeys, OAuth/DPoP, root/VC custody, constrained recovery, transparency logs, offline facilities and proof packages are not deployed merely by publishing these documents. No runtime defaults or payment fees are changed by this documentation update.

Other operators implement [Core](protocol.md) and the [Operator Profile](protocol-operators.md) with their own parameters and supported profiles. They need not use these URLs, timings, Stripe, Cloudflare, Japanese branding or the [20% commercial fee](commercial.md).
