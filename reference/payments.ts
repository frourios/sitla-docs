// SPDX-License-Identifier: Apache-2.0
// Static online-adapter verifier. Trust/status/replay and provider execution remain external.
import { createPublicKey, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import { canonical, sha256, decodeBase64url, parseCanonical, deriveDid, validateSemantics } from "./codec.ts";

type Value = Record<string, any>;
const check = (ok: unknown, error: string): void => { if (!ok) throw new Error(error); };
export const paymentSchemaNames = ["collection-authorization", "conditional-instruction", "payment-event", "online-vc", "export-manifest", "evidence-bundle"] as const;
export async function paymentSchemas() {
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  const result = new Map();
  for (const name of paymentSchemaNames) result.set(name, ajv.compile(JSON.parse(await readFile(new URL(`../artifacts/payments-v1/schemas/${name}.schema.json`, import.meta.url), "utf8"))));
  result.set("collection-authorization-v2", ajv.compile(JSON.parse(await readFile(new URL("../artifacts/payments-v2/schemas/collection-authorization.schema.json", import.meta.url), "utf8"))));
  for (const name of ["approved-action", "operational-key-authorization", "request-evidence"]) result.set(name, ajv.compile(JSON.parse(await readFile(new URL(`../artifacts/wire-v1/schemas/${name}.schema.json`, import.meta.url), "utf8"))));
  return result;
}
export const paymentDigest = (value: unknown) => sha256(canonical(value));
const instant = (value: string) => {
  const parsed = new Date(value);
  check(Number.isFinite(+parsed) && parsed.toISOString() === (value.includes(".") ? value : value.replace("Z", ".000Z")), "payment_time");
  return +parsed;
};
/** Shape checks precede this helper. It validates historical assertions, not current status. */
export function validatePaymentSubject(subject: Value) {
  if (["sitla-collection-authorization/1", "sitla-collection-authorization/2"].includes(subject.profile)) {
    instant(subject.authorizedAt);
    check(subject.authorizationId === subject.approval.operationId && subject.approvalDigest === subject.approval.evidenceDigest, "collection_approval");
    return;
  }
  if (subject.profile === "sitla-conditional-payment-instruction/1") {
    check(subject.instruction.escrowId === subject.transactionId && subject.instruction.termsDigest === subject.termsDigest, "instruction_binding");
    check(instant(subject.acceptBy) <= instant(subject.refundAt), "instruction_deadline");
    const actor = ["deposit", "settle"].includes(subject.action) ? subject.buyer.id : subject.seller.id;
    check(subject.assertingAccount === actor && [subject.buyer.id, subject.seller.id].includes(subject.id), "instruction_actor");
    if (subject.action === "settle") check(subject.inspection.performanceDigest === subject.instruction.performanceDigest, "inspection_digest");
    return;
  }
  instant(subject.observedAt);
  if (subject.occurredAt !== null) check(instant(subject.occurredAt) <= instant(subject.observedAt), "event_time");
  check(subject.id === subject[subject.recipientRole].id && subject.allocationId.startsWith(`${subject.transactionId}:`), "event_recipient");
  // The allocation suffix is an operator-local UUID, not necessarily the public account token.
  check((subject.sequence === 0) === (subject.predecessorDigest === null), "event_chain");
  check(subject.platformFeeMinor + subject.sellerNetMinor === subject.originalGrossMinor, "event_amounts");
  for (const item of subject.terms) check(item.feeMinor + item.netMinor === item.grossMinor, "event_amounts");
  for (const [field, itemField] of [["originalGrossMinor", "grossMinor"], ["platformFeeMinor", "feeMinor"], ["sellerNetMinor", "netMinor"]])
    check(subject.terms.reduce((sum: number, item: Value) => sum + item[itemField], 0) === subject[field], "event_allocation");
  if (subject.collection) check(subject.stage === "capture" && subject.outcome === "confirmed" && subject.providerConfirmed && subject.amountMinor === subject.collection.grossAmountMinor && subject.amountMinor === subject.originalGrossMinor, "collection_capture");
  if (subject.amountMinor === null) check(subject.amountBasis === "unallocated-provider-observation", "event_unknown_amount");
  else if (subject.amountBasis === "seller-net") check(subject.amountMinor <= subject.sellerNetMinor, "event_amount_basis");
  else if (subject.amountBasis === "allocation-gross") check(subject.amountMinor <= subject.originalGrossMinor, "event_amount_basis");
  if (subject.providerConfirmed) check(subject.providerReference !== null, "event_provider");
}
/** Accepted issuer keys are caller input. A key in an untrusted VC/bundle is never trusted. */
export function verifyPaymentCredential(record: Value, acceptedKeys: Value, expectedIssuer: string, schemas: Map<string, any>) {
  check(canonical(Object.keys(record).sort()) === canonical(["digest", "format", "id", "secured", "vc"]), "payment_record_shape");
  const pieces = record.secured.split(".");
  check(pieces.length === 3, "payment_jws");
  const header = parseCanonical(decodeBase64url(pieces[0])) as Value;
  check(canonical(Object.keys(header).sort()) === canonical(["alg", "kid", "typ"]), "payment_jws_header");
  check(header.alg === "EdDSA" && header.typ === "vc+jwt" && !!acceptedKeys[header.kid], "payment_issuer_key");
  check(verify(null, Buffer.from(`${pieces[0]}.${pieces[1]}`), createPublicKey({ key: acceptedKeys[header.kid], format: "jwk" }), decodeBase64url(pieces[2])), "payment_signature");
  const vc = parseCanonical(decodeBase64url(pieces[1])) as Value;
  check(schemas.get("online-vc")(vc), "payment_schema");
  check(vc.issuer === expectedIssuer && vc.id === `${expectedIssuer}/credentials/${record.id}` && header.kid.startsWith(`${expectedIssuer}/keys/`) && vc.credentialStatus.id === `${expectedIssuer}/api/credentials/${record.id}/status`, "payment_issuer");
  instant(vc.validFrom);
  check(canonical(vc) === canonical(record.vc) && record.digest === paymentDigest(vc) && record.format === "application/vc+jwt", "payment_copy");
  const subject = vc.credentialSubject;
  const name = ({ "sitla-collection-authorization/1": "collection-authorization", "sitla-collection-authorization/2": "collection-authorization-v2", "sitla-conditional-payment-instruction/1": "conditional-instruction", "sitla-online-payment-event/1": "payment-event" } as Value)[subject.profile];
  check(name && schemas.get(name)(subject), "payment_schema");
  const type = name.startsWith("collection-authorization") ? "CollectionAuthorization" : name === "conditional-instruction" ? "ConditionalPaymentInstruction" : "OperatorPaymentEventCredential";
  check(vc.type[1] === `urn:sitla:credential:${type}:1`, "payment_type");
  validatePaymentSubject(subject);
  return subject;
}
/** Approval attachment for the Ed25519 path; caller supplies historical trust/status policy. */
export function verifyPaymentApproval(subject: Value, evidence: Value, schemas: Map<string, any>, expectedIssuer: string) {
  check(subject.approval.evidenceDigest === paymentDigest(evidence), "payment_approval_digest");
  const { payload, signature, request, reviewedContext, arguments: args, identity } = evidence;
  const { grant, descriptor } = identity;
  check(schemas.get("operational-key-authorization")(grant) && schemas.get("request-evidence")(request), "payment_approval_schema");
  check(grant.signature.suite === "ML-DSA-44" && grant.signature.context === "SITLA/root/1" && grant.payload.operation === "replace-operational-keys", "payment_approval_key");
  check(grant.payload.audience === expectedIssuer && grant.payload.purpose === "sitla-online-account" && payload.operator_id === expectedIssuer && payload.audience === expectedIssuer, "payment_approval_operator");
  check(payload.key_authorization_digest === paymentDigest(grant) && payload.actor === grant.payload.root && instant(payload.issued_at) >= instant(grant.payload.issued_at) && instant(payload.expires_at) <= instant(grant.payload.expires_at), "payment_approval_authority");
  const key = grant.payload.keys.find((item: Value) => item.id === signature.key_id);
  check(deriveDid(descriptor) === grant.payload.root, "payment_holder_root");
  check(verify(null, Buffer.from(canonical(grant.payload)), { key: createPublicKey({ key: { kty: "AKP", alg: "ML-DSA-44", pub: descriptor.identityPublicKey }, format: "jwk" }), context: Buffer.from("SITLA/root/1") }, decodeBase64url(grant.signature.value)), "payment_root_signature");
  validateSemantics("operational-key-authorization", grant, { descriptor });
  check(key?.suite === "Ed25519" && key.role === "assertion" && schemas.get("approved-action")({ payload, signature }), "payment_approval_key");
  check(verify(null, Buffer.from(canonical(payload)), createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: key.public_key }, format: "jwk" }), decodeBase64url(signature.value)), "payment_holder_signature");
  validateSemantics("approved-action", { payload, signature }, { request, policyBytes: Buffer.from(evidence.policyBytes) });
  check(payload.event_reference === subject.approval.operationId && payload.payload_digest === paymentDigest(reviewedContext) && request.subject_reference === `urn:sha256:${paymentDigest(reviewedContext)}` && canonical(args) === canonical(reviewedContext.arguments), "payment_approval_binding");
  const operation = ["sitla-collection-authorization/1", "sitla-collection-authorization/2"].includes(subject.profile) ? subject.scope.kind === "profile" ? "authorize_profile_collection" : "accept_work" : ({ "collection-authorize": "authorize_escrow_collection", deposit: "notify_escrow_deposit", accept: "accept_escrow", refund: "refund_escrow", settle: "settle_escrow" } as Value)[subject.action];
  const actor = ["sitla-collection-authorization/1", "sitla-collection-authorization/2"].includes(subject.profile) ? subject.seller : ["deposit", "settle"].includes(subject.action) ? subject.buyer : subject.seller;
  check(payload.operation === operation && reviewedContext.operation === operation && reviewedContext.accountUri === actor.id && payload.actor === actor.controllerDid, "payment_approval_actor");
  if (subject.instruction) {
    check(canonical(args) === canonical(subject.instruction), "payment_approval_arguments");
    const review = reviewedContext.review, terms = review.details.terms;
    check(payload.amount_minor === subject.amountMinor && payload.currency === subject.currency && review.amountMinor === subject.amountMinor && payload.terms_digest === subject.termsDigest && review.termsDigest === subject.termsDigest, "payment_instruction_amount");
    check(canonical(terms.buyer) === canonical(subject.buyer) && canonical(terms.seller) === canonical(subject.seller) && terms.acceptBy === instant(subject.acceptBy) && terms.refundAt === instant(subject.refundAt), "payment_instruction_terms");
  }
  else {
    check(args.consent?.authorizeReceipt && args.consent?.dischargeOnStripeCapture && args.consent?.authorizeRefundsUnderAgreedTerms || args.collectionConsent?.authorizeReceipt && args.collectionConsent?.dischargeOnStripeCapture && args.collectionConsent?.authorizeRefundsUnderAgreedTerms, "payment_collection_consent");
    const details = reviewedContext.review.details;
    const reviewed = subject.scope.kind === "profile" ? details.offer : details;
    check(reviewed.processorAccount === subject.processorAccount && reviewed.feeBasisPoints === subject.feeBasisPoints && reviewed.livemode === subject.livemode, "payment_collection_destination");
    if (subject.scope.kind === "profile") {
      check(args.offerDigest === paymentDigest(reviewed) && payload.terms_digest === args.offerDigest && args.profileVersion === subject.scope.profileVersion && canonical(subject.scope) === canonical(reviewed.scope) && canonical(subject.seller) === canonical(reviewed.seller) && subject.agent === reviewed.operator && subject.refundPolicy === reviewed.refundPolicy && subject.currency === reviewed.currency, "payment_collection_scope");
    } else {
      const work = details.work;
      check(args.workId === subject.scope.workId && work.id === subject.scope.workId && args.termsDigest === subject.scope.termsDigest && work.termsDigest === subject.scope.termsDigest && work.amountMinor === subject.scope.amountLimitMinor && work.funding === subject.scope.funding && work.currency === subject.currency && work.sellerAccountUri === subject.seller.id, "payment_collection_scope");
    }
  }
  if (subject.agent) check(subject.agent === expectedIssuer, "payment_approval_operator");
}
export function verifyPaymentHistory(subject: Value, previousRecord?: Value) {
  if (subject.sequence === 0) { check(!previousRecord, "payment_history"); return; }
  check(previousRecord && subject.predecessorDigest === paymentDigest(previousRecord), "payment_history");
  const previous = previousRecord!.vc.credentialSubject;
  check(previous.profile === subject.profile && previous.id === subject.id && previous.transactionId === subject.transactionId && subject.sequence === previous.sequence + 1 && instant(subject.observedAt) >= instant(previous.observedAt), "payment_history");
}
/** Check the signed manifest and listed bytes, not global completeness or attachment truth. */
export function verifyPaymentBundle(bundle: Value, acceptedKeys: Value, expectedIssuer: string, schemas: Map<string, any>) {
  check(schemas.get("evidence-bundle")(bundle), "bundle_schema");
  const [headerPart, payloadPart, signature, extra] = bundle.signedManifest.split(".");
  check(signature && !extra, "bundle_jws");
  const header = parseCanonical(decodeBase64url(headerPart)) as Value;
  check(canonical(Object.keys(header).sort()) === canonical(["alg", "kid", "typ"]) && header.alg === "EdDSA" && header.typ === "sitla-export+jws" && acceptedKeys[header.kid] && header.kid.startsWith(`${expectedIssuer}/keys/`), "bundle_issuer_key");
  check(verify(null, Buffer.from(`${headerPart}.${payloadPart}`), createPublicKey({ key: acceptedKeys[header.kid], format: "jwk" }), decodeBase64url(signature)), "bundle_signature");
  const manifest = parseCanonical(decodeBase64url(payloadPart)) as Value;
  check(canonical(manifest) === canonical(bundle.manifest) && manifest.operator === expectedIssuer, "bundle_manifest");
  instant(manifest.exportedAt);
  check(manifest.complete === (manifest.nextCursor === null), "bundle_pagination");
  check(manifest.schemaDigest === paymentDigest(bundle.schema) && manifest.keyMaterialDigest === paymentDigest(bundle.keyMaterial), "bundle_metadata");
  check(canonical(manifest.records) === canonical(bundle.records.map((record: Value) => ({ id: record.id, digest: paymentDigest(record) }))) && new Set(manifest.records.map((record: Value) => record.id)).size === manifest.records.length, "bundle_records");
  check(canonical(manifest.attachments) === canonical(bundle.attachments.map((item: Value) => ({ kind: item.kind, reference: item.reference, digest: paymentDigest(item) }))), "bundle_attachments");
  for (const record of bundle.records) verifyPaymentCredential(record, acceptedKeys, expectedIssuer, schemas);
  // Caller validates original holder approvals, status observations, omitted pages and attachment schemas.
}
