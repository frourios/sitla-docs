// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import assert from "node:assert/strict";
import { createPublicKey, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import { base64urlBytes, canonical, deriveDid, parseCanonical, sha256, validateSemantics, type IdentityDescriptor, ROOT_CONTEXT } from "./codec.ts";

import { validateWebAuthnApproval, webauthnSignatureValid, type RegisteredCredential } from "./webauthn.ts";

type Value = Record<string, unknown>;
export interface Fixture {
  id: string; schema: string; value: Value; canonical_utf8?: string; wire_sha256?: string;
  expected_did?: string; request_ref?: string; previous_ref?: string; evidence_ref?: string;
  authorization_ref?: string; stage?: string; error?: string; signature_valid?: boolean; crypto_key_ref?: string; data_ref?: string; now?: string;
}
export interface Vectors {
  descriptor: IdentityDescriptor; verification_keys: Record<string, { kty: "OKP"; crv: "Ed25519"; x: string }>;
  policy: { path: string; bytes_utf8: string; digest: string };
  data_assets: Record<string, { bytes_utf8: string }>;
  webauthn_credentials: Record<string, RegisteredCredential>;
  positive: Fixture[]; negative: Fixture[]; invalid_wire: { id: string; utf8: string }[];
}
export function signatureValid(fixture: Fixture, vectors: Vectors, overrideContext?: string): boolean {
  const value = fixture.value;
  if (fixture.schema === "passkey-approved-action") {
    const credential = vectors.webauthn_credentials[(value.proof as Value).credential_id as string];
    return !!credential && webauthnSignatureValid(value, credential);
  }
  const payload = value.payload as Value, signature = value.signature as Value;
  if (fixture.schema === "operational-key-authorization") {
    const jwk = { kty: "AKP", alg: "ML-DSA-44", pub: vectors.descriptor.identityPublicKey };
    return verify(null, Buffer.from(canonical(payload)), {
      key: createPublicKey({ key: jwk, format: "jwk" }),
      context: Buffer.from(overrideContext ?? ROOT_CONTEXT),
    }, base64urlBytes(signature.value as string, 2420));
  }
  const jwk = vectors.verification_keys[fixture.crypto_key_ref ?? signature.key_id as string];
  if (!jwk || signature.suite !== "Ed25519") return false;
  return verify(null, Buffer.from(canonical(payload)), createPublicKey({ key: jwk, format: "jwk" }), base64urlBytes(signature.value as string, 64));
}
export async function verifyVectors(directory = new URL("../artifacts/wire-v1/", import.meta.url)) {
  const vectors: Vectors = JSON.parse(await readFile(new URL("vectors/core.json", directory), "utf8"));
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  const names = ["identity-descriptor", "did-document", "operational-key-authorization", "request-evidence", "evidence-envelope", "approved-action", "service-assertion", "passkey-approved-action"];
  const schemas = new Map();
  for (const name of names) {
    const schema = JSON.parse(await readFile(new URL(`schemas/${name}.schema.json`, directory), "utf8"));
    schemas.set(name, ajv.compile(schema));
  }
  const policyBytes = await readFile(new URL(vectors.policy.path, directory));
  assert.equal(policyBytes.toString("utf8"), vectors.policy.bytes_utf8);
  assert.equal(sha256(policyBytes), vectors.policy.digest);
  const byId = new Map(vectors.positive.map(item => [item.id, item]));
  const context = (fixture: Fixture) => ({
    descriptor: vectors.descriptor,
    request: fixture.request_ref ? byId.get(fixture.request_ref)?.value : undefined,
    previous: fixture.previous_ref ? byId.get(fixture.previous_ref)?.value : undefined,
    evidence: fixture.evidence_ref ? byId.get(fixture.evidence_ref)?.value : undefined,
    authorization: fixture.authorization_ref ? byId.get(fixture.authorization_ref)?.value : undefined,
    dataBytes: fixture.data_ref ? Buffer.from(vectors.data_assets[fixture.data_ref].bytes_utf8) : undefined,
    policyBytes: ((fixture.value.payload ?? fixture.value) as Value).policy_digest !== undefined ? policyBytes : undefined,
    now: fixture.now,
    verificationKeys: vectors.verification_keys,
  });
  function semantics(fixture: Fixture) {
    const selected = context(fixture);
    validateSemantics(fixture.schema, fixture.value, selected);
    if (fixture.schema === "passkey-approved-action") {
      const credential = vectors.webauthn_credentials[(fixture.value.proof as Value).credential_id as string];
      if (!credential) throw new Error("webauthn_credential");
      validateWebAuthnApproval(fixture.value, credential, selected.authorization);
    }
  }
  for (const fixture of vectors.positive) {
    assert.equal(schemas.get(fixture.schema)(fixture.value), true, `${fixture.id}: schema`);
    assert.equal(canonical(fixture.value), fixture.canonical_utf8, `${fixture.id}: canonical`);
    assert.equal(sha256(canonical(fixture.value)), fixture.wire_sha256, `${fixture.id}: digest`);
    assert.deepEqual(parseCanonical(Buffer.from(fixture.canonical_utf8!)), fixture.value);
    semantics(fixture);
    if (fixture.expected_did) assert.equal(deriveDid(vectors.descriptor), fixture.expected_did);
    if (fixture.value.signature || fixture.value.proof) assert.equal(signatureValid(fixture, vectors), true, `${fixture.id}: signature`);
    if (fixture.evidence_ref) assert.equal(fixture.value.evidence_digest, sha256(canonical(byId.get(fixture.evidence_ref)!.value)));

  }
  for (const fixture of vectors.negative) {
    const shape = schemas.get(fixture.schema)(fixture.value);
    if (fixture.signature_valid !== undefined) assert.equal(signatureValid(fixture, vectors), fixture.signature_valid, `${fixture.id}: independent signature expectation`);
    if (fixture.stage === "schema") assert.equal(shape, false, `${fixture.id}: schema rejection`);
    else {
      assert.equal(shape, true, `${fixture.id}: shape must pass`);
      if (fixture.stage === "signature") assert.equal(signatureValid(fixture, vectors), false);
      else assert.throws(() => semantics(fixture), new RegExp(fixture.error!), `${fixture.id}: semantic rejection`);
    }
  }
  for (const fixture of vectors.invalid_wire) assert.throws(() => parseCanonical(Buffer.from(fixture.utf8)), fixture.id);
  const rootFixture = byId.get("authorization-initial")!;
  assert.equal(signatureValid(rootFixture, vectors, ""), false);
  assert.equal(signatureValid(rootFixture, vectors, "SITLA/0.1/root"), false);
  assert.equal(signatureValid(rootFixture, vectors, "SITLA/0.2/root"), false);
  assert.equal(signatureValid(rootFixture, vectors, "SITLA/continuity/1"), false);
  return { schemas: names.length, positive: vectors.positive.length, negative: vectors.negative.length, invalidWire: vectors.invalid_wire.length };
}
