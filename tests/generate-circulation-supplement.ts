// SPDX-License-Identifier: Apache-2.0
// Manual generation of nonpersonal interoperability fixtures. Only the public key is retained.
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { writeFile } from "node:fs/promises";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const kid = "did:example:fixture#key";
const key = { ...publicKey.export({ format: "jwk" }), kid };
const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const hash = (value: string) => createHash("sha256").update(value).digest("base64url");
const disclosure = b64(["fixture-salt-000000000000000000000001", "links", ["https://example.com/portfolio"]]);
const header = { alg: "EdDSA", kid, typ: "dc+sd-jwt" };
const payload = {
  iss: "did:example:fixture", sub: "did:example:fixture", vct: "urn:example:references:1",
  jti: "urn:example:fixture-1", iat: 1790000000, _sd_alg: "sha-256",
  credentialSubject: { id: "did:example:fixture", claims: { _sd: [hash(disclosure)] } },
};
function secured(h = header, body = payload, parts = [disclosure]) {
  const input = b64(h) + "." + b64(body);
  return input + "." + sign(null, Buffer.from(input), privateKey).toString("base64url") + "~" + parts.map((part) => part + "~").join("");
}
const valid = secured();
const withClaims = (claims: Record<string, unknown>) => ({ ...payload, credentialSubject: { ...payload.credentialSubject, claims } });
const negative = [
  { id: "padded-disclosure", secured: secured(header, payload, [disclosure + "="]) },
  { id: "missing-terminator", secured: valid.slice(0, -1) },
  { id: "repeated-disclosure", secured: secured(header, payload, [disclosure, disclosure]) },
  { id: "repeated-digest", secured: secured(header, withClaims({ _sd: [hash(disclosure), hash(disclosure)] })) },
  { id: "invalid-digest-length", secured: secured(header, withClaims({ _sd: ["abc"] }), []) },
  { id: "claim-collision", secured: secured(header, withClaims({ links: ["https://example.com/other"], _sd: [hash(disclosure)] })) },
  { id: "unsupported-key-metadata", secured: secured({ ...header, jwk: key }) },
  { id: "unsupported-key-reference", secured: secured({ ...header, jku: "https://example.invalid/keys" }) },
  { id: "unsupported-certificate-reference", secured: secured({ ...header, x5u: "https://example.invalid/certificate" }) },
  { id: "unsupported-critical-header", secured: secured({ ...header, crit: ["fixture"] }) },
  { id: "unsupported-disclosure-algorithm", secured: secured(header, { ...payload, _sd_alg: "sha-512" }) },
];
await writeFile(new URL("../artifacts/circulation-v1/supplemental-vectors.json", import.meta.url), JSON.stringify({
  profile: "SITLA-sd-jwt/1", scope: "Nonpersonal supplemental parser and issuer metadata validation; historical original vectors unchanged.",
  publicKey: key,
  positive: [{ id: "trust-reference-array", secured: valid, claims: { links: ["https://example.com/portfolio"] } }],
  negative,
}, null, 2) + "\n");
