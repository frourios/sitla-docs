# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Frourio, Inc.
"""Independent static fixture checks; no TypeScript imports or live authority."""
import copy
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1] / "artifacts"


def require(condition, error):
    if not condition:
        raise ValueError(error)


def rejected(call, expected):
    try:
        call()
    except ValueError as error:
        require(str(error) == expected, "wrong rejection: " + str(error))
    else:
        raise AssertionError("negative accepted: " + expected)


def verify_profiles(canonical, b64, time):
    def load(path):
        return json.loads((ROOT / path).read_text())

    def digest(value):
        return hashlib.sha256(canonical(value).encode()).hexdigest()

    def schema(folder, name):
        value = load(folder + "/" + name + ".schema.json")
        Draft202012Validator.check_schema(value)
        return Draft202012Validator(value)

    def account(value, kind):
        namespace = value["namespace"]
        origin = urlsplit(namespace)
        require(origin.scheme == "https" and origin.netloc == origin.hostname and not origin.path and not origin.query and not origin.fragment, "account_namespace")
        host = origin.hostname
        require(len(host) <= 253 and len(host.split(".")) >= 2 and not re.fullmatch(r"[0-9.]+", host) and all(re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", part) for part in host.split(".")), "account_namespace")
        require(re.fullmatch(re.escape(namespace + "/accounts/") + r"[A-Za-z0-9_-]{22}", value["id"]), "account_reference")
        if kind != "handle":
            require(value["controllerDid"].startswith("did:sitla:v1:"), "account_controller")
            b64(value["controllerDid"][len("did:sitla:v1:"):], 64)
        if kind != "account":
            require(re.fullmatch(r"[a-z0-9][a-z0-9_-]{2,31}", value["handle"]) and value["handleUri"] == namespace + "/@" + value["handle"], "account_handle")

    accounts, handles, legacy = [load(path + "/examples.json") for path in ["account-v1", "account-handle-v1", "account-id-v1"]]
    count = 0
    for folder, source, names, kind in [
        ("account-v1", accounts, ["before", "after"], "account"),
        ("account-handle-v1", handles, ["assigned", "renamed"], "handle"),
        ("account-id-v1", legacy, ["before", "after"], "legacy"),
    ]:
        for name in names:
            schema(folder, "subject").validate(source[name])
            account(source[name], kind)
            count += 1

    def transition(before, after):
        require(before["id"] == after["id"] and before["namespace"] == after["namespace"], "account_identity_changed")
        require(after["bindingVersion"] == before["bindingVersion"] + 1, "account_version")
    transition(accounts["before"], accounts["after"])
    transition(legacy["before"], legacy["after"])
    for name in ["assigned", "renamed"]:
        require(handles[name]["id"] == accounts["after"]["id"] and handles[name]["namespace"] == accounts["after"]["namespace"], "handle_account")
    require(handles["renamed"]["assignmentVersion"] > handles["assigned"]["assignmentVersion"] and handles["afterRemoval"]["assignmentVersion"] > handles["renamed"]["assignmentVersion"], "handle_version")
    require(not schema("account-handle-v1", "subject").is_valid(handles["afterRemoval"]), "removal_not_vc")
    rejected(lambda: account({**accounts["after"], "id": "https://other.example/accounts/" + "a" * 22}, "account"), "account_reference")
    rejected(lambda: transition(accounts["before"], {**accounts["after"], "bindingVersion": 7}), "account_version")
    rejected(lambda: account({**handles["assigned"], "handleUri": "https://other.example/@matsuda"}, "handle"), "account_handle")
    require(not schema("account-v1", "subject").is_valid({**accounts["before"], "handle": "unexpected"}), "account_extra_field")

    fixture = load("lifecycle-v1/examples.json")
    policy = (ROOT / "lifecycle-v1" / fixture["policy"]["path"]).read_bytes()
    require(policy.decode() == fixture["policy"]["bytes_utf8"] and hashlib.sha256(policy).hexdigest() == fixture["policy"]["digest"], "lifecycle_policy")
    validators = {name: schema("lifecycle-v1", name) for name in ["request", "receipt", "signed-receipt"]}

    def request(value, context):
        require(value["operator_id"] == context["operatorId"] and value["account_id"] == context["accountId"], "lifecycle_target")
        operator = urlsplit(value["operator_id"])
        require(operator.scheme == "https" and value["operator_id"] == "https://" + operator.netloc and re.fullmatch(re.escape(value["operator_id"] + "/accounts/") + r"[A-Za-z0-9_-]{22}", value["account_id"]), "lifecycle_target")
        require(value["session_epoch"] == context["sessionEpoch"] and value["recovery_epoch"] == context["recoveryEpoch"], "lifecycle_epoch")
        issued, expires, now = map(time, [value["issued_at"], value["expires_at"], context["now"]])
        require(issued < expires and (expires - issued).total_seconds() <= context["maxAgeSeconds"] and context["maxAgeSeconds"] > 0, "lifecycle_lifetime")
        require(issued <= now < expires, "lifecycle_expired")
        require(32 <= len(b64(value["challenge"])) <= 64, "lifecycle_challenge")
        require(value["policy_digest"] == hashlib.sha256(policy).hexdigest(), "lifecycle_policy")
        if value["operation"] == "revoke-mandate":
            target = value["mandate_id"]
            require(target and target.strip() == target and "*" not in target, "lifecycle_mandate")

    def receipt(req, value):
        require(all(value[k] == req[k] for k in ["operation", "operator_id", "account_id", "request_id", "audience", "mandate_id"]) and value["request_digest"] == digest(req), "lifecycle_binding")
        recorded = time(value["recorded_at"])
        require(recorded >= time(req["issued_at"]), "lifecycle_time")
        if value["effective_at"] is not None:
            cutoff = time(value["effective_at"])
            require(time(req["issued_at"]) <= cutoff < time(req["expires_at"]) and recorded >= cutoff, "lifecycle_time")
            if value["completed_at"] is not None:
                require(cutoff <= time(value["completed_at"]) <= recorded, "lifecycle_time")
        if value["state"] != "rejected":
            require(value["session_epoch"] > req["session_epoch"] if req["operation"] in ["logout-all", "delete-account"] else value["session_epoch"] == req["session_epoch"], "lifecycle_epoch")
        if value["status_ref"]:
            status = urlsplit(value["status_ref"])
            require(status.scheme + "://" + status.netloc == req["operator_id"] and not status.username and not status.password and not status.query and not status.fragment and status.geturl() == value["status_ref"], "lifecycle_status")
        for retained in value["retained_records"]:
            if retained["retention_until"] is not None:
                time(retained["retention_until"])

    public = Ed25519PublicKey.from_public_bytes(b64(fixture["verification_key"]["x"], 32))
    for case in fixture["cases"]:
        req, result = case["request"], case["receipt"]
        validators["request"].validate(req)
        validators["receipt"].validate(result)
        validators["signed-receipt"].validate(case["signed_receipt"])
        request(req, case["context"])
        receipt(req, result)
        require(canonical(req) == case["canonical_request_utf8"] and canonical(result) == case["canonical_receipt_utf8"], "lifecycle_canonical")
        signed = case["signed_receipt"]
        require(signed["payload"] == result and signed["signature"]["key_id"] == fixture["key_id"] and signed["signature"]["suite"] == "Ed25519" and result["domain"] == "SITLA/lifecycle-receipt/1", "lifecycle_signature_binding")
        public.verify(b64(signed["signature"]["value"], 64), canonical(result).encode())
    first = fixture["cases"][0]
    require(not validators["receipt"].is_valid({**first["receipt"], "mandate_scope": "all-owned-and-descendants"}), "logout_scope")
    req, result = first["request"], first["receipt"]
    rejected(lambda: request(req, {**first["context"], "recoveryEpoch": 999}), "lifecycle_epoch")
    rejected(lambda: request(req, {**first["context"], "now": req["expires_at"]}), "lifecycle_expired")
    rejected(lambda: receipt(req, {**result, "request_digest": "0" * 64}), "lifecycle_binding")
    rejected(lambda: receipt(req, {**result, "effective_at": req["expires_at"]}), "lifecycle_time")
    rejected(lambda: receipt(req, {**result, "status_ref": "https://operator.example/case?token=secret"}), "lifecycle_status")
    accepted = next(c for c in fixture["cases"] if c["id"] == "delete-account-accepted")
    require(not validators["receipt"].is_valid({**accepted["receipt"], "account_state": "active"}), "deletion_state")
    require(not validators["receipt"].is_valid({**accepted["receipt"], "state": "completed"}), "deletion_completion")
    rejected(lambda: receipt(accepted["request"], {**accepted["receipt"], "session_epoch": accepted["request"]["session_epoch"]}), "lifecycle_epoch")
    complete = next(c for c in fixture["cases"] if c["id"] == "delete-account-completed")
    retained = copy.deepcopy(complete["receipt"])
    retained["retained_records"][0].update(retention_until=None, retention_criteria=None)
    require(not validators["receipt"].is_valid(retained), "retention_basis")
    try:
        public.verify(b64(first["signed_receipt"]["signature"]["value"], 64), canonical({**result, "session_scope": "all-families"}).encode())
    except InvalidSignature:
        pass
    else:
        raise AssertionError("tampered receipt signature accepted")
    print(f"Independent profile verification passed: {count} unsigned account subjects, 7 synthetic signed lifecycle cases and adversarial checks. No live registry/deletion or signed account VC verification.")
