// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import { verify, type KeyObject } from "node:crypto";
import { base64urlBytes, canonical, decodeBase64url, parseTime, sha256 } from "./codec.ts";

export interface LifecycleRequest {
  protocol: "sitla-wire/1";
  profile: "sitla-account-lifecycle/1";
  operation: "logout" | "logout-all" | "revoke-mandate" | "delete-account";
  operator_id: string; account_id: string; request_id: string; audience: string;
  purpose: "account-lifecycle"; challenge: string; issued_at: string; expires_at: string;
  policy_digest: string; session_epoch: number; recovery_epoch: number;
  idempotency_key: string; mandate_id: string | null;
}
export interface LifecycleReceipt {
  protocol: "sitla-wire/1"; profile: "sitla-account-lifecycle/1"; domain: "SITLA/lifecycle-receipt/1";
  operation: LifecycleRequest["operation"]; operator_id: string; account_id: string;
  request_id: string; request_digest: string; audience: string; mandate_id: string | null;
  state: "accepted" | "processing" | "completed" | "rejected";
  recorded_at: string; effective_at: string | null; completed_at: string | null;
  session_epoch: number; session_scope: string; mandate_scope: string;
  account_state: string; credential_scope: string; status_ref: string | null;
  retained_records: { category: string; purpose: string; basis: string; retention_until: string | null; retention_criteria: string | null }[];
  error: string | null;
}
export interface LifecycleContext {
  operatorId: string; accountId: string; sessionEpoch: number; recoveryEpoch: number;
  now: string; maxAgeSeconds: number; policyBytes: Uint8Array;
}
// JSON Schema first. Context is trusted host state, not caller-supplied authority.
// This helper checks static bindings/freshness, and does not authorize or execute a command.
export function validateLifecycleRequest(request: LifecycleRequest, context: LifecycleContext): void {
  const origin = new URL(request.operator_id);
  if (request.operator_id !== origin.origin || origin.protocol !== "https:" ||
      !request.account_id.startsWith(`${request.operator_id}/accounts/`) ||
      !/^[A-Za-z0-9_-]{22}$/.test(request.account_id.slice(`${request.operator_id}/accounts/`.length))) throw new Error("lifecycle_target_invalid");
  if (request.operator_id !== context.operatorId || request.account_id !== context.accountId) throw new Error("lifecycle_target_mismatch");
  if (request.session_epoch !== context.sessionEpoch || request.recovery_epoch !== context.recoveryEpoch) throw new Error("lifecycle_epoch_mismatch");
  if (!Number.isSafeInteger(context.maxAgeSeconds) || context.maxAgeSeconds <= 0) throw new Error("lifecycle_policy_invalid");
  const issued = parseTime(request.issued_at), expires = parseTime(request.expires_at), now = parseTime(context.now);
  if (expires <= issued || expires - issued > context.maxAgeSeconds * 1000) throw new Error("lifecycle_lifetime_invalid");
  if (now < issued || now >= expires) throw new Error("lifecycle_request_expired");
  const challenge = decodeBase64url(request.challenge);
  if (challenge.length < 32 || challenge.length > 64) throw new Error("lifecycle_challenge_invalid");
  if (request.policy_digest !== sha256(context.policyBytes)) throw new Error("lifecycle_policy_mismatch");
  if (request.operation === "revoke-mandate" && (!request.mandate_id || request.mandate_id !== request.mandate_id.trim() || request.mandate_id.includes("*"))) throw new Error("lifecycle_target_invalid");
}
// JSON Schema enforces operation/state/scope combinations before this semantic check.
export function validateLifecycleReceipt(request: LifecycleRequest, receipt: LifecycleReceipt): void {
  for (const field of ["operation", "operator_id", "account_id", "request_id", "audience", "mandate_id"] as const)
    if (request[field] !== receipt[field]) throw new Error("lifecycle_receipt_binding_failed");
  if (receipt.request_digest !== sha256(canonical(request))) throw new Error("lifecycle_receipt_binding_failed");
  const recorded = parseTime(receipt.recorded_at);
  if (recorded < parseTime(request.issued_at)) throw new Error("lifecycle_receipt_time_invalid");
  if (receipt.effective_at !== null) {
    const cutoff = parseTime(receipt.effective_at);
    if (cutoff < parseTime(request.issued_at) || cutoff >= parseTime(request.expires_at) || recorded < cutoff) throw new Error("lifecycle_receipt_time_invalid");
    if (receipt.completed_at !== null && (parseTime(receipt.completed_at) < cutoff || parseTime(receipt.completed_at) > recorded)) throw new Error("lifecycle_receipt_time_invalid");
  }
  if (receipt.state !== "rejected") {
    if (["logout-all", "delete-account"].includes(request.operation)) {
      if (receipt.session_epoch <= request.session_epoch) throw new Error("lifecycle_epoch_not_advanced");
    } else if (receipt.session_epoch !== request.session_epoch) throw new Error("lifecycle_unrelated_epoch_change");
  }
  if (receipt.status_ref) {
    const status = new URL(receipt.status_ref);
    if (status.origin !== request.operator_id) throw new Error("lifecycle_status_origin_mismatch");
    if (status.username || status.password || status.search || status.hash || status.href !== receipt.status_ref) throw new Error("lifecycle_status_ref_invalid");
  }
  for (const retained of receipt.retained_records) if (retained.retention_until !== null) parseTime(retained.retention_until);
}
export function lifecycleSignatureValid(
  artifact: { payload: LifecycleReceipt; signature: { suite: string; key_id: string; value: string } },
  expectedKeyId: string, trustedKey: KeyObject,
): boolean {
  if (artifact.signature.suite !== "Ed25519" || artifact.signature.key_id !== expectedKeyId ||
      artifact.payload.domain !== "SITLA/lifecycle-receipt/1" || trustedKey.asymmetricKeyType !== "ed25519") return false;
  return verify(null, Buffer.from(canonical(artifact.payload)), trustedKey, base64urlBytes(artifact.signature.value, 64));
}
