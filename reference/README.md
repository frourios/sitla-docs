# Byte-format reference

`codec.ts` is an offline Node.js reference for the v0.1 canonical JSON subset and DID derivation. It is **Apache-2.0**, including the [complete license](LICENSE). Copyright 2026 Frourio, Inc. The Apache patent grant covers only applicable contributor claims under that license; the separate [specification patent grant](../PATENTS.md) has its own scope.

This module does not validate JSON Schemas, implement policy, resolve issuer authority, manage private keys, verify every signature, or implement an authenticated service. Schema validation and semantic/cryptographic checks in [Wire Artifacts](../pages/protocol-wire.md) are mandatory in addition to these byte operations. Tests in the application repository consume fixed public vectors with Ajv 2020-12 and Node's independent native ML-DSA verifier. No secret/private key is distributed.

The specification, schemas and vectors are CC0-1.0; only this reference directory is Apache-2.0. Existing application software is not relicensed.

The source uses erasable TypeScript syntax only. A current Node.js runtime with built-in type stripping can import `./codec.ts` directly, without compilation or a separate declaration file. From the repository root, for example: `vp node --input-type=module -e 'import { canonical } from "./docs/reference/codec.ts"; console.log(canonical({ version: 1 }))'`. Type checking remains a separate build check.
