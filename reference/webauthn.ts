// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import { createHash, createPublicKey, verify } from "node:crypto";
import { base64urlBytes, canonical, decodeBase64url, parseJsonStrict, sha256 } from "./codec.ts";

type Value = Record<string, unknown>;
export interface RegisteredCredential {
  id: string; key_id: string; actor: string; operator_id: string; rp_id: string;
  allowed_origins: string[]; public_key: { kty: "EC"; crv: "P-256"; x: string; y: string };
  user_handle: string; sign_count: number; backup_eligible: boolean;
}
function derSignature(bytes: Uint8Array): void {
  if (bytes.length < 8 || bytes.length > 72 || bytes[0] !== 0x30 || bytes[1] !== bytes.length - 2) throw new Error("invalid_der");
  let index = 2;
  for (let item = 0; item < 2; item++) {
    if (bytes[index++] !== 2) throw new Error("invalid_der");
    const length = bytes[index++];
    if (!length || index + length > bytes.length || (bytes[index] & 0x80) ||
        (length > 1 && bytes[index] === 0 && !(bytes[index + 1] & 0x80))) throw new Error("invalid_der");
    index += length;
  }
  if (index !== bytes.length) throw new Error("invalid_der");
}
export function webauthnSignatureValid(value: Value, credential: RegisteredCredential): boolean {
  const proof = value.proof as Value;
  const auth = base64urlBytes(proof.authenticator_data as string, 37);
  const client = decodeBase64url(proof.client_data_json);
  const signature = decodeBase64url(proof.signature);
  derSignature(signature);
  return verify("sha256", Buffer.concat([auth, createHash("sha256").update(client).digest()]),
    createPublicKey({ key: credential.public_key, format: "jwk" }), signature);
}
// The credential is an independently enrolled RP record, never a key from the proof.
// Single-use challenge/epoch/current-status checks and counter updates need atomic RP state.
export function validateWebAuthnApproval(value: Value, credential: RegisteredCredential, authorization: unknown): number {
  const payload = value.payload as Value, proof = value.proof as Value;
  if (proof.credential_id !== credential.id) throw new Error("webauthn_credential");
  const clientBytes = decodeBase64url(proof.client_data_json);
  const client = parseJsonStrict(clientBytes) as Value;
  if (!client || typeof client !== "object" || Array.isArray(client) || client.type !== "webauthn.get") throw new Error("webauthn_type");
  if (client.origin !== undefined && !credential.allowed_origins.includes(client.origin as string)) throw new Error("webauthn_origin");
  if (!client.origin || client.crossOrigin === true || client.topOrigin !== undefined ||
      (client.crossOrigin !== undefined && client.crossOrigin !== false)) throw new Error("webauthn_cross_origin");
  if (client.challenge !== Buffer.from(sha256(canonical(payload)), "hex").toString("base64url")) throw new Error("webauthn_challenge");
  const auth = base64urlBytes(proof.authenticator_data as string, 37);
  if (!auth.subarray(0, 32).equals(createHash("sha256").update(credential.rp_id).digest())) throw new Error("webauthn_rp_id");
  const flags = auth[32];
  if ((flags & 5) !== 5 || (flags & 0xe2) || ((flags & 0x10) && !(flags & 8)) || !!(flags & 8) !== credential.backup_eligible) throw new Error("webauthn_flags");
  const count = auth.readUInt32BE(33);
  if ((count || credential.sign_count) && count <= credential.sign_count) throw new Error("webauthn_counter");
  if (proof.user_handle !== null && proof.user_handle !== credential.user_handle) throw new Error("webauthn_user_handle");
  const authority = (authorization as Value).payload as Value;
  const key = (authority.keys as Value[]).find(item => item.id === credential.key_id);
  const publicBytes = Buffer.concat([Buffer.from([4]), base64urlBytes(credential.public_key.x, 32), base64urlBytes(credential.public_key.y, 32)]).toString("base64url");
  if (payload.actor !== credential.actor || payload.operator_id !== credential.operator_id ||
      !key || key.role !== "assertion" || key.suite !== "P-256" || key.public_key !== publicBytes) throw new Error("webauthn_authority");
  if (!webauthnSignatureValid(value, credential)) throw new Error("webauthn_signature");
  return count;
}
