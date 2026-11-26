// SPDX-License-Identifier: Apache-2.0
// Manual synthetic fixture generation. No private key is persisted.
import { generateKeyPairSync, randomBytes, sign, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { canonical, deriveDid } from "../reference/codec.ts";
import { paymentDigest as digest } from "../reference/payments.ts";
const source = JSON.parse(await readFile(new URL("../artifacts/payments-v2/passkey-settlement.json",import.meta.url),"utf8"));
const root=generateKeyPairSync("ml-dsa-44"), key=generateKeyPairSync("ed25519");
const descriptor={version:1 as const,identitySuite:"ML-DSA-44" as const,identityPublicKey:root.publicKey.export({format:"jwk"}).pub as string};
const operator=deriveDid(descriptor), kid=operator+"/keys/issuance";
const gp={...source.positive[0].evidence.identity.grant.payload,root:operator,operational_did:operator,purpose:"credential-issuance",keys:[{id:kid,suite:"Ed25519",role:"assertion",public_key:key.publicKey.export({format:"jwk"}).x}]};
const authority={descriptor,authorization:{payload:gp,signature:{suite:"ML-DSA-44",context:"SITLA/root/1",value:sign(null,Buffer.from(canonical(gp)),{key:root.privateKey,context:Buffer.from("SITLA/root/1")}).toString("base64url")}}};
const b64=(x:unknown)=>Buffer.from(JSON.stringify(x)).toString("base64url");
function jws(value:unknown,typ:string){const input=b64({alg:"EdDSA",kid,typ})+"."+Buffer.from(canonical(value)).toString("base64url");return input+"."+sign(null,Buffer.from(input),key.privateKey).toString("base64url");}
function record(subject:any) {
 const id="019a8050-0000-7000-8000-000000000901";
 const vc={...source.positive[0].record.vc,id:"https://operator.example/credentials/"+id,issuer:operator,credentialSubject:subject};
 const disclosures:string[]=[], hashes:string[]=[];
 for(const [name,value] of Object.entries(subject)){if(name==="id"||name==="profile")continue;const encoded=b64([randomBytes(32).toString("base64url"),name,value]);disclosures.push(encoded);hashes.push(createHash("sha256").update(encoded).digest("base64url"));}
 const payload={...vc,credentialSubject:{id:subject.id,profile:subject.profile,_sd:hashes.sort()},iss:operator,sub:subject.id,vct:vc.type.at(-1),jti:vc.id,iat:Math.floor(Date.parse(vc.validFrom)/1000),_sd_alg:"sha-256"};
 return {id,vc,secured:jws(payload,"dc+sd-jwt")+"~"+disclosures.join("~")+"~",format:"application/dc+sd-jwt",digest:digest(vc),authority};
}
function bundle(subject:any,evidence:any){
 const r=record(subject),attachments=[{kind:"conditional-payment-holder-approval",reference:r.id,document:evidence}];
 const schema={adapter:"SITLA-sd-jwt/1",contentType:"application/dc+sd-jwt",signature:"EdDSA",status:"urn:sitla:status:operator-record:1"};
 const keyMaterial={keys:[{...key.publicKey.export({format:"jwk"}),kid}]};
 const manifest={type:"SitlaEvidenceExport",version:1,operator,account:subject.seller,kind:"payments",transactionId:subject.transactionId,exportedAt:"2026-11-26T00:00:00.000Z",complete:true,cursor:"",nextCursor:null,limitations:["Synthetic fixture; no live provider execution."],records:[{id:r.id,digest:digest(r)}],statusObservations:[{id:r.id,status:"active",observedAt:"2026-11-26T00:00:00.000Z"}],attachments:attachments.map(x=>({kind:x.kind,reference:x.reference,digest:digest(x)})),schemaDigest:digest(schema),keyMaterialDigest:digest(keyMaterial)};
 return {manifest,signedManifest:jws(manifest,"sitla-export+jws"),records:[r],attachments,schema,keyMaterial};
}
const original=source.positive[0], positive=[{id:"sd-jwt-passkey-settlement",bundle:bundle(original.record.vc.credentialSubject,original.evidence)}],negative:any[]=[];
const bad=(id:string,change:(x:any)=>void)=>{const value=structuredClone(positive[0].bundle);change(value);negative.push({id,bundle:value});};
bad("manifest-signature",x=>{const p=x.signedManifest.split(".");const bytes=Buffer.from(p[2],"base64url");bytes[0]^=1;p[2]=bytes.toString("base64url");x.signedManifest=p.join(".");});
bad("missing-approval",x=>x.attachments=[]);
bad("changed-disclosure",x=>x.records[0].secured=x.records[0].secured.replace(/~[^~]+~/,"~"+b64(["fixture-salt-00000000000000000000","amountMinor",999])+"~"));
bad("substituted-record",x=>x.records[0].vc.credentialSubject.amountMinor++);
const altered=structuredClone(original.record.vc.credentialSubject);altered.amountMinor++;
negative.push({id:"signed-payment-amount-mismatch",bundle:bundle(altered,original.evidence)});
await writeFile(new URL("../artifacts/payments-v2/sd-jwt-passkey-export.json",import.meta.url),JSON.stringify({profile:"SITLA-sd-jwt/1",expectedOperator:operator,acceptedOperatorKey:{...key.publicKey.export({format:"jwk"}),kid},trustedEnrollment:source.trustedEnrollment,approvalOperator:source.expectedIssuer,positive,negative},null,2)+"\n");
