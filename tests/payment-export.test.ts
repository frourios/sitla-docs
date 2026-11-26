// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {paymentSchemas} from "../reference/payments.ts";
import {verifyPaymentExport} from "../reference/payment-export.ts";
const fixture=JSON.parse(await readFile(new URL("../artifacts/payments-v2/sd-jwt-passkey-export.json",import.meta.url),"utf8"));
const schemas=await paymentSchemas();
const run=(bundle:any,key=fixture.acceptedOperatorKey,enrollment=fixture.trustedEnrollment)=>verifyPaymentExport(bundle,fixture.expectedOperator,key,fixture.approvalOperator,enrollment,schemas);
test("historical SD-JWT export authenticates manifest, disclosures and WebAuthn payment approval",async()=>{
 for(const item of fixture.positive)await assert.doesNotReject(()=>run(item.bundle),item.id);
 for(const item of fixture.negative)await assert.rejects(()=>run(item.bundle),item.id);
 await assert.rejects(()=>run(fixture.positive[0].bundle,{...fixture.acceptedOperatorKey,kid:"untrusted"}));
 await assert.rejects(()=>run(fixture.positive[0].bundle,fixture.acceptedOperatorKey,null));
});
