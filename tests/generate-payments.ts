// SPDX-License-Identifier: Apache-2.0
// Manual fixture regeneration ONLY. Ephemeral private keys never leave this process.
import { generateKeyPairSync, sign } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { canonical, deriveDid } from "../reference/codec.ts";
import { paymentDigest as digest } from "../reference/payments.ts";
const operator = "https://operator.example", kid = `${operator}/keys/operator-1`;
const operatorKeys = generateKeyPairSync("ed25519");
const root = generateKeyPairSync("ml-dsa-44"), holder = generateKeyPairSync("ed25519");
const descriptor = { version: 1 as const, identitySuite: "ML-DSA-44" as const, identityPublicKey: root.publicKey.export({ format: "jwk" }).pub as string };
const did = deriveDid(descriptor), holderId = `${did}#assertion`;
const uid = (n: number) => `019a8050-0000-7000-8000-${n.toString().padStart(12, "0")}`;
const buyer = { id: `${operator}/accounts/BBBBBBBBBBBBBBBBBBBBBB`, controllerDid: did }, seller = { id: `${operator}/accounts/SSSSSSSSSSSSSSSSSSSSSS`, controllerDid: did };
// Deliberately separate account URIs even where a synthetic holder controls both.
const tx = uid(1), sellerId = uid(2), issued = "2026-11-15T00:00:00Z", expires = "2026-11-15T00:05:00Z";
const grantPayload = { protocol: "sitla-wire/1", type: "OperationalKeyAuthorization", operation: "replace-operational-keys", role: "identity-root", root: did, operational_did: did, keys: [{ id: holderId, suite: "Ed25519", public_key: holder.publicKey.export({ format: "jwk" }).x, role: "assertion" }], audience: operator, purpose: "sitla-online-account", authorization_series_id: uid(3), sequence: 0, predecessor_digest: null, issued_at: "2026-11-14T00:00:00Z", expires_at: "2027-11-14T00:00:00Z", status_reference: `${operator}/status/holder`, request_id: uid(4) };
const grant = { payload: grantPayload, signature: { suite: "ML-DSA-44", context: "SITLA/root/1", value: sign(null, Buffer.from(canonical(grantPayload)), { key: root.privateKey, context: Buffer.from("SITLA/root/1") }).toString("base64url") } };
let counter = 10;
function approval(operation: string, args: any, accountUri: string, details: any = {}) {
  const id = uid(counter++), policyBytes = '{"profile":"fixture-policy/1"}\n';
  const money = operation.includes("escrow") || operation === "accept_work";
  const reviewedContext = { operation, arguments: args, accountUri, review: { details, termsDigest: args.offerDigest ?? args.termsDigest, ...(money ? { amountMinor: 1000 } : {}) } };
  const request = { protocol: "sitla-wire/1", operation: "request-evidence", request_id: id, operator_id: operator, subject_reference: `urn:sha256:${digest(reviewedContext)}`, evidence_level: "user-signed", audience: operator, purpose: operation, challenge: Buffer.alloc(32, counter).toString("base64url"), issued_at: issued, expires_at: expires, policy_digest: digestBytes(policyBytes), requirements: [] };
  const payload = { protocol: "sitla-wire/1", type: "ApprovedAction", domain: "SITLA/approval/1", operator_id: operator, request_id: id, request_digest: digest(request), audience: operator, purpose: operation, challenge: request.challenge, issued_at: issued, expires_at: expires, policy_digest: request.policy_digest, operation, actor: did, key_authorization_digest: digest(grant), event_reference: id, payload_digest: digest(reviewedContext), terms_digest: args.offerDigest ?? args.termsDigest ?? digest(args), amount_minor: money ? 1000 : null, currency: money ? "JPY" : null, session_epoch: 0, recovery_epoch: 0 };
  return { payload, signature: { suite: "Ed25519", key_id: holderId, value: sign(null, Buffer.from(canonical(payload)), holder.privateKey).toString("base64url") }, request, reviewedContext, policyBytes, identity: { descriptor, grant }, arguments: args };
}
import { sha256 as digestBytes } from "../reference/codec.ts";
function secure(subject: any, type: string) {
  const id = uid(counter++);
  const vc = { "@context": ["https://www.w3.org/ns/credentials/v2", { "@vocab": "urn:sitla:online:claims:1:" }], id: `${operator}/credentials/${id}`, type: ["VerifiableCredential", `urn:sitla:credential:${type}:1`], issuer: operator, validFrom: "2026-11-15T00:00:01.000Z", credentialSubject: subject, credentialStatus: { id: `${operator}/api/credentials/${id}/status`, type: "urn:sitla:status:operator-record:1" } };
  const input = [canonical({ alg: "EdDSA", kid, typ: "vc+jwt" }), canonical(vc)].map(v => Buffer.from(v).toString("base64url")).join(".");
  return { id, vc, secured: `${input}.${sign(null, Buffer.from(input), operatorKeys.privateKey).toString("base64url")}`, format: "application/vc+jwt", digest: digest(vc) };
}
const positive: any[] = [], negative: any[] = [];
function add(id: string, subject: any, type: string, evidence?: any, previous?: any) {
  for (const key of Object.keys(subject)) if (subject[key] === undefined) delete subject[key];
  const record = secure(subject, type);
  const item = { id, record, ...(evidence ? { evidence } : {}), ...(previous ? { previousRecord: previous.record } : {}) };
  positive.push(item); return item;
}
const consent = { authorizeReceipt: true, dischargeOnStripeCapture: true, authorizeRefundsUnderAgreedTerms: true };
for (const kind of ["profile", "work"]) {
  const scope = kind === "profile" ? { kind, profileVersion: 1, termsDigest: digest({ profileVersion: 1, plans: [{ planIndex: 1, priceYen: 1000, fieldKeys: ["experience"] }] }), plans: [{ planIndex: 1, priceYen: 1000, fieldKeys: ["experience"] }] } : { kind, workId: tx, buyerId: uid(5), termsDigest: "a".repeat(64), amountLimitMinor: 1000, funding: "direct" };
  const offer = { policy: "sitla-collection-agency/1", seller, operator, processor: "Stripe", processorAccount: "acct_fixture", livemode: 0, currency: "JPY", feeBasisPoints: 2000, refundPolicy: "fixture-refund/1", scope, buyerDebtDischarge: "valid-stripe-capture", sellerRemittance: "separate-operator-obligation" };
  const args = kind === "profile" ? { profileVersion: 1, offerDigest: digest(offer), consent } : { workId: tx, termsDigest: "a".repeat(64), collectionConsent: consent };
  const details = kind === "profile" ? { offer, consent } : { processorAccount: "acct_fixture", feeBasisPoints: 2000, livemode: 0, collectionConsent: consent, work: { id: tx, sellerAccountUri: seller.id, buyer: buyer.id, termsDigest: "a".repeat(64), amountMinor: 1000, currency: "JPY", funding: "direct" } };
  const evidence = approval(kind === "profile" ? "authorize_profile_collection" : "accept_work", args, seller.id, details);
  add(`collection-${kind}`, { id: seller.id, profile: "sitla-collection-authorization/1", authorizationId: evidence.payload.event_reference, policy: "sitla-collection-agency/1", agent: operator, processor: "Stripe", sellerId, seller, processorAccount: "acct_fixture", livemode: 0, currency: "JPY", feeBasisPoints: 2000, refundPolicy: "fixture-refund/1", scope, authorizedAt: "2026-11-15T00:00:01.000Z", approvalDigest: digest(evidence), approval: { operationId: evidence.payload.event_reference, evidenceDigest: digest(evidence) }, limitations: ["Synthetic fixture; not a real delegation or provider event."] }, "CollectionAuthorization", evidence);
}
let depositOperation: string, acceptanceOperation: string;
for (const action of ["collection-authorize", "deposit", "accept", "refund", "settle"]) {
  const args: any = action === "collection-authorize" ? { escrowId: tx, termsDigest: "a".repeat(64), confirmUnderlyingPriceClaim: true, collectionBeforeOrWithPerformance: true, authorizeReceipt: true, dischargeOnStripeCapture: true, authorizeConditionalRefunds: true } : { escrowId: tx, termsDigest: "a".repeat(64), depositReference: "pi_fixture", predecessor: action === "deposit" ? null : action === "accept" ? depositOperation! : acceptanceOperation! };
  if (action === "settle") Object.assign(args, { inspectionConfirmed: true, performanceDigest: "b".repeat(64) });
  const operation = ({ "collection-authorize": "authorize_escrow_collection", deposit: "notify_escrow_deposit", accept: "accept_escrow", refund: "refund_escrow", settle: "settle_escrow" } as any)[action];
  const actor = ["deposit", "settle"].includes(action) ? buyer : seller;
  const evidence = approval(operation, args, actor.id, { instruction: args, terms: { buyer, seller, acceptBy: Date.parse("2026-11-16T00:00:00Z"), refundAt: Date.parse("2026-11-22T00:00:00Z") } });
  if (action === "deposit") depositOperation = evidence.payload.event_reference;
  if (action === "accept") acceptanceOperation = evidence.payload.event_reference;
  const subject: any = { id: seller.id, profile: "sitla-conditional-payment-instruction/1", action, transactionId: tx, buyer, seller, assertingAccount: actor.id, amountMinor: 1000, currency: "JPY", termsDigest: "a".repeat(64), acceptBy: "2026-11-16T00:00:00.000Z", refundAt: "2026-11-22T00:00:00.000Z", instruction: args, collectionPolicy: "sitla-collection-agency/1", approval: { operationId: evidence.payload.event_reference, evidenceDigest: digest(evidence) }, limitations: ["Synthetic holder authorization; not proof of completed work."] };
  if (action === "collection-authorize") subject.collectionAuthority = { agent: operator, processor: "Stripe", scope: "identified-transaction-only", priceDebtDischarge: "valid-stripe-capture", sellerRemittance: "separate-operator-obligation", refunds: "original-payment-method-under-fixed-policy" };
  if (action === "settle") subject.inspection = { confirmedByBuyer: true, performanceDigest: args.performanceDigest, basis: "buyer-signed-declaration; not operator adjudication" };
  add(`instruction-${action}`, subject, "ConditionalPaymentInstruction", evidence);
}
let previous: any;
for (const [stage, outcome, confirmed, amount] of [["authorization", "confirmed", true, 1000], ["capture", "confirmed", true, 1000], ["transfer", "pending", false, 800], ["transfer", "confirmed", true, 800], ["refund", "requested", false, 1000], ["refund", "confirmed", true, 1000]] as const) {
  const subject: any = { id: seller.id, profile: "sitla-online-payment-event/1", eventId: uid(counter++), sharedEventReference: `${operator}/payment-events/${tx}/${stage}-${counter}`, recipientRole: "seller", transactionId: tx, allocationId: `${tx}:${sellerId}`, buyer, seller, stage, outcome, currency: "JPY", currencyExponent: 0, amountMinor: amount, amountBasis: stage === "transfer" ? "seller-net" : "allocation-gross", originalGrossMinor: 1000, platformFeeMinor: 200, sellerNetMinor: 800, provider: "Stripe", providerReference: `${stage}_fixture`, providerConfirmed: confirmed, occurredAt: confirmed ? "2026-11-15T00:00:01.000Z" : null, observedAt: "2026-11-15T00:00:02.000Z", providerSignature: false, sequence: previous ? previous.record.vc.credentialSubject.sequence + 1 : 0, predecessorDigest: previous ? digest(previous.record) : null, approvalReference: positive[0].evidence.payload.event_reference, terms: [{ itemId: uid(6), profileVersion: 0, planIndex: 0, grossMinor: 1000, feeMinor: 200, netMinor: 800, termsDigest: "a".repeat(64) }], limitations: ["Synthetic operator observation; not a provider signature, bank payout or current balance."] };
  if (stage === "capture") subject.collection = { policy: "sitla-collection-agency/1", authorizationId: positive[0].record.vc.credentialSubject.authorizationId, buyerPriceDebt: "discharged-on-valid-stripe-capture", grossAmountMinor: 1000, noSecondCollectionFromBuyer: true, sellerRemittance: "separate-operator-obligation", scope: "this-seller-allocation-only" };
  previous = add(`event-${stage}-${outcome}`, subject, "OperatorPaymentEventCredential", undefined, previous);
}
// Both recipient copies, and an explicitly unallocated provider observation.
const capture = positive.find(x => x.id === "event-capture-confirmed");
add("event-buyer-copy", { ...capture.record.vc.credentialSubject, id: buyer.id, recipientRole: "buyer", sequence: 0, predecessorDigest: null }, "OperatorPaymentEventCredential");
add("event-unknown-allocation", { ...capture.record.vc.credentialSubject, stage: "dispute", amountMinor: null, amountBasis: "unallocated-provider-observation", collection: undefined, sequence: 0, predecessorDigest: null }, "OperatorPaymentEventCredential");
function bad(id: string, source: string, error: string, mutate: (item: any) => void, resign = true) {
  const item = JSON.parse(JSON.stringify(positive.find(x => x.id === source)));
  item.id = id; mutate(item);
  if (resign) item.record = secure(item.record.vc.credentialSubject, item.record.vc.type[1].split(":").at(-2));
  negative.push({ ...item, error, operator_signature_valid: id !== "tampered-operator-payload" });
}
bad("capture-amount", capture.id, "collection_capture", x => x.record.vc.credentialSubject.collection.grossAmountMinor--);
bad("authorization-is-not-capture", capture.id, "collection_capture", x => x.record.vc.credentialSubject.stage = "authorization");
bad("unconfirmed-capture", capture.id, "collection_capture", x => x.record.vc.credentialSubject.providerConfirmed = false);
bad("refund-is-pending", capture.id, "collection_capture", x => x.record.vc.credentialSubject.outcome = "pending");
bad("fee-net-do-not-add", capture.id, "event_amounts", x => x.record.vc.credentialSubject.sellerNetMinor--);
bad("allocation-mismatch", capture.id, "event_allocation", x => { x.record.vc.credentialSubject.terms[0].grossMinor++; x.record.vc.credentialSubject.terms[0].netMinor++; });
bad("other-recipient", capture.id, "event_recipient", x => x.record.vc.credentialSubject.id = `${operator}/accounts/other`);
bad("invented-provider-signature", capture.id, "payment_schema", x => x.record.vc.credentialSubject.providerSignature = true);
bad("unknown-effective-date", capture.id, "payment_time", x => x.record.vc.credentialSubject.occurredAt = "2026-02-30T00:00:00.000Z");
bad("chain-digest", capture.id, "payment_history", x => x.record.vc.credentialSubject.predecessorDigest = "c".repeat(64));
bad("chain-sequence", capture.id, "payment_history", x => x.record.vc.credentialSubject.sequence = 9);
bad("history-recipient", capture.id, "payment_history", x => x.previousRecord.vc.credentialSubject.id = buyer.id);
bad("unknown-provider-reference", "event-transfer-confirmed", "event_provider", x => x.record.vc.credentialSubject.providerReference = null);
bad("oversized-net", "event-transfer-confirmed", "event_amount_basis", x => x.record.vc.credentialSubject.amountMinor = 801);
bad("unknown-allocation-basis", "event-unknown-allocation", "event_unknown_amount", x => x.record.vc.credentialSubject.amountBasis = "allocation-gross");
bad("grant-approval-id", "collection-profile", "collection_approval", x => x.record.vc.credentialSubject.authorizationId = uid(99));
bad("grant-digest", "collection-profile", "collection_approval", x => x.record.vc.credentialSubject.approvalDigest = "f".repeat(64));
bad("false-inspection", "instruction-settle", "payment_schema", x => x.record.vc.credentialSubject.instruction.inspectionConfirmed = false);
bad("missing-inspection", "instruction-settle", "payment_schema", x => delete x.record.vc.credentialSubject.inspection);
bad("wrong-performance", "instruction-settle", "inspection_digest", x => x.record.vc.credentialSubject.inspection.performanceDigest = "c".repeat(64));
bad("changed-agreement", "instruction-settle", "instruction_binding", x => x.record.vc.credentialSubject.instruction.termsDigest = "d".repeat(64));
bad("changed-transaction", "instruction-settle", "instruction_binding", x => x.record.vc.credentialSubject.instruction.escrowId = uid(99));
bad("seller-settlement", "instruction-settle", "instruction_actor", x => x.record.vc.credentialSubject.assertingAccount = seller.id);
bad("missing-predecessor", "instruction-settle", "payment_schema", x => x.record.vc.credentialSubject.instruction.predecessor = null);
bad("reversed-deadline", "instruction-settle", "instruction_deadline", x => x.record.vc.credentialSubject.refundAt = "2026-11-15T00:00:00.000Z");
bad("changed-original-approval", "instruction-settle", "payment_approval_digest", x => x.evidence.arguments.performanceDigest = "e".repeat(64));
bad("changed-instruction-amount", "instruction-settle", "payment_instruction_amount", x => x.record.vc.credentialSubject.amountMinor++);
bad("changed-instruction-deadline", "instruction-settle", "payment_instruction_terms", x => x.record.vc.credentialSubject.refundAt = "2026-11-23T00:00:00.000Z");
bad("changed-profile-scope", "collection-profile", "payment_collection_scope", x => x.record.vc.credentialSubject.scope.profileVersion++);
bad("changed-work-budget", "collection-work", "payment_collection_scope", x => x.record.vc.credentialSubject.scope.amountLimitMinor++);
bad("changed-destination", "collection-profile", "payment_collection_destination", x => x.record.vc.credentialSubject.processorAccount = "acct_other");
bad("changed-authorized-arguments", "instruction-settle", "payment_approval_arguments", x => { x.record.vc.credentialSubject.instruction.performanceDigest = "e".repeat(64); x.record.vc.credentialSubject.inspection.performanceDigest = "e".repeat(64); });
bad("changed-holder-signature", "instruction-settle", "payment_holder_signature", x => {
  x.evidence.signature.value = Buffer.alloc(64).toString("base64url"); x.record.vc.credentialSubject.approval.evidenceDigest = digest(x.evidence);
});
bad("tampered-operator-payload", capture.id, "payment_signature", x => {
  const pieces = x.record.secured.split("."); const payload = JSON.parse(Buffer.from(pieces[1], "base64url").toString()); payload.credentialSubject.originalGrossMinor++;
  pieces[1] = Buffer.from(canonical(payload)).toString("base64url"); x.record.secured = pieces.join(".");
}, false);
bad("tampered-wrapper-copy", capture.id, "payment_copy", x => x.record.vc.credentialSubject.originalGrossMinor++, false);
const records = [capture.record], attachments = [{ kind: "seller-collection-authorization", reference: positive[0].record.id, document: positive[0].record }, { kind: "seller-collection-approval", reference: positive[0].record.id, document: positive[0].evidence }];
const schema = { adapter: "SITLA-online-vc-jws/1", contentType: "application/vc+jwt", signature: "EdDSA", payload: "Exact canonical UTF-8 VC JSON", status: "urn:sitla:status:operator-record:1" };
const keyMaterial = { keys: [{ ...operatorKeys.publicKey.export({ format: "jwk" }), kid, alg: "EdDSA", use: "sig" }] };
function bundle(complete: boolean) {
  const manifest = { type: "SitlaEvidenceExport", version: 1, operator, account: seller, kind: "payments", transactionId: tx, exportedAt: "2026-11-15T00:00:03.000Z", complete, cursor: "", nextCursor: complete ? null : records[0].id, limitations: ["Synthetic signed page; no global completeness or current-status proof."], records: records.map(record => ({ id: record.id, digest: digest(record) })), statusObservations: [{ id: records[0].id, status: "active", observedAt: "2026-11-15T00:00:03.000Z" }], attachments: attachments.map(item => ({ kind: item.kind, reference: item.reference, digest: digest(item) })), schemaDigest: digest(schema), keyMaterialDigest: digest(keyMaterial) };
  const input = [canonical({ alg: "EdDSA", kid, typ: "sitla-export+jws" }), canonical(manifest)].map(value => Buffer.from(value).toString("base64url")).join(".");
  return { manifest, signedManifest: `${input}.${sign(null, Buffer.from(input), operatorKeys.privateKey).toString("base64url")}`, records, attachments, schema, keyMaterial };
}
const bundles = { positive: [bundle(true), bundle(false)], negative: [] as any[] };
for (const [id, error, mutate] of [
  ["omitted-record", "bundle_records", (b: any) => b.records = []],
  ["changed-attachment", "bundle_attachments", (b: any) => b.attachments[0].document.id = uid(99)],
  ["changed-schema", "bundle_metadata", (b: any) => b.schema.adapter = "other"],
  ["substituted-embedded-key", "bundle_metadata", (b: any) => b.keyMaterial.keys[0].x = Buffer.alloc(32).toString("base64url")],
  ["changed-manifest", "bundle_manifest", (b: any) => b.manifest.complete = false],
] as const) {
  const value = JSON.parse(JSON.stringify(bundles.positive[0])); mutate(value); bundles.negative.push({ id, value, error });
}
const output = { license: "CC0-1.0", profile: "sitla-payments-online/1", expectedIssuer: operator, acceptedKeys: { [kid]: operatorKeys.publicKey.export({ format: "jwk" }) }, limitations: ["Synthetic signed historical assertions only. Keys are fixture trust input; no live Stripe, actual debt discharge, balance, legal status, issuer reputation or complete export is proven. Private signing keys were discarded."], positive, negative, bundles };
await writeFile(new URL("../artifacts/payments-v1/vectors/payments.json", import.meta.url), JSON.stringify(output, null, 2) + "\n");
console.log(`${positive.length} positive and ${negative.length} negative synthetic payment records written, plus bundle pages`);
