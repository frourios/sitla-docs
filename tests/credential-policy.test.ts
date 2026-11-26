// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {verifyCompleteCredential,authorizeCredentialRecipient} from "../reference/credential-jwt.ts";
const f=JSON.parse(await readFile(new URL("../artifacts/circulation-v2/credentials.json",import.meta.url),"utf8"));
test("complete signed credentials bind policy and reject selective disclosure",async()=>{
 for(const item of f.positive)assert.deepEqual((await verifyCompleteCredential(item.secured,f.publicKey,f.now)).vc,item.vc,item.id);
 for(const item of f.negative)await assert.rejects(()=>verifyCompleteCredential(item.secured,f.publicKey,f.now),item.id);
 assert.doesNotThrow(()=>authorizeCredentialRecipient(f.positive[1].vc,f.peer));
 assert.throws(()=>authorizeCredentialRecipient(f.positive[1].vc,"did:example:external"));
 assert.throws(()=>authorizeCredentialRecipient(f.positive[2].vc,f.peer));
});
