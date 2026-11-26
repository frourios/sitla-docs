# SPDX-License-Identifier: Apache-2.0
# Disposable keys exist only in process memory. Output contains public artifacts.
import copy,json,base64
from dilithium_py.ml_dsa import ML_DSA_44
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from verify_did_history import BASE,did,root,digest,encoded,verify
enc=lambda b:base64.urlsafe_b64encode(b).decode().rstrip('=')
keys=[ML_DSA_44.keygen() for _ in range(4)]
def descriptor(i,commit=None):return {'version':2,'identitySuite':'ML-DSA-44','identityPublicKey':enc(keys[i][0]),**({'nextRootCommitment':commit} if commit else {})}
B=descriptor(1);A=descriptor(0,digest(B));U=descriptor(2);X=descriptor(3)
def sign(i,p,context,deterministic=True):return enc(ML_DSA_44.sign(keys[i][1],encoded(p),ctx=context.encode(),deterministic=deterministic))
def grant(i,d,series='issuer',previous=None,operation='replace-operational-keys',purpose='credential-issuance',audience='https://operator.example',key=None):
    public=key or enc(Ed25519PrivateKey.generate().public_key().public_bytes_raw());p={'protocol':'sitla-key-history/2','type':'OperationalKeyAuthorization','operation':operation,'role':'identity-root','root':did(d),'operational_did':did(d),'keys':[] if operation=='revoke-operational-keys' else [{'id':did(d)+'#assertion','suite':'Ed25519','public_key':public,'role':'assertion'}],'audience':audience,'purpose':purpose,'authorization_series_id':series,'sequence':previous['payload']['sequence']+1 if previous else 0,'predecessor_digest':digest(previous) if previous else None,'issued_at':'2026-11-27T00:00:00Z','expires_at':'2030-01-01T00:00:00Z','status_reference':'https://operator.example/status','request_id':'fixture-'+series};return {'payload':p,'signature':{'suite':'ML-DSA-44','context':'SITLA/root/2','value':sign(i,p,'SITLA/root/2')}}
def history(d,records):return {'rootDescriptor':d,'series':records[0]['payload']['authorization_series_id'],'records':records,'headDigest':digest(records[-1])}
def document(d,h=None,t=None):return {**root(d),'licenses':['CC0-1.0'],'history':{'profile':'sitla-did-history/2','coverage':'subset','rootDescriptor':d,'keyHistories':h or [],'rootTransitions':t or []}}
def transition(i,j,a,b,g):
    p={'protocol':'sitla-did-history/2','type':'DIDRootTransition','predecessor':did(a),'successor':did(b),'predecessorDescriptor':a,'successorDescriptor':b,'previousTransitionDigest':None,'successorAuthorizationDigest':digest(g),'issuedAt':'2026-11-27T00:00:00Z','purpose':'root-continuity'};return {'payload':p,'predecessorSignature':sign(i,p,'SITLA/continuity/2'),'successorSignature':sign(j,p,'SITLA/continuity/2')}
g0=grant(0,A);g1=grant(0,A,previous=g0);g2=grant(0,A,previous=g1,operation='revoke-operational-keys');fork=grant(0,A,previous=g0);gb=grant(1,B,series='continuity',purpose='root-continuity',audience=did(A));link=transition(0,1,A,B,gb)
resigned=copy.deepcopy(g0);resigned['signature']['value']=sign(0,g0['payload'],'SITLA/root/2');assert resigned==g0
randomized=copy.deepcopy(g0);randomized['signature']['value']=sign(0,g0['payload'],'SITLA/root/2',False);assert randomized!=g0
positive=[]
def pos(name,doc):positive.append({'id':name,'document':doc,'expectedDid':doc['id'],'result':verify(doc,doc['id'])})
pos('empty',document(A));pos('genesis',document(A,[history(A,[g0])]))
pos('deterministic-retry',document(A,[history(A,[resigned])]))
pos('replacement',document(A,[history(A,[g0,g1])]))
pos('terminal-revocation',document(A,[history(A,[g0,g1,g2])]))
pos('dual-root-precommitted',document(B,[history(A,[g0,g1]),history(B,[gb])],[link]))
pos('same-sequence-fork',document(A,[history(A,[g0,fork])]))
pos('nonconforming-randomized-retry',document(A,[history(A,[randomized])]))
negative=[]
def neg(name,doc):negative.append({'id':name,'document':doc,'expectedDid':doc['id']})
def altered(name,source,fn):d=copy.deepcopy(source);fn(d);neg(name,d)
doc1=positive[3]['document'];doc2=positive[5]['document']
altered('tampered-signature',doc1,lambda d:d['history']['keyHistories'][0]['records'][1]['signature'].__setitem__('value','A'*3227))
altered('missing-genesis',doc1,lambda d:d['history']['keyHistories'][0]['records'].pop(0))
altered('wrong-head',doc1,lambda d:d['history']['keyHistories'][0].__setitem__('headDigest','0'*64))
altered('only-one-root-proof',doc2,lambda d:d['history']['rootTransitions'][0].__setitem__('successorSignature',d['history']['rootTransitions'][0]['predecessorSignature']))
altered('missing-successor-grant',doc2,lambda d:d['history']['keyHistories'].pop())
altered('wrong-root-fields',doc1,lambda d:d.__setitem__('authentication',[]))
altered('forbidden-license',doc1,lambda d:d.__setitem__('licenses',['LicenseRef-SITLA-Internal-1.0']))
altered('forbidden-allowlist',doc1,lambda d:d.__setitem__('didAllowList',[]))
reopen=grant(0,A,previous=g2);neg('terminal-reopened',document(A,[history(A,[g0,g1,g2,reopen])]))
wrong=grant(1,B,series='continuity',purpose='wrong-purpose',audience=did(A));neg('wrong-successor-scope',document(B,[history(A,[g0]),history(B,[wrong])],[transition(0,1,A,B,wrong)]))
rogue=grant(3,X,series='continuity',purpose='root-continuity',audience=did(A));neg('compromised-old-key-wrong-successor',document(X,[history(A,[g0]),history(X,[rogue])],[transition(0,3,A,X,rogue)]))
# No commitment deliberately provides no pre-rotation protection.
u=grant(2,U);x=grant(3,X,series='continuity',purpose='root-continuity',audience=did(U));pos('uncommitted-dual-root',document(X,[history(U,[u]),history(X,[x])],[transition(2,3,U,X,x)]))
observations=[{'id':'exact-retry','steps':['genesis','deterministic-retry'],'errors':[None,None]},{'id':'replacement-and-rollback','steps':['genesis','replacement','genesis','replacement'],'errors':[None,None,'history_rollback',None]},{'id':'fork-is-sticky','steps':['replacement','same-sequence-fork','replacement'],'errors':[None,'history_conflict','history_conflict']},{'id':'terminal-cannot-roll-back','steps':['terminal-revocation','replacement'],'errors':[None,'history_rollback']},{'id':'randomized-retry-does-not-freeze-authority','steps':['genesis','nonconforming-randomized-retry','genesis'],'errors':[None,'history_signature_profile_mismatch',None]}]
(BASE/'vectors.json').write_text(json.dumps({'profile':'sitla-did-history/2','positive':positive,'negative':negative,'observations':observations},indent=2)+'\n')
print('Wrote public DID history vectors without secret keys.')
