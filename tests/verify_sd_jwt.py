# SPDX-License-Identifier: Apache-2.0
"""Independent RFC9901 fixture subset. No DID trust, live status or KB claim."""
import base64, hashlib, json, time
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

def b64(value):
    assert value and all(c.isalnum() and c.isascii() or c in '-_' for c in value)
    decoded = base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))
    assert base64.urlsafe_b64encode(decoded).decode().rstrip('=') == value
    return decoded

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

def verify(compact, key):
    parts = compact.split('~')
    jwt = parts.pop(0)
    assert parts.pop() == ''  # this profile has no KB-JWT
    header, payload, signature = jwt.split('.')
    h, raw = decode(header), decode(payload)
    assert h == {'alg': 'EdDSA', 'kid': key['kid'], 'typ': 'dc+sd-jwt'}
    Ed25519PublicKey.from_public_bytes(b64(key['x'])).verify(b64(signature), (header+'.'+payload).encode())
    assert raw['_sd_alg'] == 'sha-256' and isinstance(raw['iat'], int)
    assert raw.get('exp', 2**53) > time.time()
    disclosures = {}
    for encoded in parts:
        digest = base64.urlsafe_b64encode(hashlib.sha256(encoded.encode()).digest()).decode().rstrip('=')
        assert digest not in disclosures
        value = decode(encoded)
        assert len(value) in (2,3) and isinstance(value[0],str) and len(value[0]) >= 16
        disclosures[digest] = value
    used, references = set(), set()
    def reveal(digest, object_claim):
        assert len(b64(digest)) == 32 and digest not in references
        references.add(digest)
        value = disclosures.get(digest)
        if value is None: return None
        assert len(value) == (3 if object_claim else 2)
        used.add(digest)
        if object_claim:
            assert value[1] not in ('_sd','_sd_alg','...','__proto__','constructor','prototype')
            return value[1], walk(value[2])
        return walk(value[1])
    def walk(value):
        if isinstance(value,list):
            result=[]
            for entry in value:
                if isinstance(entry,dict) and '...' in entry:
                    assert list(entry)==['...']
                    disclosed=reveal(entry['...'],False)
                    if disclosed is not None: result.append(disclosed)
                else: result.append(walk(entry))
            return result
        if not isinstance(value,dict): return value
        assert '...' not in value
        result={key:walk(entry) for key,entry in value.items() if key not in ('_sd','_sd_alg')}
        for digest in value.get('_sd',[]):
            entry=reveal(digest,True)
            if entry is not None:
                name, content=entry
                assert name not in result
                result[name]=content
        return result
    result=walk(raw)
    assert len(used)==len(disclosures)
    return result

vectors=json.loads((Path(__file__).parent.parent/'artifacts/circulation-v1/vectors.json').read_text())
for item in vectors['positive']:
    assert verify(item['secured'],vectors['publicKey'])['credentialSubject']['claims']==item['claims'], item['id']
for item in vectors['negative']:
    try: verify(item['secured'],vectors['publicKey'])
    except Exception: pass
    else: raise AssertionError(item['id'])
print(f"circulation-v1: {len(vectors['positive'])} positive, {len(vectors['negative'])} negative (independent Python)")
