# SPDX-License-Identifier: Apache-2.0
import json
from pathlib import Path
from jsonschema import Draft202012Validator

def verify_vectors():
    base=Path(__file__).resolve().parents[1]/'artifacts/work-results-v1'
    schema=json.loads((base/'schemas/work-result.schema.json').read_text())
    Draft202012Validator.check_schema(schema);validator=Draft202012Validator(schema)
    vectors=json.loads((base/'vectors.json').read_text())
    def verify(v):
        vc,c,role=v['credential'],v['context'],v['role'];validator.validate(vc);s=vc['credentialSubject']
        assert vc['@context'][0]=='https://www.w3.org/ns/credentials/v2'
        assert vc['issuer']==c[role+'Did'] and s['id']==c['sellerDid' if role=='buyer' else 'buyerDid']
        assert s['role']==role and s['assertion']==('accepted' if role=='buyer' else 'delivered')
        assert s['paymentContext']=={'kind':c['kind'],'id':c['id']} and s['termsDigest']==c['termsDigest']
        assert s['buyerDid']==c['buyerDid'] and s['sellerDid']==c['sellerDid'] and s['amountMinor']==c['amountMinor']
        assert s['jobRequestIds']==c['jobRequestIds']
        p=c['resultPolicies'][role]
        assert sorted(vc['licenses'])==sorted(p['licenses']) and sorted(vc['didAllowList'])==sorted(p['didAllowList'])
        if 'CC0-1.0' in vc['licenses']:assert vc['licenses']==['CC0-1.0'] and vc['didAllowList']==[]
        else:assert 'LicenseRef-SITLA-Internal-1.0' in vc['licenses'] and s['id'] in vc['didAllowList']
    for x in vectors['positive']:verify(x)
    for x in vectors['negative']:
        try:verify(x)
        except Exception:pass
        else:raise AssertionError(x['id'])
    print(f"Independent work-result semantics: {len(vectors['positive'])} positive, {len(vectors['negative'])} negative; no signature/provider claim.")
if __name__=='__main__':verify_vectors()
