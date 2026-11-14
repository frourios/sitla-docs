// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import assert from "node:assert/strict";
import test from "node:test";
import { canonical, didDocument, parseCanonical, parseJsonStrict, parseTime, REFERENCE_LIMITS } from "../reference/codec.ts";
import { readFile } from "node:fs/promises";
import { verifyVectors } from "../reference/conformance.ts";

test("wire/1 schemas, canonical records, signatures, chains and rejection layers", async () => {
  console.log(await verifyVectors());
});
test("reference parser enforces byte/nesting budgets and strict calendar dates", () => {
  assert.throws(() => parseCanonical(Buffer.alloc(REFERENCE_LIMITS.maxBytes + 1)), /resource_limit/);
  assert.throws(() => parseCanonical(Buffer.from("[".repeat(33) + "0" + "]".repeat(33))), /resource_limit/);
  assert.throws(() => canonical({ value: "x".repeat(REFERENCE_LIMITS.maxBytes) }), /resource_limit/);
  assert.throws(() => parseTime("2026-02-30T00:00:00Z"), /invalid_time/);
  assert.throws(() => parseTime("2026-02-29T00:00:00Z"), /invalid_time/);
  assert.throws(() => parseTime("0000-01-01T00:00:00Z"), /invalid_time/);
  assert.equal(parseTime("2024-02-29T00:00:00Z"), Date.parse("2024-02-29T00:00:00Z"));
});

test("DID representation is JSON-only and editorial revisions preserve old root IDs", async () => {
  const legacy = JSON.parse(await readFile(new URL("../artifacts/v0.2/vectors/core.json", import.meta.url), "utf8"));
  const descriptor = legacy.descriptor;
  assert.equal(didDocument(descriptor).id, legacy.positive.find(item => item.expected_did).expected_did);
  assert.throws(() => didDocument(descriptor, "application/did+ld+json"), /representation_not_supported/);
  assert.throws(() => parseJsonStrict(Buffer.from('{"outer":{"a":1,"a":2}}')), /duplicate_property/);
  assert.deepEqual(parseJsonStrict(Buffer.from(' { "origin": "https://example.org" } ')), { origin: "https://example.org" });
});
