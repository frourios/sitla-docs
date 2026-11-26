# SPDX-License-Identifier: Apache-2.0
import json
from pathlib import Path
from jsonschema import Draft202012Validator
def verify_vectors():
    base=Path(__file__).resolve().parents[1]/'artifacts/circulation-v3';v=json.loads((base/'vectors.json').read_text());schemas={}
    for p in (base/'schemas').glob('*.json'):
        schema=json.loads(p.read_text());Draft202012Validator.check_schema(schema);schemas[p.name.removesuffix('.schema.json')]=Draft202012Validator(schema)
    for x in v['positive']:schemas[x['schema']].validate(x['value'])
    for x in v['negative']:assert not schemas[x['schema']].is_valid(x['value']),x['id']
    print(f"Independent circulation-v3 subjects: {len(v['positive'])} positive, {len(v['negative'])} negative; no signature claim.")
if __name__=='__main__':verify_vectors()
