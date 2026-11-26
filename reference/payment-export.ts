// SPDX-License-Identifier: Apache-2.0
import { createPublicKey, verify } from "node:crypto";
import { canonical, decodeBase64url, parseCanonical, deriveDid, validateSemantics } from "./codec.ts";
import { verifyCompleteCredential } from "./credential-jwt.ts";
import { verifySDJWT, materializeVC } from "./sd-jwt.ts";
import { paymentDigest as digest, verifyPaymentApproval, validatePaymentSubject } from "./payments.ts";
import type { RegisteredCredential } from "./webauthn.ts";
const check=(ok:unknown)=>{if(!ok)throw new Error("payment_export_invalid");};
// Trust inputs are selected by the caller, never inferred from bundle.keyMaterial.
export async function verifyPaymentExport(bundle:any, operator:string, key:any, approvalOperator:string, enrollment:RegisteredCredential, schemas:Map<string,any>) {
 const parts=bundle.signedManifest.split(".");
 check(parts.length===3);
 const header:any=parseCanonical(decodeBase64url(parts[0]));
 check(canonical(header)===canonical({alg:"EdDSA",kid:key.kid,typ:"sitla-export+jws"}));
 check(verify(null,Buffer.from(parts[0]+"."+parts[1]),createPublicKey({key,format:"jwk"}),decodeBase64url(parts[2])));
 const manifest:any=parseCanonical(decodeBase64url(parts[1]));
 check(canonical(manifest)===canonical(bundle.manifest)&&manifest.operator===operator&&manifest.kind==="payments");
 check(manifest.complete===(manifest.nextCursor===null));
 check(manifest.schemaDigest===digest(bundle.schema)&&manifest.keyMaterialDigest===digest(bundle.keyMaterial));
 check(canonical(manifest.records)===canonical(bundle.records.map((r:any)=>({id:r.id,digest:digest(r)}))));
 check(new Set(bundle.records.map((r:any)=>r.id)).size===bundle.records.length);
 check(canonical(manifest.attachments)===canonical(bundle.attachments.map((a:any)=>({kind:a.kind,reference:a.reference,digest:digest(a)}))));
 for(const r of bundle.records){
  const full=bundle.schema.adapter==="SITLA-vc-jwt/1";
  check(full ? r.format==="application/vc+jwt"&&bundle.schema.contentType==="application/vc+jwt" : bundle.schema.adapter==="SITLA-sd-jwt/1"&&r.format==="application/dc+sd-jwt");
  const vc=full ? (await verifyCompleteCredential(r.secured,key)).vc : materializeVC((await verifySDJWT(r.secured,key)).payload);
  check(vc.issuer===operator&&vc.id.endsWith("/"+r.id)&&canonical(vc)===canonical(r.vc)&&r.digest===digest(vc));
  const authority=r.authority, grant=authority.authorization;
  check(deriveDid(authority.descriptor)===operator&&grant.payload.root===operator);
  check(grant.signature.suite==="ML-DSA-44"&&grant.signature.context==="SITLA/root/1");
  check(verify(null,Buffer.from(canonical(grant.payload)),{key:createPublicKey({key:{kty:"AKP",alg:"ML-DSA-44",pub:authority.descriptor.identityPublicKey},format:"jwk"}),context:Buffer.from("SITLA/root/1")},decodeBase64url(grant.signature.value)));
  validateSemantics("operational-key-authorization",grant,{descriptor:authority.descriptor});
  check(grant.payload.purpose==="credential-issuance"&&grant.payload.keys.some((k:any)=>k.id===key.kid&&k.suite==="Ed25519"&&k.role==="assertion"&&k.public_key===key.x));
  check(Date.parse(vc.validFrom)>=Date.parse(grant.payload.issued_at)&&Date.parse(vc.validFrom)<Date.parse(grant.payload.expires_at));
  const s=vc.credentialSubject;
  check(schemas.get("conditional-instruction")(s)&&s.transactionId===manifest.transactionId&&s.id===manifest.account.id);
  validatePaymentSubject(s);
  const attachments=bundle.attachments.filter((a:any)=>a.kind==="conditional-payment-holder-approval"&&a.reference===r.id);
  check(attachments.length===1);
  verifyPaymentApproval(s,attachments[0].document,schemas,approvalOperator,enrollment);
 }
 return manifest;
}
