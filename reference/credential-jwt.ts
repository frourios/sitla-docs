// SPDX-License-Identifier: Apache-2.0
// Complete VC profile. Caller supplies an independently trusted assertion key.
import {createPublicKey,verify} from "node:crypto";
import {parseJsonStrict} from "./codec.ts";
const check=(value:unknown):void=>{if(!value)throw new Error("complete_credential_invalid");};
const CC0="CC0-1.0", SITLA="LicenseRef-SITLA-Internal-1.0";
export function validateCredentialPolicy(vc:any) {
 const licenses=vc.licenses, recipients=vc.didAllowList??[];
 const list=(v:any)=>Array.isArray(v)&&v.length<=100&&v.every((x:any)=>typeof x==="string"&&x.length>0&&x.length<=2048);
 check(list(licenses)&&licenses.length>0&&list(recipients));
 check(licenses.includes(CC0)?licenses.length===1&&recipients.length===0:licenses.includes(SITLA));
 const types=Array.isArray(vc.type)?vc.type:[];
 if(types.includes("urn:sitla:credential:TrustReferences:1"))check(licenses.length===1&&licenses[0]===CC0);
 if(types.some((t:any)=>typeof t==="string"&&/^urn:sitla:credential:(?:Email|Account|OperatorAccount|Notification|ProviderAccount|Stripe|ToolRequest|ToolResponse|OperatorContinuity)/.test(t))) check(licenses.length===1&&licenses[0]===SITLA&&recipients.length===0);
 return {licenses,didAllowList:recipients};
}
export function authorizeCredentialRecipient(vc:any,did:string) {
 const p=validateCredentialPolicy(vc);
 check(p.licenses.includes(CC0)||(did.startsWith("did:sitla:")&&p.didAllowList.includes(did)));
}
function complete(value:any):void {
 if(Array.isArray(value))value.forEach(complete);
 else if(value&&typeof value==="object")for(const [key,item] of Object.entries(value)){
  check(!["_sd","_sd_alg","...","disclosures"].includes(key)); complete(item);
 }
}
function decode(part:string):any {
 check(/^[A-Za-z0-9_-]+$/.test(part)); const bytes=Buffer.from(part,"base64url");
 check(bytes.toString("base64url")===part); return parseJsonStrict(bytes);
}
export function materializeCompleteVC(p:any) {
 const {iss,sub,vct,jti,iat,exp,nbf,...vc}=p;
 check(Array.isArray(vc["@context"])&&vc["@context"][0]==="https://www.w3.org/ns/credentials/v2");
 check(Array.isArray(vc.type)&&vc.type.includes("VerifiableCredential")&&vc.type.at(-1)===vct);
 check(vc.id===jti&&vc.issuer===iss&&vc.credentialSubject?.id===sub&&Math.floor(Date.parse(vc.validFrom)/1000)===iat);
 check(vc.validUntil?Math.floor(Date.parse(vc.validUntil)/1000)===exp:exp===undefined);
 return vc;
}
export async function verifyCompleteCredential(secured:string,key:any,now=Date.now()/1000) {
 check(secured.length<=262144&&!secured.includes("~"));
 const parts=secured.split("."); check(parts.length===3);
 const header=decode(parts[0]),payload=decode(parts[1]);
 check(Buffer.from(parts[2],"base64url").toString("base64url")===parts[2]&&/^[A-Za-z0-9_-]+$/.test(parts[2]));
 check(header.typ==="vc+jwt"&&header.alg==="EdDSA"&&typeof header.kid==="string"&&header.kid.length>0&&!header.jwk&&!header.jku&&!header.x5u&&!header.crit);
 check(key.kty==="OKP"&&key.crv==="Ed25519"&&!key.d&&(!key.kid||key.kid===header.kid));
 check(verify(null,Buffer.from(parts[0]+"."+parts[1]),createPublicKey({key,format:"jwk"}),Buffer.from(parts[2],"base64url")));
 complete(payload);
 check(typeof payload.iss==="string"&&typeof payload.jti==="string"&&typeof payload.vct==="string"&&Number.isSafeInteger(payload.iat)&&payload.iat<=now+60&&payload.cnf===undefined);
 check(payload.exp===undefined||(Number.isSafeInteger(payload.exp)&&payload.exp>now));
 check(payload.nbf===undefined||(Number.isSafeInteger(payload.nbf)&&payload.nbf<=now));
 const vc=materializeCompleteVC(payload); validateCredentialPolicy(vc);
 return {payload,vc,header};
}
