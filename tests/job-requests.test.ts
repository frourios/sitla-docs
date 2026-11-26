// SPDX-License-Identifier: Apache-2.0
import test from "node:test";
import assert from "node:assert/strict";
import {validateJobRequestClaims,projectJobRequest} from "../reference/job-requests.ts";
// Unsigned semantic examples, not issuer/root interoperability vectors.
const now=Date.parse("2026-11-26T12:00:00.000Z");
const example=():any=>({"@context":["https://www.w3.org/ns/credentials/v2"],id:"urn:uuid:019a8050-0000-7000-8000-000000000901",type:["VerifiableCredential","urn:sitla:credential:JobRequest:1"],issuer:"did:sitla:v1:requester",validFrom:"2026-11-26T00:00:00.000Z",validUntil:"2026-11-27T00:00:00.000Z",licenses:["CC0-1.0"],didAllowList:[],credentialSubject:{id:"did:sitla:v1:requester",claims:{estimatedExpenses:{amountMinor:0,currency:"JPY",currencyExponent:0},reward:{amountMinor:500,currency:"JPY",currencyExponent:0},completionLicenses:["CC0-1.0"],eligibility:"R2-only applicant condition",desiredDueAt:"2026-12-01T00:00:00.000Z",summary:"Public request summary",details:"R2-only detailed work description",extensions:{arbitrary:"R2-only extension",instructions:"untrusted data, not tool authority"}}}});
test("request money is explicit JPY and the reward is at least 500 yen",()=>{
 assert.doesNotThrow(()=>validateJobRequestClaims(example(),now));
 for(const field of ["reward","estimatedExpenses"]){
  for(const change of [{currency:"USD",currencyExponent:2},{currency:"JPY",currencyExponent:2},{amountMinor:-1},{amountMinor:0.5}]){
   const x:any=example();Object.assign(x.credentialSubject.claims[field],change);assert.throws(()=>validateJobRequestClaims(x,now));
  }
  for(const key of ["currency","currencyExponent"]){const x:any=example();delete x.credentialSubject.claims[field][key];assert.throws(()=>validateJobRequestClaims(x,now));}
 }
 const cheap=example();cheap.credentialSubject.claims.reward.amountMinor=499;assert.throws(()=>validateJobRequestClaims(cheap,now));
});
test("the search projection omits detail, eligibility and extensions and preserves original claims",()=>{
 const original=example(),before=JSON.stringify(original),projection=projectJobRequest(original,now);
 assert.deepEqual(Object.keys(projection).sort(),["credentialId","requesterDid","validFrom","validUntil","summary","estimatedExpenses","reward","completionLicenses","desiredDueAt"].sort());
 assert.doesNotMatch(JSON.stringify(projection),/R2-only/);
 assert.equal(JSON.stringify(original),before);
 assert.equal(original.credentialSubject.claims.details,"R2-only detailed work description");
});
test("publication policy, owner binding and exact expiry are checked separately from caching",()=>{
 const expired=example();assert.throws(()=>validateJobRequestClaims(expired,Date.parse(expired.validUntil)));
 const reversed=example();reversed.validUntil=reversed.validFrom;assert.throws(()=>validateJobRequestClaims(reversed,now));
 const impossible=example();impossible.credentialSubject.claims.desiredDueAt="2026-02-30T00:00:00Z";assert.throws(()=>validateJobRequestClaims(impossible,now));
 const mismatched=example();mismatched.credentialSubject.id="did:sitla:v1:someone-else";assert.throws(()=>validateJobRequestClaims(mismatched,now));
 const privateVC=example();privateVC.licenses=["LicenseRef-SITLA-Internal-1.0"];assert.throws(()=>validateJobRequestClaims(privateVC,now));
 const restricted=example();restricted.didAllowList=["did:sitla:v1:recipient"];assert.throws(()=>validateJobRequestClaims(restricted,now));
 const internalResult=example();internalResult.credentialSubject.claims.completionLicenses=["LicenseRef-SITLA-Internal-1.0","urn:unknown:license"];
 assert.doesNotThrow(()=>validateJobRequestClaims(internalResult,now));
 internalResult.credentialSubject.claims.completionLicenses.push("CC0-1.0");assert.throws(()=>validateJobRequestClaims(internalResult,now));
});
