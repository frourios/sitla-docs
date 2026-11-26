# SPDX-License-Identifier: Apache-2.0
"""Independent indivisible-VC verifier; trusted key is supplied by the caller."""
import base64
import json
import re
import time
from datetime import datetime
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

CC0 = 'CC0-1.0'
SITLA = 'LicenseRef-SITLA-Internal-1.0'

def b64(value):
    assert re.fullmatch(r'[A-Za-z0-9_-]+', value)
    data = base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))
    assert base64.urlsafe_b64encode(data).decode().rstrip('=') == value
    return data

def pairs(items):
    result = {}
    for key, value in items:
        assert key not in result
        result[key] = value
    return result

def decode(value):
    data = b64(value)
    assert len(data) <= 65536
    return json.loads(data, object_pairs_hook=pairs)

def policy(vc):
    licenses, recipients = vc['licenses'], vc.get('didAllowList', [])
    for values in (licenses, recipients):
        assert isinstance(values, list) and len(values) <= 100
        assert all(isinstance(x, str) and 0 < len(x) <= 2048 for x in values)
    assert licenses
    assert (len(licenses) == 1 and not recipients) if CC0 in licenses else SITLA in licenses
    types = vc.get('type', [])
    if 'urn:sitla:credential:TrustReferences:1' in types:
        assert licenses == [CC0]
    if any(re.match(r'^urn:sitla:credential:(Email|Account|OperatorAccount|Notification|ProviderAccount|Stripe|ToolRequest|ToolResponse|OperatorContinuity)', t) for t in types):
        assert licenses == [SITLA] and not recipients
    return licenses, recipients

def authorize(vc, did):
    licenses, recipients = policy(vc)
    assert CC0 in licenses or did.startswith('did:sitla:') and did in recipients

def complete(value, depth=0):
    assert depth <= 32
    if isinstance(value, list):
        for item in value: complete(item, depth+1)
    elif isinstance(value, dict):
        assert not set(value).intersection(('_sd', '_sd_alg', '...', 'disclosures'))
        for item in value.values(): complete(item, depth+1)

def epoch(value):
    return int(datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp())

def verify_complete_vc(secured, key, now=None):
    now = time.time() if now is None else now
    assert len(secured) <= 262144 and '~' not in secured
    header_part, payload_part, signature = secured.split('.')
    h, p = decode(header_part), decode(payload_part)
    assert h.get('alg') == 'EdDSA' and h.get('typ') == 'vc+jwt' and h.get('kid') == key['kid']
    assert not any(h.get(x) for x in ('jwk', 'jku', 'x5u', 'crit'))
    assert key['kty'] == 'OKP' and key['crv'] == 'Ed25519' and 'd' not in key
    Ed25519PublicKey.from_public_bytes(b64(key['x'])).verify(b64(signature), (header_part+'.'+payload_part).encode())
    complete(p)
    assert type(p['iat']) is int and p['iat'] <= now+60 and 'cnf' not in p
    assert 'exp' not in p or type(p['exp']) is int and p['exp'] > now
    assert 'nbf' not in p or type(p['nbf']) is int and p['nbf'] <= now
    assert p['@context'][0] == 'https://www.w3.org/ns/credentials/v2'
    assert p['issuer'] == p['iss'] and p['id'] == p['jti'] and p['credentialSubject']['id'] == p['sub']
    assert 'VerifiableCredential' in p['type'] and p['type'][-1] == p['vct'] and epoch(p['validFrom']) == p['iat']
    assert epoch(p['validUntil']) == p.get('exp') if 'validUntil' in p else 'exp' not in p
    vc = {k: v for k, v in p.items() if k not in ('iss','sub','vct','jti','iat','exp','nbf')}
    policy(vc)
    return p

def verify_vectors():
    f = json.loads((Path(__file__).parent.parent/'artifacts/circulation-v2/credentials.json').read_text())
    for item in f['positive']:
        verify_complete_vc(item['secured'], f['publicKey'], f['now'])
    for item in f['negative']:
        try: verify_complete_vc(item['secured'], f['publicKey'], f['now'])
        except Exception: pass
        else: raise AssertionError(item['id']+': invalid full credential accepted')
    authorize(f['positive'][1]['vc'], f['peer'])
    for vc, did in ((f['positive'][1]['vc'], 'did:example:external'), (f['positive'][2]['vc'], f['peer'])):
        try: authorize(vc, did)
        except AssertionError: pass
        else: raise AssertionError('unauthorized recipient accepted')
    print(f"Independent complete-VC verification passed: {len(f['positive'])} positive, {len(f['negative'])} negative, recipient restrictions checked.")

if __name__ == '__main__': verify_vectors()
