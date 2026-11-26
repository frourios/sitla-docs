// SPDX-License-Identifier: Apache-2.0
// Synthetic credentials; no private key is persisted.
import {generateKeyPairSync,sign} from "node:crypto";
import {writeFile} from "node:fs/promises";
const {privateKey,publicKey}=generateKeyPairSync("ed25519");
const kid="did:sitla:v1:synthetic#assertion",CC0="CC0-1.0",SITLA="LicenseRef-SITLA-Internal-1.0",peer="did:sitla:v1:peer";
const b64=(v:any)=>Buffer.from(JSON.stringify(v)).toString("base64url");
const base={"@context":["https://www.w3.org/ns/credentials/v2"],id:"urn:uuid:019a8050-0000-7000-8000-000000000901",issuer:"did:sitla:v1:synthetic",type:["VerifiableCredential","urn:example:Claims:1"],validFrom:"2026-11-26T00:00:00.000Z",credentialSubject:{id:peer,claims:{plaintext:"complete",encrypted:"opaque-party-ciphertext",proof:"opaque-party-proof"}},licenses:[SITLA],didAllowList:[peer]};
function issue(extension:any){const vc={...base,...extension};const p={...vc,iss:vc.issuer,sub:vc.credentialSubject.id,jti:vc.id,vct:vc.type.at(-1),iat:Math.floor(Date.parse(vc.validFrom)/1000)};const input=b64({alg:"EdDSA",typ:"vc+jwt",kid})+"."+b64(p);return {secured:input+"."+sign(null,Buffer.from(input),privateKey).toString("base64url"),vc};}
const positive=[{id:"public",...issue({licenses:[CC0],didAllowList:[]})},{id:"private-peer",...issue({licenses:[SITLA,"urn:unknown:license"],didAllowList:[peer,"did:example:external"]})},{id:"internal-only",...issue({didAllowList:[]})}];
const negative=[
 ["missing-license",{licenses:[]}],["unknown-only",{licenses:["urn:unknown:license"]}], ["mixed-cc0",{licenses:[CC0,SITLA]}],["restricted-cc0",{licenses:[CC0]}],
 ["configuration-public",{licenses:[CC0],didAllowList:[],type:["VerifiableCredential","urn:sitla:credential:OperatorAccountCredential:1"]}],
 ["seller-internal",{type:["VerifiableCredential","urn:sitla:credential:TrustReferences:1"]}],
 ...["_sd","_sd_alg","...","disclosures"].map(key=>["hidden-"+key,{credentialSubject:{id:peer,claims:{[key]:[]}}}]),
 ["expired",{validUntil:"2026-11-26T00:00:01.000Z"}], ["holder-bound",{cnf:{jwk:publicKey.export({format:"jwk"})}}],
].map(([id,value])=>({id,...issue(value)}));
negative.push({...positive[0],id:"sd-serialization",secured:positive[0].secured+"~"} as any);
const changed=positive[1].secured.split(".");const payload=JSON.parse(Buffer.from(changed[1],"base64url").toString());payload.didAllowList.push("did:sitla:v1:attacker");changed[1]=b64(payload);negative.push({id:"tampered-allowlist",secured:changed.join(".")} as any);
await writeFile(new URL("../artifacts/circulation-v2/credentials.json",import.meta.url),JSON.stringify({profile:"SITLA-vc-jwt/1",now:1795737602,publicKey:{...publicKey.export({format:"jwk"}),kid},peer,positive,negative},null,2)+"\n");
