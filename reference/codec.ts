// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
/// <reference lib="es2024.string" />
import { createHash } from "node:crypto";

export interface IdentityDescriptor {
  version: 1;
  identitySuite: "ML-DSA-44";
  identityPublicKey: string;
}
export const REFERENCE_LIMITS = { maxBytes: 65536, maxDepth: 32, maxNodes: 10000 } as const;
export interface Limits { maxBytes: number; maxDepth: number; maxNodes: number }
type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw new Error("invalid_object");
  return value as RecordValue;
}
function base64url(value: unknown): Buffer {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("invalid_base64url");
  const bytes = Buffer.from(value, "base64url");
  if (bytes.toString("base64url") !== value) throw new Error("invalid_base64url");
  return bytes;
}
export function base64urlBytes(value: string, expectedLength: number): Buffer {
  const bytes = base64url(value);
  if (bytes.length !== expectedLength) throw new Error("invalid_base64url");
  return bytes;
}
export function canonical(value: unknown, limits: Limits = REFERENCE_LIMITS): string {
  let nodes = 0;
  function visit(item: unknown, depth: number): string {
    if (++nodes > limits.maxNodes || depth > limits.maxDepth) throw new Error("resource_limit");
    if (item === null || typeof item === "boolean") return JSON.stringify(item);
    if (typeof item === "string") {
      if (!item.isWellFormed()) throw new Error("invalid_unicode");
      return JSON.stringify(item);
    }
    if (typeof item === "number") {
      if (!Number.isSafeInteger(item) || Object.is(item, -0)) throw new Error("invalid_number");
      return String(item);
    }
    if (Array.isArray(item)) {
      if (Object.keys(item).length !== item.length) throw new Error("invalid_array");
      return `[${item.map(child => visit(child, depth + 1)).join(",")}]`;
    }
    const object = record(item);
    return `{${Object.keys(object).sort().map(key => `${visit(key, depth + 1)}:${visit(object[key], depth + 1)}`).join(",")}}`;
  }
  const result = visit(value, 0);
  if (Buffer.byteLength(result, "utf8") > limits.maxBytes) throw new Error("resource_limit");
  return result;
}
export function parseCanonical(bytes: Uint8Array, limits: Limits = REFERENCE_LIMITS): unknown {
  if (bytes.byteLength > limits.maxBytes) throw new Error("resource_limit");
  const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  let quoted = false, escaped = false, depth = 0;
  // Scan nesting before JSON.parse, ignoring braces inside JSON strings.
  for (const char of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{" || char === "[") {
      if (++depth > limits.maxDepth) throw new Error("resource_limit");
    } else if (char === "}" || char === "]") depth--;
  }
  const value: unknown = JSON.parse(text);
  if (canonical(value, limits) !== text) throw new Error("noncanonical_wire");
  return value;
}
export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
export function deriveDid(descriptor: IdentityDescriptor): string {
  if (canonical(Object.keys(descriptor).sort()) !== canonical(["identityPublicKey", "identitySuite", "version"]) ||
      descriptor.version !== 1 || descriptor.identitySuite !== "ML-DSA-44") throw new Error("invalid_descriptor");
  base64urlBytes(descriptor.identityPublicKey, 1312);
  return `did:sitla:v1:${createHash("sha3-512").update(canonical(descriptor), "utf8").digest("base64url")}`;
}
export function didDocument(descriptor: IdentityDescriptor) {
  const id = deriveDid(descriptor), method = `${id}#root`;
  return {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id,
    verificationMethod: [{ id: method, type: "urn:sitla:verification-method:akp-jwk-v1", controller: id,
      publicKeyJwk: { kty: "AKP", alg: "ML-DSA-44", pub: descriptor.identityPublicKey } }],
    authentication: [method], assertionMethod: [method], capabilityDelegation: [method],
  };
}
export function authorizationBytes(payload: unknown): Buffer { return Buffer.from(canonical(payload), "utf8"); }
export function parseTime(value: unknown): number {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) throw new Error("invalid_time");
  if (value.startsWith("0000-")) throw new Error("invalid_time");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString().replace(".000Z", "Z") !== value) throw new Error("invalid_time");
  return date.getTime();
}
export interface SemanticContext { descriptor?: IdentityDescriptor; request?: unknown; previous?: unknown }
// Validate the JSON Schema first. These are static semantic checks, not trust,
// current status, credential-policy validation, signature verification or replay storage.
export function validateSemantics(schema: string, input: unknown, context: SemanticContext = {}): void {
  const value = record(input);
  canonical(value);
  if (schema === "identity-descriptor") { deriveDid(value as unknown as IdentityDescriptor); return; }
  if (schema === "did-document") {
    if (!context.descriptor || canonical(value) !== canonical(didDocument(context.descriptor))) throw new Error("did_document_mismatch");
    return;
  }
  const payload = value.payload ? record(value.payload) : value;
  if (parseTime(payload.expires_at) <= parseTime(payload.issued_at)) throw new Error("invalid_lifetime");
  if (payload.challenge !== undefined) {
    const size = base64url(payload.challenge).length;
    if (size < 32 || size > 64) throw new Error("invalid_challenge");
  }
  if (schema === "operational-key-authorization") {
    if (!context.descriptor || payload.root !== deriveDid(context.descriptor)) throw new Error("root_mismatch");
    if ((payload.sequence === 0) !== (payload.predecessor_digest === null)) throw new Error("invalid_predecessor");
    const keys = payload.keys as RecordValue[], ids = keys.map(key => key.id);
    if (new Set(ids).size !== ids.length) throw new Error("duplicate_key_id");
    for (const key of keys) base64urlBytes(key.public_key as string, 32);
    base64urlBytes(record(value.signature).value as string, 2420);
    if (context.previous) validateSuccessor(context.previous, value);
  }
  if (schema === "approved-action" || schema === "service-assertion") base64urlBytes(record(value.signature).value as string, 64);
  if (schema === "evidence-envelope") {
    for (const observation of value.status_observations as RecordValue[]) {
      if (observation.status_as_of !== null) parseTime(observation.status_as_of);
      if (observation.expires_at !== null) parseTime(observation.expires_at);
    }
  }
  if (context.request && ["evidence-envelope", "approved-action", "service-assertion"].includes(schema)) {
    const request = record(context.request);
    for (const field of ["request_id", "operator_id", "audience", "purpose", "challenge", "policy_digest"])
      if (payload[field] !== request[field]) throw new Error("request_binding_failed");
    if (payload.request_digest !== sha256(canonical(request))) throw new Error("request_binding_failed");
    if (schema === "evidence-envelope" && value.evidence_level !== request.evidence_level) throw new Error("request_binding_failed");
    if (parseTime(payload.expires_at) > parseTime(request.expires_at) || parseTime(payload.issued_at) < parseTime(request.issued_at)) throw new Error("request_binding_failed");
  }
}
export function validateSuccessor(previous: unknown, next: unknown): void {
  const oldRecord = record(previous), newRecord = record(next);
  const oldPayload = record(oldRecord.payload), newPayload = record(newRecord.payload);
  for (const field of ["root", "authorization_series_id", "operational_did", "audience", "purpose"])
    if (oldPayload[field] !== newPayload[field]) throw new Error("series_scope_changed");
  if (oldPayload.operation === "revoke-operational-keys") throw new Error("series_revoked");
  if (newPayload.sequence !== Number(oldPayload.sequence) + 1 || newPayload.predecessor_digest !== sha256(canonical(previous))) throw new Error("invalid_chain");
  if (parseTime(newPayload.issued_at) < parseTime(oldPayload.issued_at)) throw new Error("invalid_chain_time");
}
