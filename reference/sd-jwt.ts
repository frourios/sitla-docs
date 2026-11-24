// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
// RFC 9901 subset: SHA-256 disclosures, Ed25519 JWS, nested objects/arrays.
// Issuer discovery/trust and live status are separate caller policies.
import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { parseJsonStrict } from "./codec.ts";
type JWK = { kty?:string;crv?:string;x?:string;kid?:string;d?:string };
const fail = (code:string):never => { throw new Error(code); };
async function importJWK(key:JWK,_alg:string) { return key; }
async function compactVerify(jwt:string,key:JWK,_options:unknown) {
  const parts = jwt.split(".");
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part) || Buffer.from(part,"base64url").toString("base64url") !== part)) fail("invalid_jws");
  const header = decode(parts[0]!);
  if (header.alg !== "EdDSA" || (key.kid && header.kid !== key.kid) || key.d || key.kty !== "OKP" || key.crv !== "Ed25519") fail("issuer_key_invalid");
  if (!verifySignature(null,Buffer.from(parts[0]+"."+parts[1]),createPublicKey({key,format:"jwk"}),Buffer.from(parts[2]!,"base64url"))) fail("invalid_signature");
}
type Value = Record<string, any>;
const digest = (text: string) => createHash("sha256").update(text).digest("base64url");
function decode(value: string): any {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) fail("sd_jwt_encoding_invalid");
  const bytes = Buffer.from(value, "base64url");
  if (bytes.toString("base64url") !== value) fail("sd_jwt_encoding_invalid");
  return parseJsonStrict(bytes);
}
const escape = (key: string) => key.replaceAll("~", "~0").replaceAll("/", "~1");
export function unpackSDJWT(compact: string) {
  if (compact.length > 262144) fail("credential_size_limit");
  const parts = compact.split("~"),
    jwt = parts.shift()!;
  if (!parts.length) fail("selective_disclosure_required");
  if (parts.length > 1024) fail("sd_jwt_disclosure_limit");
  const end = parts.pop()!;
  const kb = end.includes(".") ? end : null;
  if (end && !kb) fail("sd_jwt_termination_invalid");
  const header = decode(jwt.split(".")[0]!);
  if (
    header.typ !== "dc+sd-jwt" ||
    header.alg !== "EdDSA" ||
    !header.kid ||
    header.jwk ||
    header.jku ||
    header.x5u ||
    header.crit
  )
    fail("credential_format_unsupported");
  const raw = decode(jwt.split(".")[1]!);
  if (
    raw._sd_alg !== "sha-256" ||
    typeof raw.iss !== "string" ||
    typeof raw.vct !== "string" ||
    !Number.isSafeInteger(raw.iat) ||
    typeof raw.jti !== "string"
  )
    fail("sd_jwt_claims_invalid");
  const disclosed = new Map<string, { encoded: string; value: any; path?: string }>();
  for (const encoded of parts) {
    const value = decode(encoded),
      key = digest(encoded);
    if (
      disclosed.has(key) ||
      !Array.isArray(value) ||
      ![2, 3].includes(value.length) ||
      typeof value[0] !== "string" ||
      value[0].length < 16
    )
      fail("sd_jwt_disclosure_invalid");
    disclosed.set(key, { encoded, value });
  }
  const used = new Set<string>(),
    allDigests = new Set<string>();
  const reference = (hash: any, path: string, object: boolean) => {
    if (
      typeof hash !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(hash) ||
      Buffer.from(hash, "base64url").toString("base64url") !== hash ||
      allDigests.has(hash)
    )
      fail("sd_jwt_digest_invalid");
    allDigests.add(hash);
    const item = disclosed.get(hash);
    if (!item) return undefined;
    if (item.value.length !== (object ? 3 : 2)) fail("sd_jwt_disclosure_invalid");
    used.add(hash);
    const name = object ? item.value[1] : null;
    if (
      object &&
      (typeof name !== "string" ||
        ["_sd", "_sd_alg", "...", "__proto__", "constructor", "prototype"].includes(name))
    )
      fail("sd_jwt_disclosure_invalid");
    item.path = object ? `${path}/${escape(name)}` : path;
    return { name, value: walk(item.value.at(-1), item.path) };
  };
  const walk = (value: any, path: string): any => {
    if (Array.isArray(value))
      return value.flatMap((item, index) => {
        if (
          item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          Object.hasOwn(item, "...")
        ) {
          if (Object.keys(item).length !== 1) fail("sd_jwt_disclosure_invalid");
          const revealed = reference(item["..."], `${path}/${index}`, false);
          return revealed ? [revealed.value] : [];
        }
        return [walk(item, `${path}/${index}`)];
      });
    if (value && typeof value === "object") {
      if (Object.hasOwn(value, "...") || Object.hasOwn(value, "__proto__"))
        fail("sd_jwt_claims_invalid");
      const result: Value = Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => !["_sd", "_sd_alg"].includes(key))
          .map(([key, val]) => [key, walk(val, `${path}/${escape(key)}`)]),
      );
      if (value._sd !== undefined) {
        if (!Array.isArray(value._sd)) fail("sd_jwt_digest_invalid");
        for (const hash of value._sd) {
          const item = reference(hash, path, true);
          if (item) {
            if (Object.hasOwn(result, item.name)) fail("sd_jwt_claim_collision");
            result[item.name] = item.value;
          }
        }
      }
      return result;
    }
    return value;
  };
  const payload = walk(raw, "");
  if (used.size !== disclosed.size) fail("sd_jwt_unreferenced_disclosure");
  return { jwt, header, raw, payload, kb, disclosures: [...disclosed.values()] };
}
export function materializeVC(payload: Value) {
  if (payload["@context"]) {
    const {
      iss: _iss,
      sub: _sub,
      vct: _vct,
      jti: _jti,
      iat: _iat,
      exp: _exp,
      nbf: _nbf,
      cnf: _cnf,
      ...vc
    } = payload;
    if (
      vc.issuer !== payload.iss ||
      vc.id !== payload.jti ||
      vc.type?.at(-1) !== payload.vct ||
      vc.credentialSubject?.id !== payload.sub
    )
      fail("sd_jwt_claims_invalid");
    return vc;
  }
  const { iss, sub, vct, jti, iat, exp, nbf: _nbf, cnf: _cnf, status, ...claims } = payload;
  return {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    id: jti,
    issuer: iss,
    type: ["VerifiableCredential", vct],
    validFrom: new Date(iat * 1000).toISOString(),
    ...(exp ? { validUntil: new Date(exp * 1000).toISOString() } : {}),
    credentialSubject: { id: sub, claims },
    ...(status ? { credentialStatus: status } : {}),
  };
}
export async function verifySDJWT(compact: string, key: JWK) {
  const decoded = unpackSDJWT(compact);
  await compactVerify(decoded.jwt, await importJWK(key, "EdDSA"), { algorithms: ["EdDSA"] });
  if (
    decoded.raw.exp !== undefined &&
    (!Number.isSafeInteger(decoded.raw.exp) || decoded.raw.exp <= Date.now() / 1000)
  )
    fail("credential_expired");
  if (
    decoded.raw.nbf !== undefined &&
    (!Number.isSafeInteger(decoded.raw.nbf) || decoded.raw.nbf > Date.now() / 1000)
  )
    fail("credential_not_yet_valid");
  if (decoded.raw.iat > Date.now() / 1000 + 60) fail("credential_not_yet_valid");
  return decoded;
}
export function selectSDJWT(compact: string, paths: string[]) {
  const decoded = unpackSDJWT(compact);
  if (decoded.kb || decoded.raw.cnf) fail("holder_key_binding_requires_fresh_presentation");
  const selected = decoded.disclosures.filter((item) =>
    paths.some(
      (path) =>
        item.path === path || item.path?.startsWith(`${path}/`) || path.startsWith(`${item.path}/`),
    ),
  );
  for (const path of paths)
    if (
      !decoded.disclosures.some((item) => item.path === path)
    )
      fail("credential_disclosure_path_unavailable");
  return `${decoded.jwt}~${selected.map((item) => `${item.encoded}~`).join("")}`;
}
