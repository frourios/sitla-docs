// SPDX-License-Identifier: Apache-2.0
// Manual, nonpersonal supplemental payment attachment fixture; no private keys persisted.
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { canonical, deriveDid, sha256 } from "../reference/codec.ts";
import { paymentDigest as digest } from "../reference/payments.ts";
const legacy = JSON.parse(await readFile(new URL("../artifacts/payments-v1/vectors/payments.json", import.meta.url), "utf8"));
const item = structuredClone(legacy.positive.find((value: any) => value.id === "instruction-settle"));
const operator = legacy.expectedIssuer, kid = operator + "/keys/passkey-fixture";
const root = generateKeyPairSync("ml-dsa-44"), authenticator = generateKeyPairSync("ec", { namedCurve: "prime256v1" }), issuer = generateKeyPairSync("ed25519");
const descriptor = { version: 1 as const, identitySuite: "ML-DSA-44" as const, identityPublicKey: root.publicKey.export({format:"jwk"}).pub as string };
const did = deriveDid(descriptor), credentialId = Buffer.from("synthetic-rp-credential").toString("base64url"), pub = authenticator.publicKey.export({format:"jwk"});
const keyId = operator + "/keys/passkeys/" + credentialId + "-approval";
const publicPoint = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x!, "base64url"), Buffer.from(pub.y!, "base64url")]).toString("base64url");
const credential = { id: credentialId, key_id: keyId, actor: did, operator_id: operator, rp_id: new URL(operator).hostname, allowed_origins: [operator], public_key: pub, user_handle: Buffer.from("synthetic-user").toString("base64url"), sign_count: 0, backup_eligible: false };
const evidence = item.evidence, subject = item.record.vc.credentialSubject;
subject.buyer.controllerDid = did; subject.seller.controllerDid = did;
evidence.reviewedContext.review.details.terms.buyer = subject.buyer;
evidence.reviewedContext.review.details.terms.seller = subject.seller;
const gp = { ...evidence.identity.grant.payload, root: did, operational_did: did, keys: [{ id:keyId, suite:"P-256", public_key:publicPoint, role:"assertion" }] };
const grant = { payload:gp, signature:{suite:"ML-DSA-44",context:"SITLA/root/1",value:sign(null,Buffer.from(canonical(gp)),{key:root.privateKey,context:Buffer.from("SITLA/root/1")}).toString("base64url")} };
evidence.identity = {descriptor,grant};
evidence.request.subject_reference = "urn:sha256:" + digest(evidence.reviewedContext);
Object.assign(evidence.payload,{actor:did,key_authorization_digest:digest(grant),payload_digest:digest(evidence.reviewedContext),request_digest:digest(evidence.request)});
const client = Buffer.from(JSON.stringify({type:"webauthn.get",challenge:Buffer.from(sha256(canonical(evidence.payload)),"hex").toString("base64url"),origin:operator,crossOrigin:false}));
const auth = Buffer.concat([createHash("sha256").update(credential.rp_id).digest(),Buffer.from([5,0,0,0,1])]);
evidence.signature = {suite:"WebAuthn-P256",response:{id:credentialId,rawId:credentialId,type:"public-key",response:{clientDataJSON:client.toString("base64url"),authenticatorData:auth.toString("base64url"),signature:sign("sha256",Buffer.concat([auth,createHash("sha256").update(client).digest()]),authenticator.privateKey).toString("base64url"),userHandle:credential.user_handle}}};
subject.approval.evidenceDigest = digest(evidence);
function secure(record: any) {
  record.digest = digest(record.vc);
  const encoded = [canonical({alg:"EdDSA",kid,typ:"vc+jwt"}),canonical(record.vc)].map(x=>Buffer.from(x).toString("base64url")).join(".");
  record.secured = encoded + "." + sign(null,Buffer.from(encoded),issuer.privateKey).toString("base64url");
}
secure(item.record);
item.id = "passkey-settlement";
const changedAmount = structuredClone(item);
changedAmount.id = "passkey-payment-amount-mismatch";
changedAmount.record.vc.credentialSubject.amountMinor++;
secure(changedAmount.record);
changedAmount.error = "payment_instruction_amount";
await writeFile(new URL("../artifacts/payments-v2/passkey-settlement.json",import.meta.url),JSON.stringify({profile:"synthetic-payment-passkey-attachment/1",expectedIssuer:operator,acceptedKeys:{[kid]:issuer.publicKey.export({format:"jwk"})},trustedEnrollment:credential,positive:[item],negative:[changedAmount]},null,2)+"\n");
