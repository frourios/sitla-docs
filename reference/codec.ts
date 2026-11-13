// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
// Offline byte-format reference only; not a production verifier or key manager.
/// <reference lib="es2024.string" />
import { createHash } from 'node:crypto';

export interface IdentityDescriptor {
  version: 1;
  identitySuite: "ML-DSA-44";
  identityPublicKey: string;
}

export function base64urlBytes(value: string, expectedLength: number): Buffer {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error('invalid_base64url');
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.length !== expectedLength || bytes.toString('base64url') !== value)
    throw new Error('invalid_base64url');
  return bytes;
}

// This subset contains integers only. UTF-16 property sorting/JSON string encoding
// match JCS; lone surrogates and unsafe/fractional numbers are rejected.
export function canonical(value: unknown): string {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'string') {
    if (!value.isWellFormed()) throw new Error('invalid_unicode');
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) throw new Error('invalid_number');
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${canonical(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  throw new Error('invalid_json_value');
}

// A strict canonical wire encoding also prevents duplicate/extra spellings from
// surviving JSON.parse. Receivers reject BOM, whitespace and alternate escapes.
export function parseCanonical(bytes: Uint8Array): unknown {
  const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  const value = JSON.parse(text);
  if (canonical(value) !== text) throw new Error('noncanonical_wire');
  return value;
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function deriveDid(descriptor: IdentityDescriptor): string {
  if (canonical(Object.keys(descriptor).sort()) !== canonical(['identityPublicKey', 'identitySuite', 'version']) ||
      descriptor.version !== 1 || descriptor.identitySuite !== 'ML-DSA-44')
    throw new Error('invalid_descriptor');
  base64urlBytes(descriptor.identityPublicKey, 1312);
  return `did:sitla:v1:${createHash('sha3-512').update(canonical(descriptor), 'utf8').digest('base64url')}`;
}

export function authorizationBytes(payload: unknown): Buffer {
  return Buffer.from(canonical(payload), 'utf8');
}
