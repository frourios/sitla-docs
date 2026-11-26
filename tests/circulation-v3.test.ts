// SPDX-License-Identifier: Apache-2.0
import {test} from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{Ajv2020}from'ajv/dist/2020.js';
const root=new URL('../artifacts/circulation-v3/',import.meta.url),vectors=JSON.parse(await readFile(new URL('vectors.json',root),'utf8')),ajv=new Ajv2020({strict:true,allErrors:true}),validators=new Map();
for(const name of ['conditional-instruction','collection-authorization'])validators.set(name,ajv.compile(JSON.parse(await readFile(new URL(`schemas/${name}.schema.json`,root),'utf8'))));
test('circulation-v3 positive subjects explicitly bind JPY and exponent zero',()=>{for(const v of vectors.positive)assert.equal(validators.get(v.schema)(v.value),true,JSON.stringify(validators.get(v.schema).errors));});
test('circulation-v3 rejects missing or substituted currency and exponent',()=>{for(const v of vectors.negative)assert.equal(validators.get(v.schema)(v.value),false,v.id);});
