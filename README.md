# Docs for SITLA

https://sitla.frourio.com

This public repository contains the English SITLA Protocol **v0.2 design draft**:

- [Core](pages/protocol.md): identity, access, evidence and recovery.
- [Portability and Disaster](pages/protocol-portability.md): local operation, preparedness and degraded assurance.
- [Proof Packages](pages/protocol-packages.md): external specifications, artifact distribution and execution.
- [Marketplace](pages/protocol-marketplace.md): market-defined work and authorized payment handoffs.
- [Wire Artifacts](pages/protocol-wire.md): minimum schemas, canonical records and public vectors.
- [Operator Profile](pages/protocol-operators.md): independent configuration and interoperability requirements.
- [SITLA Deployment](pages/sitla-operator.md): founding-operator values, not conformance requirements.
- [Commercial Model](pages/business-model.md): separate, informational business conditions.

The application repository builds these Markdown sources into static pages through `vp run docs:build`. Relative links between these documents work on GitHub and are rewritten to their published routes during the HTML build. Generated Markdown copies are available alongside the HTML so a working draft does not misrepresent an older Git commit as its current source. Commit this submodule and publish its revision before publishing a parent revision that depends on it.

The protocol specifications are **CC0-1.0**. Anyone may implement, adapt and redistribute them commercially without permission or attribution. See [licensing scope](LICENSING.md) and [full license](LICENSE-CC0-1.0.txt). Software, legal policies, operator conditions and brand assets are outside that dedication. Shared protocol identifiers remain fixed; deployment origins, authorities, operational policies and fees are operator-specific.

Implementation assets: [CC0 schemas and vectors](artifacts/v0.2/), [Apache-2.0 byte reference](reference/README.md), [trademark policy](TRADEMARKS.md), and [royalty-free specification patent grant](PATENTS.md).

The word “draft” describes technical maturity, not repository visibility or confidentiality. Hosting visibility is controlled separately by the repository owner. Publicly accessible copies may be reused under their stated licenses. Publishing this draft does not mean that all proposed service features are deployed. The terms/privacy documents are complete operator policies, not stub protocol examples; the application’s hardcoded `/commercial` disclosure is maintained outside this repository.

## Verify this repository independently

Use Node.js 26: `npm ci --ignore-scripts`, then `npm test` and `npm run secretlint`. For the independent Python verifier, use Python 3.12, install `tests/requirements.txt` in a virtual environment, and run `python tests/verify_vectors.py`. CI runs both implementations on pushes and pull requests without the application repository. The v0.2 fixture set covers request hashes, DID documents, replacement/revocation chains, signed approvals/service assertions and schema/semantic/signature rejection layers. Python also reproduces the frozen v0.1 DID/signature.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes, including its license allocation, contributor patent grant and sign-off requirements. A passing fixture suite is not a claim of a production wallet, complete standardization or full DIDComm interoperability.
