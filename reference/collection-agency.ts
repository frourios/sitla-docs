// SPDX-License-Identifier: Apache-2.0
// Service-level collection records; frozen sitla-wire/1 signatures are unchanged.
export interface CollectionConsent {
  authorizeReceipt: true;
  dischargeOnStripeCapture: true;
  authorizeRefundsUnderAgreedTerms: true;
}
export interface ProfileCollectionAuthorizationArguments {
  profileVersion: number;
  offerDigest: string;
  consent: CollectionConsent;
}
export interface CollectionRevocationArguments { authorizationId: string }
export interface WorkCollectionAcceptanceArguments {
  workId: string;
  termsDigest: string;
  collectionConsent: CollectionConsent;
}
export interface CollectionScope {
  kind: "profile" | "work";
  profileVersion?: number;
  workId?: string;
  /** Operator-local account UUID; account URIs carry cross-operator identity. */
  buyerId?: string;
  termsDigest: string;
  plans?: {planIndex:number;priceYen:number;fieldKeys:string[]}[];
  amountLimitMinor?: number;
  funding?: "direct" | "card-authorization";
}
export interface CollectionAuthorizationSubject {
  id: string;
  profile: "sitla-collection-authorization/1" | "sitla-collection-authorization/2";
  authorizationId: string;
  policy: "sitla-collection-agency/1";
  agent: string;
  processor: "Stripe";
  sellerId: string;
  seller: {id:string;controllerDid:string|null};
  processorAccount: string | null;
  livemode: number;
  currency: "JPY";
  feeBasisPoints: number;
  refundPolicy: string;
  scope: CollectionScope;
  authorizedAt: string;
  approvalDigest: string;
  approval: {operationId:string;evidenceDigest:string};
  limitations: string[];
}
