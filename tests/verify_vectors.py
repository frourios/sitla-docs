# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Frourio, Inc.
"""Independent fixture verifier: Python JSON/schema, dilithium-py and cryptography.

No TypeScript code or application repository is imported. Not a production wallet.
"""
import base64
import datetime
import hashlib
import json
import re
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from dilithium_py.ml_dsa import ML_DSA_44
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "artifacts/v0.2"
VECTORS = json.loads((DIRECTORY / "vectors/core.json").read_text())
BY_ID = {item["id"]: item for item in VECTORS["positive"]}
SCHEMAS = {}
for path in (DIRECTORY / "schemas").glob("*.schema.json"):
    schema = json.loads(path.read_text())
    Draft202012Validator.check_schema(schema)
    SCHEMAS[path.name.removesuffix(".schema.json")] = Draft202012Validator(schema)


def check(condition, error):
    if not condition:
        raise ValueError(error)


def canonical(value, depth=0):
    check(depth <= 32, "resource_limit")
    if value is None or isinstance(value, bool):
        return json.dumps(value)
    if isinstance(value, str):
        value.encode("utf-8", errors="strict")
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, int):
        check(abs(value) <= 9007199254740991, "invalid_number")
        return str(value)
    if isinstance(value, list):
        return "[" + ",".join(canonical(item, depth + 1) for item in value) + "]"
    check(isinstance(value, dict), "invalid_json_value")
    keys = sorted(value, key=lambda key: key.encode("utf-16-be"))
    return "{" + ",".join(canonical(key, depth + 1) + ":" + canonical(value[key], depth + 1) for key in keys) + "}"


def encoded(value):
    return canonical(value).encode("utf-8")


def digest(value):
    return hashlib.sha256(encoded(value)).hexdigest()


def b64(value, length=None):
    check(isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_-]+", value), "invalid_base64url")
    raw = base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
    check(base64.urlsafe_b64encode(raw).decode().rstrip("=") == value, "invalid_base64url")
    check(length is None or len(raw) == length, "invalid_base64url")
    return raw


def did(descriptor):
    check(set(descriptor) == {"version", "identitySuite", "identityPublicKey"}, "invalid_descriptor")
    check(descriptor["version"] == 1 and descriptor["identitySuite"] == "ML-DSA-44", "invalid_descriptor")
    b64(descriptor["identityPublicKey"], 1312)
    return "did:sitla:v1:" + base64.urlsafe_b64encode(hashlib.sha3_512(encoded(descriptor)).digest()).decode().rstrip("=")


def document(descriptor):
    identity = did(descriptor)
    method = identity + "#root"
    return {"@context": ["https://www.w3.org/ns/did/v1"], "id": identity,
            "verificationMethod": [{"id": method, "type": "urn:sitla:verification-method:akp-jwk-v1", "controller": identity,
                                    "publicKeyJwk": {"kty": "AKP", "alg": "ML-DSA-44", "pub": descriptor["identityPublicKey"]}}],
            "authentication": [method], "assertionMethod": [method], "capabilityDelegation": [method]}


def time(value):
    check(isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", value), "invalid_time")
    try:
        parsed = datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("invalid_time") from error
    check(parsed.isoformat(timespec="seconds").replace("+00:00", "Z") == value, "invalid_time")
    return parsed


def signature(item, context=b"SITLA/0.2/root"):
    value = item["value"]
    sig = value["signature"]
    msg = encoded(value["payload"])
    if item["schema"] == "operational-key-authorization":
        return ML_DSA_44.verify(b64(VECTORS["descriptor"]["identityPublicKey"], 1312), msg, b64(sig["value"], 2420), ctx=context)
    key = VECTORS["verification_keys"].get(sig["key_id"])
    if not key or sig["suite"] != "Ed25519":
        return False
    try:
        Ed25519PublicKey.from_public_bytes(b64(key["x"], 32)).verify(b64(sig["value"], 64), msg)
        return True
    except InvalidSignature:
        return False


def semantics(item):
    value, schema = item["value"], item["schema"]
    encoded(value)
    if schema == "identity-descriptor":
        did(value)
        return
    if schema == "did-document":
        check(value == document(VECTORS["descriptor"]), "did_document_mismatch")
        return
    payload = value.get("payload", value)
    check(time(payload["expires_at"]) > time(payload["issued_at"]), "invalid_lifetime")
    if "challenge" in payload:
        check(32 <= len(b64(payload["challenge"])) <= 64, "invalid_challenge")
    if schema == "operational-key-authorization":
        check(payload["root"] == did(VECTORS["descriptor"]), "root_mismatch")
        check((payload["sequence"] == 0) == (payload["predecessor_digest"] is None), "invalid_predecessor")
        keys = payload["keys"]
        check(len({key["id"] for key in keys}) == len(keys), "duplicate_key_id")
        for key in keys:
            b64(key["public_key"], 32)
        b64(value["signature"]["value"], 2420)
        if "previous_ref" in item:
            previous = BY_ID[item["previous_ref"]]["value"]
            old = previous["payload"]
            for field in ["root", "authorization_series_id", "operational_did", "audience", "purpose"]:
                check(old[field] == payload[field], "series_scope_changed")
            check(old["operation"] != "revoke-operational-keys", "series_revoked")
            check(payload["sequence"] == old["sequence"] + 1 and payload["predecessor_digest"] == digest(previous), "invalid_chain")
            check(time(payload["issued_at"]) >= time(old["issued_at"]), "invalid_chain_time")
    if schema in ["approved-action", "service-assertion"]:
        b64(value["signature"]["value"], 64)
    if schema == "evidence-envelope":
        for observation in value["status_observations"]:
            for field in ["status_as_of", "expires_at"]:
                if observation[field] is not None:
                    time(observation[field])
    if "request_ref" in item:
        request = BY_ID[item["request_ref"]]["value"]
        for field in ["request_id", "operator_id", "audience", "purpose", "challenge", "policy_digest"]:
            check(payload[field] == request[field], "request_binding_failed")
        check(payload["request_digest"] == digest(request), "request_binding_failed")
        if schema == "evidence-envelope":
            check(value["evidence_level"] == request["evidence_level"], "request_binding_failed")
        check(time(payload["expires_at"]) <= time(request["expires_at"]) and time(payload["issued_at"]) >= time(request["issued_at"]), "request_binding_failed")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        check(key not in result, "duplicate_property")
        result[key] = value
    return result


def reject_float(value):
    raise ValueError("invalid_number")


for item in VECTORS["positive"]:
    SCHEMAS[item["schema"]].validate(item["value"])
    check(canonical(item["value"]) == item["canonical_utf8"], item["id"] + ": canonical")
    check(digest(item["value"]) == item["wire_sha256"], item["id"] + ": digest")
    semantics(item)
    if "expected_did" in item:
        check(did(item["value"]) == item["expected_did"], "did_mismatch")
    if "signature" in item["value"]:
        check(signature(item), item["id"] + ": signature")
    if "evidence_ref" in item:
        check(item["value"]["evidence_digest"] == digest(BY_ID[item["evidence_ref"]]["value"]), "evidence_mismatch")
    if "authorization_ref" in item:
        authority = BY_ID[item["authorization_ref"]]["value"]
        payload, sig = item["value"]["payload"], item["value"]["signature"]
        check(payload["key_authorization_digest"] == digest(authority) and payload["actor"] == authority["payload"]["root"], "approval_authority")
        key = next(key for key in authority["payload"]["keys"] if key["id"] == sig["key_id"])
        check(key["role"] == "assertion" and key["public_key"] == VECTORS["verification_keys"][sig["key_id"]]["x"], "approval_key")

for item in VECTORS["negative"]:
    shape = SCHEMAS[item["schema"]].is_valid(item["value"])
    if "signature_valid" in item:
        check(signature(item) == item["signature_valid"], item["id"] + ": signature expectation")
    if item["stage"] == "schema":
        check(not shape, item["id"] + ": schema rejection")
    else:
        check(shape, item["id"] + ": shape must pass")
        if item["stage"] == "signature":
            check(not signature(item), item["id"] + ": signature rejection")
        else:
            try:
                semantics(item)
            except ValueError as error:
                check(str(error) == item["error"], item["id"] + ": wrong semantic error: " + str(error))
            else:
                raise AssertionError(item["id"] + ": semantic failure expected")

for item in VECTORS["invalid_wire"]:
    try:
        value = json.loads(item["utf8"], object_pairs_hook=unique_object, parse_float=reject_float, parse_constant=reject_float)
        check(canonical(value) == item["utf8"], "noncanonical_wire")
    except (ValueError, UnicodeError):
        pass
    else:
        raise AssertionError(item["id"] + ": malformed wire accepted")

for context in [b"", b"SITLA/0.1/root", b"SITLA/0.2/continuity"]:
    check(not signature(BY_ID["authorization-initial"], context=context), "wrong_context_accepted")

# Reproduce the frozen v0.1 root derivation/signature separately as a regression.
legacy_dir = ROOT / "artifacts/v0.1"
legacy = json.loads((legacy_dir / "vectors/core.json").read_text())
identity = next(item for item in legacy["positive"] if item["schema"] == "identity-descriptor")
authorization = next(item for item in legacy["positive"] if item["schema"] == "operational-key-authorization")
check(did(identity["value"]) == identity["expected_did"], "legacy_did_mismatch")
check(ML_DSA_44.verify(b64(identity["value"]["identityPublicKey"], 1312), encoded(authorization["value"]["payload"]), b64(authorization["value"]["signature"]["value"], 2420), ctx=b"SITLA/0.1/root"), "legacy_signature")
print(f"Independent Python verification passed: {len(SCHEMAS)} schemas, {len(VECTORS['positive'])} positive, {len(VECTORS['negative'])} negative, {len(VECTORS['invalid_wire'])} malformed-wire fixtures; v0.1 derivation/signature retained.")
