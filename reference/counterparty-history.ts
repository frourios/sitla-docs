// SPDX-License-Identifier: Apache-2.0
// Optional online signed summary, not a VC or new sitla-wire/1 record.
export interface CounterpartyHistoryRequest {
  context: { kind: "work" | "purchase"; id: string };
  counterpartyAccountUri: string;
}
export type ProviderDisputeSummary = {
  observedCases: number;
  open: number;
  won: number;
  lost: number;
  warningClosed: number;
  unknown: number;
  lastRecordedAt: string | null;
};
export type CounterpartyHistoryPayload = {
  type: "CounterpartyPaymentHistory";
  profile: "sitla-counterparty-payment-history/1";
  operator: string;
  requester: string;
  counterparty: string;
  context: CounterpartyHistoryRequest["context"];
  observedAt: string;
  expiresAt: string;
  evidenceLevel: "service-signed";
  verifiedBy: string;
  paymentMode: "live" | "test";
  availability: "available-partial" | "unavailable";
  bindingScope: "reserved-seller-destination" | "current-recipient-provider-binding";
  bindingHistory: { hasEarlierBinding: boolean; hasOtherAccountBindings: boolean } | null;
  disputes: ProviderDisputeSummary | null;
  coverage: {
    completeness: "partial";
    source: string;
    statusFreshness: string;
    includesPriorProviderOwners: true;
    allegations: string;
    transactionBoundary: string;
  };
  limitations: string[];
};
