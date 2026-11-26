# SPDX-License-Identifier: Apache-2.0
"""Independent JSON/schema/ML-DSA history verifier; no Node/application imports."""
import base64, copy, datetime, hashlib, json, re
from pathlib import Path
from dilithium_py.ml_dsa import ML_DSA_44
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from cryptography.hazmat.primitives.asymmetric import ec
BASE=Path(__file__).resolve().parents[1]/'artifacts/did-history-v2'
def check(value,error):
    if not value: raise ValueError(error)
def canonical(x):
    if x is None or isinstance(x,bool): return json.dumps(x)
    if isinstance(x,str): x.encode('utf8');return json.dumps(x,ensure_ascii=False,separators=(',',':'))
    if isinstance(x,int): check(abs(x)<=9007199254740991,'number');return str(x)
    if isinstance(x,list): return '['+','.join(canonical(v) for v in x)+']'
    check(isinstance(x,dict),'json');return '{'+','.join(canonical(k)+':'+canonical(x[k]) for k in sorted(x,key=lambda k:k.encode('utf-16-be'))) +'}'
def encoded(x):return canonical(x).encode()
def digest(x):return hashlib.sha256(encoded(x)).hexdigest()
def b64(s,n=None):
    check(isinstance(s,str) and re.fullmatch('[A-Za-z0-9_-]+',s),'base64');b=base64.urlsafe_b64decode(s+'='*(-len(s)%4));check(base64.urlsafe_b64encode(b).decode().rstrip('=')==s and (n is None or len(b)==n),'base64');return b
def time(s):
    check(isinstance(s,str) and re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ',s),'time');d=datetime.datetime.fromisoformat(s.replace('Z','+00:00'));check(d.isoformat(timespec='seconds').replace('+00:00','Z')==s,'time');return d
def did(d):
    check(set(d) in ({'version','identitySuite','identityPublicKey'},{'version','identitySuite','identityPublicKey','nextRootCommitment'}) and d['version']==2 and d['identitySuite']=='ML-DSA-44','descriptor');b64(d['identityPublicKey'],1312)
    if 'nextRootCommitment' in d:check(re.fullmatch('[a-f0-9]{64}',d['nextRootCommitment']),'commitment')
    return 'did:sitla:v2:'+base64.urlsafe_b64encode(hashlib.sha3_512(encoded(d)).digest()).decode().rstrip('=')
def root(d):
    identity=did(d);method=identity+'#root';return {'@context':['https://www.w3.org/ns/did/v1'],'id':identity,'verificationMethod':[{'id':method,'type':'urn:sitla:verification-method:akp-jwk-v1','controller':identity,'publicKeyJwk':{'kty':'AKP','alg':'ML-DSA-44','pub':d['identityPublicKey']}}],'authentication':[method],'assertionMethod':[method],'capabilityDelegation':[method]}
def signature(d,p,s,context):check(ML_DSA_44.verify(b64(d['identityPublicKey'],1312),encoded(p),b64(s,2420),ctx=context.encode()),'signature')
def validator():
    schemas=[json.loads(p.read_text()) for p in (BASE/'schemas').glob('*.json')];registry=Registry().with_resources((s['$id'],Resource.from_contents(s)) for s in schemas)
    for s in schemas:Draft202012Validator.check_schema(s)
    return Draft202012Validator(next(s for s in schemas if s['$id'].endswith(':did-document')),registry=registry)
SCHEMA=validator()
def verify(document,expected):
    check(len(encoded(document))<=192*1024,'resource');SCHEMA.validate(document);h=document['history'];projection={k:v for k,v in document.items() if k not in ('history','licenses')};check(document['id']==expected==did(h['rootDescriptor']) and projection==root(h['rootDescriptor']),'root')
    check(sum(len(s['records']) for s in h['keyHistories'])<=128,'resource');roots={expected};path=set();prior=None
    for t in h['rootTransitions']:
        p=t['payload'];time(p['issuedAt']);check(did(p['predecessorDescriptor'])==p['predecessor'] and did(p['successorDescriptor'])==p['successor'] and p['predecessor']!=p['successor'],'transition')
        if p['predecessorDescriptor'].get('nextRootCommitment'):check(p['predecessorDescriptor']['nextRootCommitment']==digest(p['successorDescriptor']),'precommitment')
        check(prior['payload']['successor']==p['predecessor'] and p['previousTransitionDigest']==digest(prior) and time(p['issuedAt'])>=time(prior['payload']['issuedAt']) if prior else p['previousTransitionDigest'] is None,'transition')
        if not prior:path.add(p['predecessor'])
        check(p['successor'] not in path,'cycle');path.add(p['successor']);roots.update([p['predecessor'],p['successor']]);signature(p['predecessorDescriptor'],p,t['predecessorSignature'],'SITLA/continuity/2');signature(p['successorDescriptor'],p,t['successorSignature'],'SITLA/continuity/2');prior=t
    check(not prior or expected in path,'connection');scopes=set()
    for series in h['keyHistories']:
        identity=did(series['rootDescriptor']);scope=(identity,series['series']);check(identity in roots and scope not in scopes,'scope');scopes.add(scope);previous=None
        for g in series['records']:
            p=g['payload'];check(p['root']==identity and p['authorization_series_id']==series['series'],'scope');check(time(p['expires_at'])>time(p['issued_at']),'time');check((p['sequence']==0)==(p['predecessor_digest'] is None),'predecessor');check(len({k['id'] for k in p['keys']})==len(p['keys']),'keys');check((p['operation']=='revoke-operational-keys')==(len(p['keys'])==0),'keys')
            for key in p['keys']:
                raw=b64(key['public_key'],65 if key['suite']=='P-256' else 32);check((key['suite']=='X25519')==(key['role']=='key-agreement'),'role')
                if key['suite']=='P-256':ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(),raw)
            signature(series['rootDescriptor'],p,g['signature']['value'],'SITLA/root/2')
            if previous:
                old=previous['payload'];check(old['operation']!='revoke-operational-keys','terminal');check(p['sequence']==old['sequence']+1 and p['predecessor_digest']==digest(previous) and time(p['issued_at'])>=time(old['issued_at']),'chain');check(all(p[k]==old[k] for k in ('root','operational_did','audience','purpose','authorization_series_id')),'scope')
            else:check(p['sequence']==0,'genesis')
            previous=g
        check(series['headDigest']==digest(previous),'head')
    for t in h['rootTransitions']:
        p=t['payload'];candidates=[g for s in h['keyHistories'] if did(s['rootDescriptor'])==p['successor'] for g in s['records'] if digest(g)==p['successorAuthorizationDigest']];check(bool(candidates),'successor_grant');g=candidates[0]['payload'];check(g['operation']=='replace-operational-keys' and g['audience']==p['predecessor'] and g['purpose']=='root-continuity' and time(g['issued_at'])<=time(p['issuedAt'])<time(g['expires_at']),'successor_grant')
    return {'rootVerification':'valid','historyVerification':'valid' if h['keyHistories'] or h['rootTransitions'] else 'indeterminate','latestState':'unknown','acceptanceDecision':'review'}
def observe(state,document,expected):
    result=verify(document,expected);n=copy.deepcopy(state);conflict=False;rollback=False
    for h in document['history']['keyHistories']:
        key=canonical([did(h['rootDescriptor']),h['series']]);old=state['series'].get(key);digests=[digest(g) for g in h['records']]
        if old and any(d!=digests[i] and old['record']['records'][i]['payload']==h['records'][i]['payload'] for i,d in enumerate(old['digests']) if i<len(digests)):return state,'history_signature_profile_mismatch'
        if old and (old.get('conflict') or any(d!=digests[i] for i,d in enumerate(old['digests']) if i<len(digests))):n['series'][key]={**old,'conflict':True};conflict=True
        elif old and len(old['digests'])>len(digests):rollback=True
        else:n['series'][key]={'digests':digests,'record':h,'revoked':h['records'][-1]['payload']['operation']=='revoke-operational-keys'}
    for t in document['history']['rootTransitions']:
        p=t['payload'];old=state['transitions'].get(p['predecessor']);incoming=next((v for v in state['transitions'].values() if v['successor']==p['predecessor']),None);competing=next((v for v in state['transitions'].values() if v['successor']==p['successor'] and v['record']['payload']['predecessor']!=p['predecessor']),None)
        if old and old['digest']!=digest(t) and old['record']['payload']==p:return state,'history_signature_profile_mismatch'
        if old and (old.get('conflict') or old['digest']!=digest(t)) or incoming and (incoming.get('conflict') or incoming['digest']!=p['previousTransitionDigest']) or competing:n['transitions'][p['predecessor']]={**(old or {'digest':digest(t),'successor':p['successor'],'record':t}),'conflict':True};conflict=True
        else:n['transitions'][p['predecessor']]={'digest':digest(t),'successor':p['successor'],'record':t}
    if conflict:
        rejected=copy.deepcopy(state)
        for kind in ('series','transitions'):
            for k,v in n[kind].items():
                if v.get('conflict'):rejected[kind][k]=v
        return rejected,'history_conflict'
    return (state,'history_rollback') if rollback else (n,None)
def verify_vectors():
    vectors=json.loads((BASE/'vectors.json').read_text());by_id={v['id']:v for v in vectors['positive']}
    for v in vectors['positive']:check(verify(v['document'],v['expectedDid'])==v['result'],'positive')
    for v in vectors['negative']:
        try:verify(v['document'],v['expectedDid'])
        except Exception:pass
        else:raise AssertionError('negative accepted: '+v['id'])
    for v in vectors['observations']:
        state={'series':{},'transitions':{}}
        for step,error in zip(v['steps'],v['errors'],strict=True):
            x=by_id[step];state,actual=observe(state,x['document'],x['expectedDid']);check(actual==error,'observation '+v['id'])
    pk,sk=ML_DSA_44.keygen();a=ML_DSA_44.sign(sk,b'deterministic-profile-check',ctx=b'SITLA/root/2',deterministic=True);check(a==ML_DSA_44.sign(sk,b'deterministic-profile-check',ctx=b'SITLA/root/2',deterministic=True),'determinism')
    print(f"Independent DID history: {len(vectors['positive'])} positive, {len(vectors['negative'])} negative, {len(vectors['observations'])} retained-state sequences; deterministic signing checked.")
if __name__=='__main__':verify_vectors()
