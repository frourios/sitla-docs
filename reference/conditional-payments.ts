// SPDX-License-Identifier: Apache-2.0
// Optional profile; no change to frozen sitla-wire/1 canonical records or contexts.
export const conditionalPaymentProfile = "sitla-conditional-payment/1" as const;
export const conditionalInstructionProfile = "sitla-conditional-payment-instruction/1" as const;
export type ConditionalPaymentAction = "collection-authorize" | "deposit" | "accept" | "refund" | "settle";
export interface ConditionalPaymentInstructionArguments {
  /** UUIDv7 for the pre-bound transaction. */
  escrowId: string;
  /** Lower-case SHA-256 hex over the exact agreement bytes. */
  termsDigest: string;
  /** Operator-verified Stripe PaymentIntent reference, not a card/client-secret token. */
  depositReference: string;
  /** Prior holder instruction operation UUIDv7; null for the first deposit. */
  predecessor: string | null;
}
export interface CollectionAuthorizationArguments {
  escrowId: string;
  termsDigest: string;
  confirmUnderlyingPriceClaim: true;
  collectionBeforeOrWithPerformance: true;
  authorizeReceipt: true;
  dischargeOnStripeCapture: true;
  authorizeConditionalRefunds: true;
}
export interface SettlementInstructionArguments extends ConditionalPaymentInstructionArguments {
  inspectionConfirmed: true;
  /** Hash of the exact accepted deliverable or market-defined milestone record. */
  performanceDigest: string;
}
export interface ConditionalPaymentAccountReference {
  id: string;
  controllerDid: string | null;
}
export interface ConditionalPaymentInstructionSubject {
  id: string;
  profile: typeof conditionalInstructionProfile;
  action: ConditionalPaymentAction;
  transactionId: string;
  buyer: ConditionalPaymentAccountReference;
  seller: ConditionalPaymentAccountReference;
  assertingAccount: string;
  amountMinor: number;
  currency: "JPY";
  termsDigest: string;
  acceptBy: string;
  refundAt: string;
  instruction: ConditionalPaymentInstructionArguments | CollectionAuthorizationArguments | SettlementInstructionArguments;
  collectionPolicy: "sitla-collection-agency/1";
  inspection?: {confirmedByBuyer:true;performanceDigest:string;basis:string};
  approval: { operationId: string; evidenceDigest: string };
  limitations: string[];
}
