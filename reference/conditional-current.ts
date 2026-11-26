// SPDX-License-Identifier: Apache-2.0
// Current whole-VC subjects; provider effects and holder signatures are separate checks.
export function validateCurrentConditional(subject: any, validateSchema: (v: unknown) => boolean) {
  if (!validateSchema(subject)) throw new Error('conditional_schema');
  if (subject.instruction.escrowId !== subject.transactionId || subject.instruction.termsDigest !== subject.termsDigest) throw new Error('conditional_binding');
  const seller = subject.action !== 'settle';
  if (subject.assertingAccount !== (seller ? subject.seller.id : subject.buyer.id)) throw new Error('conditional_actor');
  if (subject.action !== 'collection-authorize') {
    const funded = Date.parse(subject.fundedAt), deadline = Date.parse(subject.refundAt);
    if (!Number.isFinite(funded) || !Number.isFinite(deadline) || deadline !== funded + subject.holdSeconds * 1000) throw new Error('conditional_deadline');
  }
  if (subject.action === 'settle' && subject.inspection.performanceDigest !== subject.instruction.performanceDigest) throw new Error('conditional_inspection');
}
