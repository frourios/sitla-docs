// SPDX-License-Identifier: Apache-2.0
// Shape/semantics/projection reference only. Callers independently verify the
// complete issuer signature, root authority, digest and current status first.
import {readFile} from "node:fs/promises";
import {Ajv2020} from "ajv/dist/2020.js";
const schema=JSON.parse(await readFile(new URL("../artifacts/job-requests-v1/schemas/job-request.schema.json",import.meta.url),"utf8"));
const shape=new Ajv2020({strict:true,allErrors:true}).compile(schema);
const instant=(s:string)=>{
 const t=Date.parse(s);
 if(!Number.isFinite(t)||new Date(t).toISOString()!==(s.includes(".")?s:s.replace("Z",".000Z")))throw new Error("job_time_invalid");
 return t;
};
export function validateJobRequestClaims(vc:any,now:number) {
 if(!shape(vc))throw new Error("job_shape_invalid: "+JSON.stringify(shape.errors));
 if(vc["@context"][0]!=="https://www.w3.org/ns/credentials/v2")throw new Error("job_context_invalid");
 if(vc.issuer!==vc.credentialSubject.id)throw new Error("job_issuer_subject_mismatch");
 const start=instant(vc.validFrom),end=instant(vc.validUntil);
 instant(vc.credentialSubject.claims.desiredDueAt);
 if(start>=end||start>now||now>=end)throw new Error("job_not_current");
 return vc;
}
export function projectJobRequest(vc:any,now:number) {
 validateJobRequestClaims(vc,now);
 const c=vc.credentialSubject.claims;
 // Explicit allowlist. Never spread claims, even if future schema fields appear.
 return {credentialId:vc.id,requesterDid:vc.issuer,validFrom:vc.validFrom,validUntil:vc.validUntil,
  summary:c.summary,estimatedExpenses:c.estimatedExpenses,reward:c.reward,
  completionLicenses:c.completionLicenses,desiredDueAt:c.desiredDueAt};
}
