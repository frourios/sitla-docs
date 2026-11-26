# SPDX-License-Identifier: Apache-2.0
"""Independent payment-fixture verifier; no TypeScript or application imports."""
import datetime
import hashlib
import json
import re
from pathlib import Path
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from dilithium_py.ml_dsa import ML_DSA_44
from jsonschema import Draft202012Validator


def verify_payments(canonical, b64, verify_passkey):
    root = Path(__file__).resolve().parents[1] / "artifacts"
    fixture = json.loads((root / "payments-v1/vectors/payments.json").read_text())
    schemas = {}
    deferred_schema = json.loads((root / "payments-v2" / "schemas" / "collection-authorization.schema.json").read_text())
    Draft202012Validator.check_schema(deferred_schema)
    schemas["collection-authorization-v2"] = Draft202012Validator(deferred_schema)
    for folder, names in [("payments-v1", ["collection-authorization", "conditional-instruction", "payment-event", "online-vc", "export-manifest", "evidence-bundle"]), ("wire-v1", ["approved-action", "passkey-approved-action", "operational-key-authorization", "request-evidence"])]:
        for name in names:
            schema = json.loads((root / folder / "schemas" / (name + ".schema.json")).read_text())
            Draft202012Validator.check_schema(schema)
            schemas[name] = Draft202012Validator(schema)

    def require(ok, error):
        if not ok:
            raise ValueError(error)

    def encoded(value):
        return canonical(value).encode()

    def digest(value):
        return hashlib.sha256(encoded(value)).hexdigest()

    def instant(value):
        require(re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z", value), "payment_time")
        try:
            return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as error:
            raise ValueError("payment_time") from error

    def edverify(key, signature, message, error):
        try:
            Ed25519PublicKey.from_public_bytes(b64(key["x"], 32)).verify(b64(signature, 64), message)
        except InvalidSignature as cause:
            raise ValueError(error) from cause

    def subject(s):
        if s["profile"] in ("sitla-collection-authorization/1", "sitla-collection-authorization/2"):
            instant(s["authorizedAt"])
            require(s["authorizationId"] == s["approval"]["operationId"] and s["approvalDigest"] == s["approval"]["evidenceDigest"], "collection_approval")
            return
        if s["profile"] == "sitla-conditional-payment-instruction/1":
            require(s["instruction"]["escrowId"] == s["transactionId"] and s["instruction"]["termsDigest"] == s["termsDigest"], "instruction_binding")
            require(instant(s["acceptBy"]) <= instant(s["refundAt"]), "instruction_deadline")
            actor = s["buyer"] if s["action"] in ["deposit", "settle"] else s["seller"]
            require(s["assertingAccount"] == actor["id"] and s["id"] in [s["buyer"]["id"], s["seller"]["id"]], "instruction_actor")
            if s["action"] == "settle":
                require(s["inspection"]["performanceDigest"] == s["instruction"]["performanceDigest"], "inspection_digest")
            return
        instant(s["observedAt"])
        if s["occurredAt"] is not None:
            require(instant(s["occurredAt"]) <= instant(s["observedAt"]), "event_time")
        require(s["id"] == s[s["recipientRole"]]["id"] and s["allocationId"].startswith(s["transactionId"] + ":"), "event_recipient")
        require((s["sequence"] == 0) == (s["predecessorDigest"] is None), "event_chain")
        require(s["platformFeeMinor"] + s["sellerNetMinor"] == s["originalGrossMinor"], "event_amounts")
        for item in s["terms"]:
            require(item["feeMinor"] + item["netMinor"] == item["grossMinor"], "event_amounts")
        for field, itemfield in [("originalGrossMinor", "grossMinor"), ("platformFeeMinor", "feeMinor"), ("sellerNetMinor", "netMinor")]:
            require(sum(item[itemfield] for item in s["terms"]) == s[field], "event_allocation")
        if "collection" in s:
            require(s["stage"] == "capture" and s["outcome"] == "confirmed" and s["providerConfirmed"] and s["amountMinor"] == s["collection"]["grossAmountMinor"] == s["originalGrossMinor"], "collection_capture")
        if s["amountMinor"] is None:
            require(s["amountBasis"] == "unallocated-provider-observation", "event_unknown_amount")
        elif s["amountBasis"] == "seller-net":
            require(s["amountMinor"] <= s["sellerNetMinor"], "event_amount_basis")
        elif s["amountBasis"] == "allocation-gross":
            require(s["amountMinor"] <= s["originalGrossMinor"], "event_amount_basis")
        if s["providerConfirmed"]:
            require(s["providerReference"] is not None, "event_provider")

    def wrapper(record):
        pieces = record["secured"].split(".")
        require(len(pieces) == 3, "payment_jws")
        header = json.loads(b64(pieces[0]))
        require(encoded(header) == b64(pieces[0]) and sorted(header) == ["alg", "kid", "typ"], "payment_jws_header")
        require(header["alg"] == "EdDSA" and header["typ"] == "vc+jwt" and header["kid"] in fixture["acceptedKeys"], "payment_issuer_key")
        edverify(fixture["acceptedKeys"][header["kid"]], pieces[2], (pieces[0] + "." + pieces[1]).encode(), "payment_signature")
        vc = json.loads(b64(pieces[1]))
        require(encoded(vc) == b64(pieces[1]) and schemas["online-vc"].is_valid(vc), "payment_schema")
        operator = fixture["expectedIssuer"]
        require(vc["issuer"] == operator and vc["id"] == operator + "/credentials/" + record["id"] and header["kid"].startswith(operator + "/keys/") and vc["credentialStatus"]["id"] == operator + "/api/credentials/" + record["id"] + "/status", "payment_issuer")
        instant(vc["validFrom"])
        require(vc == record["vc"] and record["digest"] == digest(vc) and record["format"] == "application/vc+jwt", "payment_copy")
        s = vc["credentialSubject"]
        name = {"sitla-collection-authorization/1": "collection-authorization", "sitla-collection-authorization/2": "collection-authorization-v2", "sitla-conditional-payment-instruction/1": "conditional-instruction", "sitla-online-payment-event/1": "payment-event"}.get(s["profile"])
        require(name and schemas[name].is_valid(s), "payment_schema")
        typename = {"collection-authorization": "CollectionAuthorization", "collection-authorization-v2": "CollectionAuthorization", "conditional-instruction": "ConditionalPaymentInstruction", "payment-event": "OperatorPaymentEventCredential"}[name]
        require(vc["type"][1] == "urn:sitla:credential:" + typename + ":1", "payment_type")
        subject(s)
        return s

    def approval(s, e):
        require(s["approval"]["evidenceDigest"] == digest(e), "payment_approval_digest")
        p, sig, request, review, args = [e[k] for k in ["payload", "signature", "request", "reviewedContext", "arguments"]]
        grant, descriptor = e["identity"]["grant"], e["identity"]["descriptor"]
        g = grant["payload"]
        require(schemas["operational-key-authorization"].is_valid(grant) and schemas["request-evidence"].is_valid(request), "payment_approval_schema")
        require(grant["signature"]["suite"] == "ML-DSA-44" and grant["signature"]["context"] == "SITLA/root/1" and g["operation"] == "replace-operational-keys", "payment_approval_key")
        require(g["audience"] == fixture["expectedIssuer"] and g["purpose"] == "sitla-online-account" and p["operator_id"] == fixture["expectedIssuer"] and p["audience"] == fixture["expectedIssuer"], "payment_approval_operator")
        require(p["key_authorization_digest"] == digest(grant) and p["actor"] == g["root"] and instant(p["issued_at"]) >= instant(g["issued_at"]) and instant(p["expires_at"]) <= instant(g["expires_at"]), "payment_approval_authority")
        import base64
        did = "did:sitla:v1:" + base64.urlsafe_b64encode(hashlib.sha3_512(encoded(descriptor)).digest()).decode().rstrip("=")
        require(did == g["root"], "payment_holder_root")
        require(ML_DSA_44.verify(b64(descriptor["identityPublicKey"], 1312), encoded(g), b64(grant["signature"]["value"], 2420), ctx=b"SITLA/root/1"), "payment_root_signature")
        require(instant(g["expires_at"]) > instant(g["issued_at"]) and (g["sequence"] == 0) == (g["predecessor_digest"] is None), "invalid_predecessor")
        require(len({k["id"] for k in g["keys"]}) == len(g["keys"]), "duplicate_key_id")
        if sig["suite"] == "WebAuthn-P256":
            credential = fixture.get("trustedEnrollment")
            response = sig["response"]
            require(credential and response["type"] == "public-key" and response["id"] == credential["id"] == response["rawId"], "payment_passkey_enrollment")
            browser = response["response"]
            assertion = {"payload": p, "proof": {"profile": "SITLA/webauthn-approval/1", "suite": "WebAuthn-ES256", "credential_id":response["id"], "client_data_json": browser["clientDataJSON"], "authenticator_data": browser["authenticatorData"], "signature": browser["signature"], "user_handle": browser.get("userHandle")}}
            require(schemas["passkey-approved-action"].is_valid(assertion), "payment_approval_schema")
            verify_passkey(assertion, credential, grant)
        else:
            key = next((k for k in g["keys"] if k["id"] == sig["key_id"]), None)
            require(key and key["suite"] == "Ed25519" and key["role"] == "assertion" and schemas["approved-action"].is_valid({"payload": p, "signature": sig}), "payment_approval_key")
            edverify({"x": key["public_key"]}, sig["value"], encoded(p), "payment_holder_signature")
        require(instant(p["expires_at"]) > instant(p["issued_at"]), "invalid_lifetime")
        require(32 <= len(b64(p["challenge"])) <= 64, "invalid_challenge")
        require(p["policy_digest"] == hashlib.sha256(e["policyBytes"].encode()).hexdigest(), "policy_digest_mismatch")
        require(all(p[k] == request[k] for k in ["request_id", "operator_id", "audience", "purpose", "challenge", "policy_digest"]) and p["request_digest"] == digest(request) and instant(p["issued_at"]) >= instant(request["issued_at"]) and instant(p["expires_at"]) <= instant(request["expires_at"]), "request_binding_failed")
        require(p["event_reference"] == s["approval"]["operationId"] and p["payload_digest"] == digest(review) and request["subject_reference"] == "urn:sha256:" + digest(review) and args == review["arguments"], "payment_approval_binding")
        is_collection = s["profile"] in ("sitla-collection-authorization/1", "sitla-collection-authorization/2")
        operation = ("authorize_profile_collection" if s["scope"]["kind"] == "profile" else "accept_work") if is_collection else {"collection-authorize": "authorize_escrow_collection", "deposit": "notify_escrow_deposit", "accept": "accept_escrow", "refund": "refund_escrow", "settle": "settle_escrow"}[s["action"]]
        actor = s["seller"] if is_collection or s["action"] not in ["deposit", "settle"] else s["buyer"]
        require(p["operation"] == operation and review["operation"] == operation and review["accountUri"] == actor["id"] and p["actor"] == actor["controllerDid"], "payment_approval_actor")
        if "instruction" in s:
            require(args == s["instruction"], "payment_approval_arguments")
            checked = review["review"]
            terms = checked["details"]["terms"]
            require(p["amount_minor"] == s["amountMinor"] == checked["amountMinor"] and p["currency"] == s["currency"] and p["terms_digest"] == s["termsDigest"] == checked["termsDigest"], "payment_instruction_amount")
            require(terms["buyer"] == s["buyer"] and terms["seller"] == s["seller"] and terms["acceptBy"] == int(instant(s["acceptBy"]).timestamp() * 1000) and terms["refundAt"] == int(instant(s["refundAt"]).timestamp() * 1000), "payment_instruction_terms")
        else:
            consent = args.get("consent", args.get("collectionConsent", {}))
            require(all(consent.get(k) is True for k in ["authorizeReceipt", "dischargeOnStripeCapture", "authorizeRefundsUnderAgreedTerms"]), "payment_collection_consent")
            details = review["review"]["details"]
            checked = details["offer"] if s["scope"]["kind"] == "profile" else details
            require(checked["processorAccount"] == s["processorAccount"] and checked["feeBasisPoints"] == s["feeBasisPoints"] and checked["livemode"] == s["livemode"], "payment_collection_destination")
            if s["scope"]["kind"] == "profile":
                require(args["offerDigest"] == digest(checked) and p["terms_digest"] == args["offerDigest"] and args["profileVersion"] == s["scope"]["profileVersion"] and s["scope"] == checked["scope"] and s["seller"] == checked["seller"] and s["agent"] == checked["operator"] and s["refundPolicy"] == checked["refundPolicy"] and s["currency"] == checked["currency"], "payment_collection_scope")
            else:
                work = details["work"]
                require(args["workId"] == s["scope"]["workId"] == work["id"] and args["termsDigest"] == s["scope"]["termsDigest"] == work["termsDigest"] and work["amountMinor"] == s["scope"]["amountLimitMinor"] and work["funding"] == s["scope"]["funding"] and work["currency"] == s["currency"] and work["sellerAccountUri"] == s["seller"]["id"], "payment_collection_scope")
        if "agent" in s:
            require(s["agent"] == fixture["expectedIssuer"], "payment_approval_operator")

    def run(item):
        s = wrapper(item["record"])
        if "approval" in s:
            approval(s, item["evidence"])
        if s["profile"] == "sitla-online-payment-event/1":
            if s["sequence"] == 0:
                require("previousRecord" not in item, "payment_history")
            else:
                previous = item.get("previousRecord")
                require(previous and s["predecessorDigest"] == digest(previous), "payment_history")
                old = previous["vc"]["credentialSubject"]
                require(old["profile"] == s["profile"] and old["id"] == s["id"] and old["transactionId"] == s["transactionId"] and s["sequence"] == old["sequence"] + 1 and instant(s["observedAt"]) >= instant(old["observedAt"]), "payment_history")

    for item in fixture["positive"]:
        run(item)
    for item in fixture["negative"]:
        try:
            run(item)
        except ValueError as error:
            require(str(error) == item["error"], item["id"] + ": wrong rejection: " + str(error))
        else:
            raise AssertionError(item["id"] + ": negative accepted")
    def bundle(value):
        require(schemas["evidence-bundle"].is_valid(value), "bundle_schema")
        pieces = value["signedManifest"].split(".")
        require(len(pieces) == 3, "bundle_jws")
        header = json.loads(b64(pieces[0]))
        require(encoded(header) == b64(pieces[0]) and sorted(header) == ["alg", "kid", "typ"] and header["alg"] == "EdDSA" and header["typ"] == "sitla-export+jws" and header["kid"] in fixture["acceptedKeys"] and header["kid"].startswith(fixture["expectedIssuer"] + "/keys/"), "bundle_issuer_key")
        edverify(fixture["acceptedKeys"][header["kid"]], pieces[2], (pieces[0] + "." + pieces[1]).encode(), "bundle_signature")
        m = json.loads(b64(pieces[1]))
        require(encoded(m) == b64(pieces[1]) and m == value["manifest"] and m["operator"] == fixture["expectedIssuer"], "bundle_manifest")
        instant(m["exportedAt"])
        require(m["complete"] == (m["nextCursor"] is None), "bundle_pagination")
        require(m["schemaDigest"] == digest(value["schema"]) and m["keyMaterialDigest"] == digest(value["keyMaterial"]), "bundle_metadata")
        require(m["records"] == [{"id": r["id"], "digest": digest(r)} for r in value["records"]] and len({r["id"] for r in m["records"]}) == len(m["records"]), "bundle_records")
        require(m["attachments"] == [{"kind": a["kind"], "reference": a["reference"], "digest": digest(a)} for a in value["attachments"]], "bundle_attachments")
        for record in value["records"]:
            wrapper(record)

    for value in fixture["bundles"]["positive"]:
        bundle(value)
    for item in fixture["bundles"]["negative"]:
        try:
            bundle(item["value"])
        except ValueError as error:
            require(str(error) == item["error"], item["id"] + ": wrong bundle rejection: " + str(error))
        else:
            raise AssertionError(item["id"] + ": bundle negative accepted")
    print(f"Independent payment verification passed: 6 schemas, {len(fixture['positive'])} signed positive, {len(fixture['negative'])} negative records, 2 signed bundle pages and 5 bundle negatives; no live processor or legal verification.")

    fixture = json.loads((root / "payments-v2/passkey-settlement.json").read_text())
    for item in fixture["positive"]:
        run(item)
    for item in fixture["negative"]:
        try:
            run(item)
        except ValueError as error:
            require(str(error) == item["error"], item["id"] + ": wrong passkey rejection: " + str(error))
        else:
            raise AssertionError(item["id"] + ": passkey negative accepted")
    enrollment = fixture.pop("trustedEnrollment")
    try:
        run(fixture["positive"][0])
    except ValueError as error:
        require(str(error) == "payment_passkey_enrollment", "missing trusted enrollment rejection")
    else:
        raise AssertionError("missing trusted enrollment accepted")
    finally:
        fixture["trustedEnrollment"] = enrollment
    print("Independent supplemental WebAuthn payment verification passed: 1 positive, 1 signed negative, missing trusted enrollment rejected.")
