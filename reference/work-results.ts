// SPDX-License-Identifier: Apache-2.0
// Unsigned semantic checks. Cryptographic author evidence is a separate layer.
export function validateWorkResult(vc:any,c:any,role:'buyer'|'seller',schema:(v:unknown)=>boolean) {
 const check=(ok:unknown)=>{if(!ok)throw new Error('work_result_invalid');},s=vc.credentialSubject;
 check(schema(vc));check(vc["@context"][0]==="https://www.w3.org/ns/credentials/v2");
 check(vc.issuer===c[role+'Did']&&s.id===c[role==='buyer'?'sellerDid':'buyerDid']);
 check(s.role===role&&s.assertion===(role==='buyer'?'accepted':'delivered'));
 check(s.paymentContext.kind===c.kind&&s.paymentContext.id===c.id&&s.termsDigest===c.termsDigest);
 check(s.buyerDid===c.buyerDid&&s.sellerDid===c.sellerDid&&s.amountMinor===c.amountMinor);
 check(JSON.stringify(s.jobRequestIds)===JSON.stringify(c.jobRequestIds));
 const equal=(a:string[],b:string[])=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
 check(equal(vc.licenses,c.resultPolicies[role].licenses)&&equal(vc.didAllowList,c.resultPolicies[role].didAllowList));
 check(vc.licenses.includes('CC0-1.0') ? vc.licenses.length===1&&vc.didAllowList.length===0 : vc.licenses.includes('LicenseRef-SITLA-Internal-1.0')&&vc.didAllowList.includes(s.id));
}
