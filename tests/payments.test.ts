// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { paymentSchemas, verifyPaymentCredential, verifyPaymentApproval, verifyPaymentHistory, verifyPaymentBundle } from "../reference/payments.ts";
const vectors = JSON.parse(await readFile(new URL("../artifacts/payments-v1/vectors/payments.json", import.meta.url), "utf8"));
const schemas = await paymentSchemas();
function verify(item: any) {
  const subject = verifyPaymentCredential(item.record, vectors.acceptedKeys, vectors.expectedIssuer, schemas);
  if (subject.approval) verifyPaymentApproval(subject, item.evidence, schemas, vectors.expectedIssuer);
  if (subject.profile === "sitla-online-payment-event/1") verifyPaymentHistory(subject, item.previousRecord);
}
test("public payment schemas, operator JWS, root-authorized holder approvals and historical event chains", () => {
  for (const item of vectors.positive) assert.doesNotThrow(() => verify(item), item.id);
  for (const item of vectors.negative) assert.throws(() => verify(item), { message: item.error }, item.id);
});
test("payment issuer keys and expected operator come from verifier trust policy", () => {
  const record = vectors.positive[0].record;
  assert.throws(() => verifyPaymentCredential(record, {}, vectors.expectedIssuer, schemas), /payment_issuer_key/);
  assert.throws(() => verifyPaymentCredential(record, vectors.acceptedKeys, "https://other.example", schemas), /payment_issuer/);
});

test("signed evidence pages bind records, attachments, keys and metadata without trusting embedded keys", () => {
  for (const bundle of vectors.bundles.positive) assert.doesNotThrow(() => verifyPaymentBundle(bundle, vectors.acceptedKeys, vectors.expectedIssuer, schemas));
  for (const item of vectors.bundles.negative) assert.throws(() => verifyPaymentBundle(item.value, vectors.acceptedKeys, vectors.expectedIssuer, schemas), { message: item.error }, item.id);
  assert.throws(() => verifyPaymentBundle(vectors.bundles.positive[0], {}, vectors.expectedIssuer, schemas), /bundle_issuer_key/);
});

test("supplemental WebAuthn payment attachment requires independently trusted enrollment and binds the payment amount", async () => {
  const fixture = JSON.parse(await readFile(new URL("../artifacts/payments-v2/passkey-settlement.json", import.meta.url),"utf8"));
  function verifyPasskey(item: any, registered = fixture.trustedEnrollment) {
    const subject = verifyPaymentCredential(item.record,fixture.acceptedKeys,fixture.expectedIssuer,schemas);
    verifyPaymentApproval(subject,item.evidence,schemas,fixture.expectedIssuer,registered);
  }
  for (const item of fixture.positive) assert.doesNotThrow(()=>verifyPasskey(item));
  for (const item of fixture.negative) assert.throws(()=>verifyPasskey(item),{message:item.error});
  const original = fixture.positive[0], subject = verifyPaymentCredential(original.record,fixture.acceptedKeys,fixture.expectedIssuer,schemas);
  assert.throws(()=>verifyPaymentApproval(subject,original.evidence,schemas,fixture.expectedIssuer),/payment_passkey_enrollment/);
});
