// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile} from "node:fs/promises";
import {verifyHistory,observePublicHistory,historyDigest} from "../reference/did-history.ts";
const vectors=JSON.parse(await readFile(new URL('../artifacts/did-history-v2/vectors.json',import.meta.url),'utf8'));
const byId=new Map<string,any>(vectors.positive.map((v:any)=>[v.id,v]));
test('public DID history schemas and native ML-DSA verify empty, replacement, terminal and dual-root records',()=>{for(const v of vectors.positive)assert.deepEqual(verifyHistory(v.document,v.expectedDid),v.result,v.id);assert.equal(historyDigest(byId.get('genesis').document),historyDigest(byId.get('deterministic-retry').document));});
test('public signed negatives reject tampering, missing chain members, scope, license and committed-root substitution',()=>{for(const v of vectors.negative)assert.throws(()=>verifyHistory(v.document,v.expectedDid),undefined,v.id);});
test('retained-state vectors reject rollback and genuine forks without freezing a re-signature-only retry',()=>{for(const v of vectors.observations){let state={series:{},transitions:{}};for(let i=0;i<v.steps.length;i++){const x=byId.get(v.steps[i]),next=observePublicHistory(state,x.document,x.expectedDid);assert.equal(next.error??null,v.errors[i],v.id);state=next.state;}}});
