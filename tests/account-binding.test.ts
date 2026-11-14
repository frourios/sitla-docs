// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { validateAccountBindingSubject, validateAccountBindingTransition, validateAccountHandleSubject, validateHandleAccountBinding } from "../reference/account-id.ts";

const artifacts = new URL("../artifacts/", import.meta.url);
const load = async (name: string) => JSON.parse(await readFile(new URL(name, artifacts), "utf8"));
const accounts = await load("account-v1/examples.json");
const handles = await load("account-handle-v1/examples.json");
const legacy = await load("account-id-v1/examples.json");
const ajv = new Ajv2020({ strict: true });
const accountSchema = ajv.compile(await load("account-v1/subject.schema.json"));
const handleSchema = ajv.compile(await load("account-handle-v1/subject.schema.json"));

test("automatic account identity works without a custom handle", () => {
  for (const account of [accounts.before, accounts.after]) {
    assert.equal(accountSchema(account), true);
    validateAccountBindingSubject(account);
    assert.equal("handle" in account, false);
    assert.equal("handleUri" in account, false);
  }
  assert.equal(accounts.sharing.profileUrl, accounts.before.id);
  assert.equal(accounts.sharing.qrPayload, accounts.before.id);
  assert.notEqual(accounts.before.controllerDid, accounts.after.controllerDid);
  validateAccountBindingTransition(accounts.before, accounts.after);
});
test("optional handles can change or be removed while the base binding stays usable", () => {
  const account = accounts.after;
  for (const handle of [handles.assigned, handles.renamed]) {
    assert.equal(handleSchema(handle), true);
    validateAccountHandleSubject(handle);
    validateHandleAccountBinding(account, handle);
    assert.equal("controllerDid" in handle, false);
  }
  assert.notEqual(handles.assigned.handleUri, handles.renamed.handleUri);
  assert.equal(handles.afterRemoval.accountId, account.id);
  assert.equal(handles.afterRemoval.shareUrl, accounts.sharing.profileUrl);
  assert.equal(handles.afterRemoval.handleCredentialStatus, "revoked");
  assert.ok(handles.afterRemoval.assignmentVersion > handles.renamed.assignmentVersion);
  assert.equal(handleSchema(handles.afterRemoval), false); // Status example, not a new active handle VC.
  validateAccountBindingSubject(account);
});
test("display names and handle claims cannot silently become base identity fields", () => {
  assert.equal(accountSchema({ ...accounts.after, handle: "matsuda" }), false);
  assert.equal(accountSchema({ ...accounts.after, displayName: "松田" }), false);
  assert.equal(handleSchema({ ...handles.assigned, controllerDid: accounts.after.controllerDid }), false);
  assert.equal(accountSchema(legacy.after), false);
  assert.equal(handleSchema(legacy.after), false);
});
test("same handle in another operator namespace is not the same account", () => {
  const account = accounts.after;
  const other = { ...handles.assigned, namespace: "https://another.example", id: "https://another.example/accounts/pQ7m2gXn4aB8cD6eF1hJ9k", handleUri: "https://another.example/@matsuda" };
  assert.equal(handleSchema(other), true);
  validateAccountHandleSubject(other);
  assert.throws(() => validateHandleAccountBinding(account, other), /handle_account_mismatch/);
});
test("DID recovery preserves account identity and requires a new binding version", () => {
  assert.equal(accounts.before.id, accounts.after.id);
  assert.throws(() => validateAccountBindingTransition(accounts.after, accounts.before), /account_version_not_successor/);
  const moved = { ...accounts.after, namespace: "https://another.example", id: "https://another.example/accounts/pQ7m2gXn4aB8cD6eF1hJ9k", bindingVersion: accounts.before.bindingVersion + 1 };
  assert.equal(accountSchema(moved), true);
  assert.throws(() => validateAccountBindingTransition(accounts.before, moved), /account_identity_changed/);
});
test("canonical checks reject namespace substitutions and malformed optional names", () => {
  assert.throws(() => validateAccountBindingSubject({ ...accounts.after, namespace: "https://sitla.frourio.com/" }), /account_namespace_noncanonical/);
  assert.throws(() => validateAccountBindingSubject({ ...accounts.after, id: "https://another.example/accounts/pQ7m2gXn4aB8cD6eF1hJ9k" }), /account_reference_mismatch/);
  assert.throws(() => validateAccountHandleSubject({ ...handles.assigned, handle: "Matsuda" }), /account_handle_noncanonical/);
  assert.throws(() => validateAccountHandleSubject({ ...handles.assigned, handleUri: "https://sitla.frourio.com/@%6datsuda" }), /account_handle_uri_mismatch/);
});
