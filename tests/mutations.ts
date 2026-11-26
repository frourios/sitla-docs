// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
// Targeted guard-removal tests, not a claim of exhaustive mutation coverage.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type Mutation = { name: string; file: string; from: string; to: string };
const mutations: Mutation[] = [];
for (const error of ["series_scope_changed", "invalid_chain", "invalid_chain_time", "evidence_digest_mismatch", "data_digest_mismatch", "operator_key_unknown", "policy_digest_mismatch", "approval_authority_scope"])
  mutations.push({ name: error, file: "codec.ts", from: `throw new Error("${error}")`, to: "void 0" });
mutations.push({ name: "sequence_conflict", file: "codec.ts", from: 'throw new Error("sequence_conflict")', to: "return" });
mutations.push({ name: "approval_actor", file: "codec.ts", from: ' || payload.actor !== authority.root', to: '' });
mutations.push({ name: "approval_grant_digest", file: "codec.ts", from: 'payload.key_authorization_digest !== sha256(canonical(grant)) || ', to: '' });
mutations.push({ name: "approval_assertion_role", file: "codec.ts", from: 'key.role !== "assertion" || ', to: '' });
for (const field of ["request_id", "operator_id", "audience", "purpose", "challenge"])
  mutations.push({ name: `request_${field}`, file: "codec.ts", from: 'if (payload[field] !== request[field])', to: `if (field !== "${field}" && payload[field] !== request[field])` });
mutations.push({ name: "request_digest", file: "codec.ts", from: 'if (payload.request_digest !== sha256(canonical(request)))', to: 'if (false)' });
mutations.push({ name: "request_expiry_bound", file: "codec.ts", from: 'parseTime(payload.expires_at) > parseTime(request.expires_at) || ', to: '' });
mutations.push({ name: "request_issue_bound", file: "codec.ts", from: ' || parseTime(payload.issued_at) < parseTime(request.issued_at)', to: '' });
mutations.push({ name: "artifact_expiry", file: "codec.ts", from: 'if (now >= parseTime(payload.expires_at))', to: 'if (false)' });
for (const error of ["webauthn_type", "webauthn_origin_missing", "webauthn_origin", "webauthn_cross_origin", "webauthn_challenge", "webauthn_rp_id", "webauthn_flags", "webauthn_counter", "webauthn_user_handle", "webauthn_authority"])
  mutations.push({ name: error, file: "webauthn.ts", from: `throw new Error("${error}")`, to: "void 0" });
mutations.push({ name: "webauthn_signature", file: "webauthn.ts", from: 'return verify(', to: 'return true || verify(' });

const reference = new URL("../reference/", import.meta.url);
const directory = new URL("../artifacts/wire-v1/", import.meta.url);
const temporary = await mkdtemp(join(tmpdir(), "sitla-wire-mutants-"));
try {
  for (const file of ["codec.ts", "webauthn.ts", "conformance.ts"])
    await cp(new URL(file, reference), join(temporary, file));
  await symlink(fileURLToPath(new URL("../node_modules", import.meta.url)), join(temporary, "node_modules"), "dir");
  const program = `import { verifyVectors } from ${JSON.stringify(pathToFileURL(join(temporary, "conformance.ts")).href)}; await verifyVectors(new URL(${JSON.stringify(directory.href)})); await verifyVectors(new URL(${JSON.stringify(directory.href)}), "passkey-synced.json");`;
  execFileSync(process.execPath, ["--input-type=module", "-e", program], { timeout: 10000, stdio: "pipe" });
  for (const mutation of mutations) {
    const original = await readFile(new URL(mutation.file, reference), "utf8");
    assert.ok(original.includes(mutation.from), `Missing mutation target: ${mutation.name}`);
    await writeFile(join(temporary, mutation.file), original.replace(mutation.from, mutation.to));
    // A syntax/import failure is not a killed security mutation.
    execFileSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(join(temporary, mutation.file)).href)})`], { timeout: 10000, stdio: "pipe" });
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", program], { timeout: 10000, encoding: "utf8" });
    assert.equal(result.status, 1, `Surviving mutation: ${mutation.name}\n${result.stderr}`);
    assert.match(result.stderr, /AssertionError/, `Mutation failed outside an expected test assertion: ${mutation.name}\n${result.stderr}`);
    await writeFile(join(temporary, mutation.file), original);
  }
  // Run the public payment and circulation tests against isolated copies, never deployed code.
  const supplemental = [
    { file: "payment-export.ts", test: "payment-export.test.ts", name: "export-manifest-signature", from: "check(verify(null,Buffer.from(parts[0]+\".\"+parts[1]),createPublicKey({key,format:\"jwk\"}),decodeBase64url(parts[2])));", to: "void 0;" },
    { file: "payments.ts", test: "payments.test.ts", name: "payment-amount-reconciliation", from: 'check(subject.platformFeeMinor + subject.sellerNetMinor === subject.originalGrossMinor, "event_amounts")', to: 'void 0' },
    { file: "payments.ts", test: "payments.test.ts", name: "payment-inspection-consistency", from: 'check(subject.inspection.performanceDigest === subject.instruction.performanceDigest, "inspection_digest")', to: 'void 0' },
    { file: "payments.ts", test: "payments.test.ts", name: "payment-attachment-integrity", from: 'check(subject.approval.evidenceDigest === paymentDigest(evidence), "payment_approval_digest")', to: 'void 0' },
    { file: "sd-jwt.ts", test: "sd-jwt.test.ts", name: "circulation-duplicate-disclosure", from: 'disclosed.has(key) ||', to: '' },
    { file: "sd-jwt.ts", test: "sd-jwt.test.ts", name: "circulation-key-reference-policy", from: 'header.jku ||', to: '' },
    { file: "sd-jwt.ts", test: "sd-jwt.test.ts", name: "circulation-unreferenced-disclosure", from: 'if (used.size !== disclosed.size) fail("sd_jwt_unreferenced_disclosure");', to: 'void 0;' },
  ];
  await mkdir(join(temporary, "reference"));
  await mkdir(join(temporary, "tests"));
  for (const file of ["codec.ts", "payments.ts", "sd-jwt.ts", "webauthn.ts", "payment-export.ts"])
    await cp(new URL(file, reference), join(temporary, "reference", file));
  await symlink(fileURLToPath(new URL("../artifacts", import.meta.url)), join(temporary, "artifacts"), "dir");
  for (const test of ["payments.test.ts", "sd-jwt.test.ts", "payment-export.test.ts"]) {
    await cp(new URL(test, import.meta.url), join(temporary, "tests", test));
    execFileSync(process.execPath, ["--test", join(temporary, "tests", test)], { timeout: 20000, stdio: "pipe" });
  }
  for (const mutation of supplemental) {
    const original = await readFile(new URL(mutation.file, reference), "utf8");
    assert.ok(original.includes(mutation.from), `Missing mutation target: ${mutation.name}`);
    const target = join(temporary, "reference", mutation.file);
    await writeFile(target, original.replace(mutation.from, mutation.to));
    execFileSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(target).href)})`], { timeout: 10000, stdio: "pipe" });
    const result = spawnSync(process.execPath, ["--test", join(temporary, "tests", mutation.test)], { timeout: 20000, encoding: "utf8" });
    assert.equal(result.status, 1, `Surviving mutation: ${mutation.name}
${result.stdout}
${result.stderr}`);
    assert.match(result.stdout + result.stderr, /AssertionError/, `Mutation failed outside test assertion: ${mutation.name}`);
    await writeFile(target, original);
  }
  console.log(`All ${mutations.length + supplemental.length} targeted security mutations were detected.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
