# SPDX-License-Identifier: Apache-2.0
import json
from datetime import datetime
from pathlib import Path
from jsonschema import Draft202012Validator

def verify_vectors():
    base=Path(__file__).resolve().parents[1]/'artifacts/circulation-v4'
    schema=json.loads((base/'schemas/conditional-instruction.schema.json').read_text())
    Draft202012Validator.check_schema(schema)
    validator=Draft202012Validator(schema)
    vectors=json.loads((base/'vectors.json').read_text())
    def verify(s):
        validator.validate(s)
        assert s['instruction']['escrowId']==s['transactionId']
        assert s['instruction']['termsDigest']==s['termsDigest']
        assert s['assertingAccount']==s['buyer' if s['action']=='settle' else 'seller']['id']
        if s['action']!='collection-authorize':
            funded=datetime.fromisoformat(s['fundedAt'].replace('Z','+00:00'))
            deadline=datetime.fromisoformat(s['refundAt'].replace('Z','+00:00'))
            assert (deadline-funded).total_seconds()==s['holdSeconds']
        if s['action']=='settle':
            assert s['inspection']['performanceDigest']==s['instruction']['performanceDigest']
    for v in vectors['positive']:verify(v['value'])
    for v in vectors['negative']:
        try:verify(v['value'])
        except Exception:pass
        else:raise AssertionError(v['id'])
    print(f"Independent circulation-v4 subjects: {len(vectors['positive'])} positive, {len(vectors['negative'])} negative; no signature/provider-execution claim.")
if __name__=='__main__':verify_vectors()
