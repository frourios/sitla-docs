// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { validateAccountIdentifierSubject, validateAccountIdentifierTransition } from "../reference/account-id.ts";

const root = new URL("../artifacts/account-id-v1/", import.meta.url);
const schema = JSON.parse(await readFile(new URL("subject.schema.json", root), "utf8"));
const examples = JSON.parse(await readFile(new URL("examples.json", root), "utf8"));
const validate = new Ajv2020({ strict: true }).compile(schema);

test("one public account and handle survive a DID change", () => {
  for (const subject of [examples.before, examples.after]) {
    assert.equal(validate(subject), true);
    validateAccountIdentifierSubject(subject);
  }
  assert.notEqual(examples.before.controllerDid, examples.after.controllerDid);
  assert.equal(examples.before.id, examples.after.id);
  assert.equal(examples.before.handleUri, examples.after.handleUri);
  validateAccountIdentifierTransition(examples.before, examples.after);
});
test("canonical namespace distinguishes the same handle at independent operators", () => {
  const subject = examples.after;
  const other = { ...subject, namespace: "https://another.example", id: subject.id.replace(subject.namespace, "https://another.example"), handleUri: "https://another.example/@matsuda" };
  assert.equal(validate(other), true);
  validateAccountIdentifierSubject(other);
  assert.notEqual(subject.handleUri, other.handleUri);
  assert.throws(() => validateAccountIdentifierTransition(subject, { ...other, bindingVersion: subject.bindingVersion + 1 }), /account_identity_changed/);
});
test("a renamed handle keeps its account reference and advances the issuer version", () => {
  const previous = examples.after;
  const next = { ...previous, handle: "matsuda-new", handleUri: `${previous.namespace}/@matsuda-new`, bindingVersion: previous.bindingVersion + 1 };
  assert.equal(validate(next), true);
  validateAccountIdentifierTransition(previous, next);
  assert.throws(() => validateAccountIdentifierTransition(previous, { ...next, bindingVersion: previous.bindingVersion }), /account_version_not_successor/);
});
test("rejects cross-namespace substitution and ambiguous handle encodings", () => {
  const subject = examples.after;
  assert.throws(() => validateAccountIdentifierSubject({ ...subject, namespace: "https://another.example" }), /account_handle_uri_mismatch/);
  assert.throws(() => validateAccountIdentifierSubject({ ...subject, namespace: subject.namespace + "/" }), /account_namespace_noncanonical/);
  assert.throws(() => validateAccountIdentifierSubject({ ...subject, handle: "Matsuda" }), /account_handle_noncanonical/);
  assert.throws(() => validateAccountIdentifierSubject({ ...subject, handleUri: subject.namespace + "/@%6datsuda" }), /account_handle_uri_mismatch/);
  assert.equal(validate({ ...subject, controllerDid: "@sitla/matsuda" }), false);
});
