// SPDX-License-Identifier: Apache-2.0
// Standalone Node implementation; no application code or remote resolver imported.
import {createPublicKey,createHash,verify} from "node:crypto";
import {readFile} from "node:fs/promises";
import {Ajv2020} from "ajv/dist/2020.js";
import {canonical,base64urlBytes,parseTime,sha256} from "./codec.ts";
const ajv=new Ajv2020({strict:true,allErrors:true});
const schemaPrefix="urn:sitla:did-history:2:schema:";
for(const name of ["identity-descriptor","operational-key-authorization","did-root-transition","did-document"]){ajv.addSchema(JSON.parse(await readFile(new URL(`../artifacts/did-history-v2/schemas/${name}.schema.json`,import.meta.url),"utf8")));}
const check=(condition:unknown,error:string)=>{if(!condition)throw new Error(error);};
const bytes=(value:any)=>Buffer.from(canonical(value,{maxBytes:192*1024,maxDepth:32,maxNodes:100000}));
export const historyDigest=(value:any)=>sha256(bytes(value));
export function historyDid(descriptor:any){check(ajv.getSchema(schemaPrefix+"identity-descriptor")!(descriptor),"history_descriptor");base64urlBytes(descriptor.identityPublicKey,1312);return "did:sitla:v2:"+createHash("sha3-512").update(bytes(descriptor)).digest("base64url");}
function rootSignature(descriptor:any,payload:any,signature:string,context:string){check(verify(null,bytes(payload),{key:createPublicKey({key:{kty:"AKP",alg:"ML-DSA-44",pub:descriptor.identityPublicKey},format:"jwk"}),context:Buffer.from(context)},base64urlBytes(signature,2420)),"history_signature");}
export function historyRoot(descriptor:any){const id=historyDid(descriptor),method=id+"#root";return {"@context":["https://www.w3.org/ns/did/v1"],id,verificationMethod:[{id:method,type:"urn:sitla:verification-method:akp-jwk-v1",controller:id,publicKeyJwk:{kty:"AKP",alg:"ML-DSA-44",pub:descriptor.identityPublicKey}}],authentication:[method],assertionMethod:[method],capabilityDelegation:[method]};}
export function verifyHistory(document:any,expectedDid:string){
 bytes(document);check(ajv.getSchema(schemaPrefix+"did-document")!(document),"history_schema");
 const h=document.history,{history:_history,licenses:_licenses,...root}=document;
 check(document.id===expectedDid&&historyDid(h.rootDescriptor)===expectedDid&&canonical(root)===canonical(historyRoot(h.rootDescriptor)),"history_root");
 check(h.keyHistories.reduce((n:number,x:any)=>n+x.records.length,0)<=128,"history_resource_limit");
 const roots=new Set([expectedDid]),path=new Set<string>();let previous:any=null;
 for(const transition of h.rootTransitions){const p=transition.payload;parseTime(p.issuedAt);
  check(historyDid(p.predecessorDescriptor)===p.predecessor&&historyDid(p.successorDescriptor)===p.successor&&p.predecessor!==p.successor,"history_transition");
  if(p.predecessorDescriptor.nextRootCommitment)check(p.predecessorDescriptor.nextRootCommitment===historyDigest(p.successorDescriptor),"history_precommitment_mismatch");
  check(previous?previous.payload.successor===p.predecessor&&p.previousTransitionDigest===historyDigest(previous)&&parseTime(p.issuedAt)>=parseTime(previous.payload.issuedAt):p.previousTransitionDigest===null,"history_transition");
  if(!previous)path.add(p.predecessor);check(!path.has(p.successor),"history_cycle");path.add(p.successor);roots.add(p.predecessor);roots.add(p.successor);
  rootSignature(p.predecessorDescriptor,p,transition.predecessorSignature,"SITLA/continuity/2");rootSignature(p.successorDescriptor,p,transition.successorSignature,"SITLA/continuity/2");previous=transition;
 }
 check(!previous||path.has(expectedDid),"history_unconnected_root");
 const scopes=new Set<string>();
 for(const series of h.keyHistories){const root=historyDid(series.rootDescriptor),id=JSON.stringify([root,series.series]);check(roots.has(root)&&!scopes.has(id),"history_series");scopes.add(id);let previous:any=null;
  for(const record of series.records){const p=record.payload;check(p.root===root&&p.authorization_series_id===series.series,"history_series");check(parseTime(p.expires_at)>parseTime(p.issued_at),"history_time");check((p.sequence===0)===(p.predecessor_digest===null),"history_predecessor");check(new Set(p.keys.map((k:any)=>k.id)).size===p.keys.length,"history_keys");check((p.operation==="revoke-operational-keys")===(p.keys.length===0),"history_keys");
   for(const k of p.keys){const raw=base64urlBytes(k.public_key,k.suite==="P-256"?65:32);check((k.suite==="X25519")===(k.role==="key-agreement"),"history_key_role");if(k.suite==="P-256"){check(raw[0]===4,"history_key_point");createPublicKey({key:{kty:"EC",crv:"P-256",x:raw.subarray(1,33).toString("base64url"),y:raw.subarray(33).toString("base64url")},format:"jwk"});}}
   rootSignature(series.rootDescriptor,p,record.signature.value,"SITLA/root/2");
   if(previous){const old=previous.payload;check(old.operation!=="revoke-operational-keys","history_terminal");check(p.sequence===old.sequence+1&&p.predecessor_digest===historyDigest(previous)&&parseTime(p.issued_at)>=parseTime(old.issued_at),"history_chain");for(const key of ["root","operational_did","audience","purpose","authorization_series_id"])check(p[key]===old[key],"history_scope");}else check(p.sequence===0,"history_genesis");previous=record;
  }
  check(series.headDigest===historyDigest(previous),"history_head");
 }
 for(const t of h.rootTransitions){const p=t.payload,g=h.keyHistories.filter((s:any)=>historyDid(s.rootDescriptor)===p.successor).flatMap((s:any)=>s.records).find((g:any)=>historyDigest(g)===p.successorAuthorizationDigest);check(g&&g.payload.operation==="replace-operational-keys"&&g.payload.audience===p.predecessor&&g.payload.purpose==="root-continuity"&&parseTime(g.payload.issued_at)<=parseTime(p.issuedAt)&&parseTime(g.payload.expires_at)>parseTime(p.issuedAt),"history_successor_grant");}
 return {rootVerification:"valid",historyVerification:h.keyHistories.length||h.rootTransitions.length?"valid":"indeterminate",acceptanceDecision:"review",latestState:"unknown"};
}
export interface ReferenceHistoryState {series:Record<string,any>;transitions:Record<string,any>}
export function observePublicHistory(state:ReferenceHistoryState,document:any,expectedDid:string){
 const result=verifyHistory(document,expectedDid),next=structuredClone(state);let conflict=false,rollback=false;
 for(const h of document.history.keyHistories){const id=JSON.stringify([historyDid(h.rootDescriptor),h.series]),old=state.series[id],digests=h.records.map(historyDigest);
  if(old&&old.digests.some((d:string,i:number)=>i<digests.length&&d!==digests[i]&&canonical(old.record.records[i].payload)===canonical(h.records[i].payload)))return {state,error:"history_signature_profile_mismatch"};
  if(old?.conflict||old?.digests.some((d:string,i:number)=>i<digests.length&&d!==digests[i])){next.series[id]={...old,conflict:true};conflict=true;}else if(old&&old.digests.length>digests.length)rollback=true;else next.series[id]={digests,record:h,revoked:h.records.at(-1).payload.operation==="revoke-operational-keys"};
 }
 for(const t of document.history.rootTransitions){const p=t.payload,old=state.transitions[p.predecessor],incoming:any=Object.values(state.transitions).find((v:any)=>v.successor===p.predecessor),competing:any=Object.values(state.transitions).find((v:any)=>v.successor===p.successor&&v.record.payload.predecessor!==p.predecessor);
  if(old&&old.digest!==historyDigest(t)&&canonical(old.record.payload)===canonical(t.payload))return {state,error:"history_signature_profile_mismatch"};
  if(old&&(old.conflict||old.digest!==historyDigest(t))||incoming&&(incoming.conflict||incoming.digest!==p.previousTransitionDigest)||competing){next.transitions[p.predecessor]={...(old??{digest:historyDigest(t),successor:p.successor,record:t}),conflict:true};conflict=true;}else next.transitions[p.predecessor]={digest:historyDigest(t),successor:p.successor,record:t};
 }
 if(conflict){const refused=structuredClone(state);for(const [k,v]of Object.entries(next.series))if(v.conflict)refused.series[k]=v;for(const[k,v]of Object.entries(next.transitions))if(v.conflict)refused.transitions[k]=v;return {state:refused,error:"history_conflict"};}
 return rollback?{state,error:"history_rollback"}:{state:next,result};
}
