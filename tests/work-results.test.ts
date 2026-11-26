// SPDX-License-Identifier: Apache-2.0
import {test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{Ajv2020}from'ajv/dist/2020.js';import{validateWorkResult}from'../reference/work-results.ts';
const root=new URL('../artifacts/work-results-v1/',import.meta.url),v=JSON.parse(await readFile(new URL('vectors.json',root),'utf8')),validate=new Ajv2020({strict:true}).compile(JSON.parse(await readFile(new URL('schemas/work-result.schema.json',root),'utf8')));
test('bilateral results preserve agreed policy, author, payment context and exact public job ID list',()=>{
 for(const x of v.positive)assert.doesNotThrow(()=>validateWorkResult(x.credential,x.context,x.role,validate),x.id);
 for(const x of v.negative)assert.throws(()=>validateWorkResult(x.credential,x.context,x.role,validate),x.id);
});
