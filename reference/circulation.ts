// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
// Current application records. These do not change the frozen wire/1 contexts.
export const CIRCULATION_PROFILE = "SITLA-sd-jwt/1";
export const REQUEST_META = "io.frourio.sitla/request";
export interface ToolRequestClaims {
  iss: string; sub: string; aud: string;
  vct: "urn:sitla:credential:ToolRequest:1";
  resource: string; tool: string; argumentsDigest: string; senderThumbprint: string;
  jti: string; iat: number; exp: number; _sd_alg: "sha-256";
}
export interface ToolResponseSubject {
  id: string; tool: string; requestId: string | number; requestDigest: string | null;
  requesterDid: string | null; mandateId: string | null;
  outcome: "completed" | "rejected"; resultDigest: string;
  transport: "MCP JSON-RPC with OAuth/DPoP"; authorization: string;
}
export interface PublishedClaimInput {
  key: string; source: { credentialId: string; path: string };
}
export interface SelectivePresentationInput {
  credentialIds: string[]; disclosures: Record<string,string[]>;
  audience: string; purpose: string;
}

// sitla-credential-dm/1: business data inside MCP, not a replacement transport.
export interface CredentialDMInput {
  recipientDid:string;
  credential:{secured:string;authority:{descriptor:unknown;authorization:unknown}};
}
export interface CredentialDMMetadata {
  id:string;senderDid:string;recipientDid:string;deliveredAt:string;
  acknowledgedAt:string|null;humanReadProven:false;
}
export interface CredentialDMDeliverySubject {
  id:string;messageId:string;recipientDid:string;deliveredAt:string;
  credentialDigest:string;event:"inbox-delivery";humanReadProven:false;
  acceptedAsCredential:false;email:string;
}
