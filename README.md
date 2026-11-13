# Docs for SITLA

https://sitla.frourio.com

The English protocol set remains an unpublished v0.1 design draft:

- [Core](pages/protocol.md): identity, access, evidence and recovery.
- [Portability and Disaster](pages/protocol-portability.md): local operation, preparedness and degraded assurance.
- [Proof Packages](pages/protocol-packages.md): external specifications, artifact distribution and execution.
- [Marketplace](pages/protocol-marketplace.md): market-defined work and authorized payment handoffs.
- [Wire Artifacts](pages/protocol-wire.md): minimum schemas, canonical records and public vectors.
- [Operator Profile](pages/protocol-operators.md): independent configuration and interoperability requirements.
- [SITLA Deployment](pages/sitla-operator.md): founding-operator values, not conformance requirements.
- [Commercial Model](pages/commercial.md): separate, informational business conditions.

The application repository builds these Markdown sources into static pages through `vp run docs:build`. Relative links between these documents work on GitHub and are rewritten to their published routes during the HTML build. Generated Markdown copies are available alongside the HTML so a working draft does not misrepresent an older Git commit as its current source. Commit this submodule and publish its revision before publishing a parent revision that depends on it.

The protocol specifications are **CC0-1.0**. Anyone may implement, adapt and redistribute them commercially without permission or attribution. See [licensing scope](LICENSING.md) and [full license](LICENSE-CC0-1.0.txt). Software, legal policies, operator conditions and brand assets are outside that dedication. Shared protocol identifiers remain fixed; deployment origins, authorities, operational policies and fees are operator-specific.

Implementation assets: [CC0 schemas and vectors](artifacts/v0.1/), [Apache-2.0 byte reference](reference/README.md), [trademark policy](TRADEMARKS.md), and [royalty-free specification patent grant](PATENTS.md).
