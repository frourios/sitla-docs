# Contributing

Contributions are welcome from independent implementers, operators, issuers and reviewers. No SITLA account, affiliation, fee or service subscription is required. This specification is a design draft; review compatibility and security claims against actual artifacts.

## Licenses by contribution type

By intentionally submitting a pull request, patch, specification text or other contribution for inclusion, you agree to the following terms for the parts you own or have authority to license:

- Specification prose, JSON Schemas, public test vectors and original data definitions listed in `LICENSING.md` are dedicated under **CC0-1.0**, including the waiver and public-license fallback in `LICENSE-CC0-1.0.txt`. No attribution requirement or additional copyright restriction may be attached to those contributions.
- New reference code and tests under `reference/` and `tests/` are contributed under **Apache-2.0**, including its contributor patent grant; preserve the SPDX notices and `reference/LICENSE`.
- Operator policies, legal terms, brand assets or third-party materials outside those scopes are not automatically relicensed. Identify their owner, provenance and applicable terms before proposing inclusion. Do not copy another service’s text, private data or implementation code without the necessary rights. Disclose any employer or other approval needed for your contribution.

The maintainer must retain provenance and the applicable sign-off with accepted contributions. Changes that cannot meet the applicable terms should not be merged. Maintainers may not silently move third-party code into the CC0 specification scope.

## Contributor specification patent grant

By submitting a contribution to the normative specification, you grant every person and organization a worldwide, perpetual, non-exclusive, royalty-free patent license to make, have made, use, offer to sell, sell, import and otherwise implement the normative requirements of the SITLA Protocol version to which you contribute. The grant covers patent claims you own or control that are necessarily infringed by your contribution alone or in combination with the normative requirements of that version. It covers independent, competing and commercial implementations, without registration, attribution, fees or use of a particular service, and survives withdrawal or later changes of that version.

The scope and defensive termination follow `PATENTS.md`: if a recipient initiates patent litigation alleging that an implementation of those normative requirements infringes a patent, this contributor patent license to that recipient terminates at filing. This grant does not license third-party claims, unrelated additions or trademarks, and does not change CC0. It is not a statement that a patent search was performed or a warranty of non-infringement. The Apache-2.0 terms separately apply to reference/test-code contributions.

## Sign-off and review

Include `Signed-off-by: Your Name <your-contact-address>` in each contribution commit, or provide the same explicit sign-off in a submitted patch. It certifies that you wrote the contribution or have the right to submit it, have the necessary authority to make the copyright and patent grants above, and understand that your contribution and its sign-off may be retained publicly with the project’s history. Do not sign on another person’s behalf. This is the project’s submission certification; no separate CLA or central operator approval is needed to implement the protocol.

Before submitting, run `npm ci --ignore-scripts`, `npm test`, `npm run test:mutation`, `npm run secretlint`, and the independent Python verifier after installing `tests/requirements.txt`. Describe the requirement IDs affected, wire compatibility, expected acceptance/rejection stage and any changed privacy or authority boundary. Include positive and adversarial fixtures. Schema validation alone never establishes signature validity or business authorization.

Do not edit archived v0.1 artifact bytes to make a new implementation pass. New incompatible encodings, algorithms or signature domains need a declared version/profile and new vectors. Never submit real credentials, private keys, tokens, personal recovery records or witness data. Public fixture keys must be generated for tests, and private signing material must not be committed.

Pull-request CI checks every PR commit for an actual Signed-off-by trailer matching its author, not a mention embedded in message body. See [RELEASING.md](RELEASING.md) for the required patent-version and wire-profile review before a new document release.

CI installs Python verification dependencies from `tests/requirements.lock` with `--require-hashes --only-binary=:all:`. The lock includes official PyPI wheel hashes for every pinned dependency; `tests/requirements.txt` is the readable version list. Regenerate and review hashes when changing dependency versions.
