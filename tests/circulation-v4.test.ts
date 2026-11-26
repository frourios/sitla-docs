// SPDX-License-Identifier: Apache-2.0
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Ajv2020} from 'ajv/dist/2020.js';
import {validateCurrentConditional} from '../reference/conditional-current.ts';
const root=new URL('../artifacts/circulation-v4/',import.meta.url), vectors=JSON.parse(await readFile(new URL('vectors.json',root),'utf8'));
const validate=new Ajv2020({strict:true,allErrors:true}).compile(JSON.parse(await readFile(new URL('schemas/conditional-instruction.schema.json',root),'utf8')));
test('current conditional subjects bind explicit duration and capture-based deadlines without deposit or acceptance',()=>{
 for(const v of vectors.positive) assert.doesNotThrow(()=>validateCurrentConditional(v.value,validate),v.id);
 for(const v of vectors.negative) assert.throws(()=>validateCurrentConditional(v.value,validate),v.id);
});
