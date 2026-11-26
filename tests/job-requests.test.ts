// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {validateJobRequestClaims,projectJobRequest} from "../reference/job-requests.ts";
const vectors=JSON.parse(await readFile(new URL("../artifacts/job-requests-v1/vectors.json",import.meta.url),"utf8"));
// Same unsigned bytes as the independent Python verifier; no issuer trust claim.
test("shared job-request vectors preserve complete originals and index only allowed fields",()=>{
 for(const item of vectors.positive){
  const before=JSON.stringify(item.vc),now=Date.parse(item.now??vectors.now);
  assert.doesNotThrow(()=>validateJobRequestClaims(item.vc,now),item.id);
  assert.deepEqual(projectJobRequest(item.vc,now),item.projection,item.id);
  assert.equal(JSON.stringify(item.vc),before,item.id);
  assert.doesNotMatch(JSON.stringify(item.projection),/original-only/,item.id);
 }
});
test("shared request negatives reject ambiguous money, unsupported units, policy and time failures",()=>{
 for(const item of vectors.negative)assert.throws(()=>validateJobRequestClaims(item.vc,Date.parse(item.now??vectors.now)),(error:any)=>error.message.startsWith(item.error),item.id);
});
test("shared altered projections are distinguishable from the original-derived allowlist",()=>{
 const original=vectors.positive[0].vc,derived=projectJobRequest(original,Date.parse(vectors.now));
 for(const item of vectors.negativeProjections)assert.notDeepEqual(item.projection,derived,item.id);
});
