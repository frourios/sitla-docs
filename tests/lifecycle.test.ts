// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import assert from "node:assert/strict";
import { createPublicKey } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { canonical, sha256 } from "../reference/codec.ts";
import { lifecycleSignatureValid, validateLifecycleReceipt, validateLifecycleRequest } from "../reference/lifecycle.ts";

const root = new URL("../artifacts/lifecycle-v1/", import.meta.url);
const fixture = JSON.parse(await readFile(new URL("examples.json", root), "utf8"));
const policy = await readFile(new URL(fixture.policy.path, root));
const publicKey = createPublicKey({ key: fixture.verification_key, format: "jwk" });
const ajv = new Ajv2020({ strict: true, allErrors: true });
const schemas = new Map();
for (const name of ["request", "receipt", "signed-receipt"]) schemas.set(name, ajv.compile(JSON.parse(await readFile(new URL(`${name}.schema.json`, root), "utf8"))));
const selected = (id: string) => fixture.cases.find(item => item.id === id);

for (const item of fixture.cases) test(`lifecycle fixture: ${item.id}`, () => {
  assert.equal(policy.toString("utf8"), fixture.policy.bytes_utf8);
  assert.equal(sha256(policy), fixture.policy.digest);
  assert.equal(schemas.get("request")(item.request), true);
  assert.equal(schemas.get("receipt")(item.receipt), true, JSON.stringify(schemas.get("receipt").errors));
  assert.equal(schemas.get("signed-receipt")(item.signed_receipt), true);
  assert.equal(canonical(item.request), item.canonical_request_utf8);
  assert.equal(canonical(item.receipt), item.canonical_receipt_utf8);
  validateLifecycleRequest(item.request, { ...item.context, policyBytes: policy });
  validateLifecycleReceipt(item.request, item.receipt);
  assert.equal(lifecycleSignatureValid(item.signed_receipt, fixture.key_id, publicKey), true);
});

test("scope schemas prevent logout from deleting an account or silently revoking mandates", () => {
  const item = selected("logout-completed");
  assert.equal(schemas.get("receipt")({ ...item.receipt, account_state: "deleted" }), false);
  assert.equal(schemas.get("receipt")({ ...item.receipt, mandate_scope: "all-owned-and-descendants" }), false);
  const all = selected("logout-all-completed");
  assert.equal(schemas.get("receipt")({ ...all.receipt, session_scope: "current-family" }), false);
  assert.equal(schemas.get("receipt")({ ...item.receipt, state: "processing", completed_at: null }), false);
});
test("a delete acknowledgement is not completion or unrestricted continued access", () => {
  const item = selected("delete-account-accepted");
  assert.equal(schemas.get("receipt")({ ...item.receipt, account_state: "active" }), false);
  assert.equal(schemas.get("receipt")({ ...item.receipt, credential_scope: "unchanged" }), false);
  assert.equal(schemas.get("receipt")({ ...item.receipt, mandate_scope: "none" }), false);
  assert.equal(schemas.get("receipt")({ ...item.receipt, state: "completed" }), false);
  const complete = selected("delete-account-completed");
  assert.equal(schemas.get("receipt")({ ...complete.receipt, credential_scope: "suspended" }), false);
  assert.ok(complete.receipt.retained_records.length > 0);
  assert.ok(Date.parse(complete.receipt.completed_at) > Date.parse(complete.request.expires_at));
});
test("retention exceptions need a reason and a deadline or determination rule", () => {
  const item = selected("delete-account-completed");
  const retained = item.receipt.retained_records[0];
  assert.equal(schemas.get("receipt")({ ...item.receipt, retained_records: [{ ...retained, retention_until: null, retention_criteria: null }] }), false);
  assert.equal(schemas.get("receipt")({ ...item.receipt, retained_records: [{ ...retained, basis: "" }] }), false);
});
test("single-target revocation cannot silently become a wildcard or another operation", () => {
  const item = selected("revoke-mandate-completed");
  assert.equal(schemas.get("request")({ ...item.request, mandate_id: null }), false);
  assert.equal(schemas.get("request")({ ...item.request, operation: "logout" }), false);
  assert.throws(() => validateLifecycleRequest({ ...item.request, mandate_id: "*" }, { ...item.context, policyBytes: policy }), /lifecycle_target_invalid/);
  assert.throws(() => validateLifecycleReceipt({ ...item.request, mandate_id: "urn:example:mandate:other" }, item.receipt), /lifecycle_receipt_binding_failed/);
});
test("host binding, epochs, policy and request lifetime are independent from caller JSON", () => {
  const item = selected("logout-all-completed");
  const context = { ...item.context, policyBytes: policy };
  assert.throws(() => validateLifecycleRequest(item.request, { ...context, accountId: "https://operator.example/accounts/another" }), /lifecycle_target_mismatch/);
  assert.throws(() => validateLifecycleRequest(item.request, { ...context, sessionEpoch: 8 }), /lifecycle_epoch_mismatch/);
  assert.throws(() => validateLifecycleRequest(item.request, { ...context, recoveryEpoch: 3 }), /lifecycle_epoch_mismatch/);
  assert.throws(() => validateLifecycleRequest(item.request, { ...context, now: item.request.expires_at }), /lifecycle_request_expired/);
  assert.throws(() => validateLifecycleRequest(item.request, { ...context, policyBytes: Buffer.from("different policy") }), /lifecycle_policy_mismatch/);
  assert.throws(() => validateLifecycleReceipt(item.request, { ...item.receipt, session_epoch: item.request.session_epoch }), /lifecycle_epoch_not_advanced/);
});
test("receipts cannot substitute a request, time or bearer status URL", () => {
  const item = selected("delete-account-accepted");
  assert.throws(() => validateLifecycleReceipt(item.request, { ...item.receipt, request_digest: "0".repeat(64) }), /lifecycle_receipt_binding_failed/);
  assert.throws(() => validateLifecycleReceipt(item.request, { ...item.receipt, effective_at: item.request.expires_at }), /lifecycle_receipt_time_invalid/);
  assert.throws(() => validateLifecycleReceipt(item.request, { ...item.receipt, status_ref: "https://other.example/case" }), /lifecycle_status_origin_mismatch/);
  assert.throws(() => validateLifecycleReceipt(item.request, { ...item.receipt, status_ref: "https://operator.example/case?token=secret" }), /lifecycle_status_ref_invalid/);
  const current = selected("logout-completed");
  assert.throws(() => validateLifecycleReceipt(current.request, { ...current.receipt, session_epoch: current.receipt.session_epoch + 1 }), /lifecycle_unrelated_epoch_change/);
});
test("operator signature covers receipt scopes, domain and accepted signing key", () => {
  const item = selected("logout-completed");
  const changed = structuredClone(item.signed_receipt);
  changed.payload.session_scope = "all-families";
  assert.equal(lifecycleSignatureValid(changed, fixture.key_id, publicKey), false);
  assert.equal(lifecycleSignatureValid(item.signed_receipt, "https://other.example/key", publicKey), false);
  const wrongDomain = structuredClone(item.signed_receipt);
  wrongDomain.payload.domain = "SITLA/service/1";
  assert.equal(lifecycleSignatureValid(wrongDomain, fixture.key_id, publicKey), false);
});
