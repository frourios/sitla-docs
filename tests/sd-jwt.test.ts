// SPDX-License-Identifier: Apache-2.0
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifySDJWT } from "../reference/sd-jwt.ts";
const vectors = JSON.parse(readFileSync(new URL("../artifacts/circulation-v1/vectors.json",import.meta.url),"utf8"));
test("circulation subset reproduces original issuer signatures and selective claim values",async()=>{
 for (const item of vectors.positive) {
   const result = await verifySDJWT(item.secured,vectors.publicKey);
   assert.deepEqual(result.payload.credentialSubject.claims,item.claims,item.id);
 }
 for (const item of vectors.negative) await assert.rejects(()=>verifySDJWT(item.secured,vectors.publicKey),item.id);
});
