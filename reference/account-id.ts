// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import { isIP } from "node:net";
import { base64urlBytes } from "./codec.ts";

export interface AccountIdentifierSubject {
  id: string;
  profile: "sitla-account-id/1";
  namespace: string;
  handle: string;
  handleUri: string;
  controllerDid: string;
  bindingVersion: number;
}
// Run the subject JSON Schema first. No signature, status, reservation-store,
// issuer authority, holder challenge or recovery review is performed here.
export function validateAccountIdentifierSubject(value: AccountIdentifierSubject): void {
  const origin = new URL(value.namespace);
  const labels = origin.hostname.split(".");
  if (origin.protocol !== "https:" || origin.origin !== value.namespace || isIP(origin.hostname) ||
      origin.hostname.length > 253 || labels.length < 2 ||
      labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
    throw new Error("account_namespace_noncanonical");
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(value.handle)) throw new Error("account_handle_noncanonical");
  if (value.handleUri !== `${value.namespace}/@${value.handle}`) throw new Error("account_handle_uri_mismatch");
  const prefix = `${value.namespace}/accounts/`;
  if (!value.id.startsWith(prefix) || !/^[A-Za-z0-9_-]{22}$/.test(value.id.slice(prefix.length)))
    throw new Error("account_reference_mismatch");
  if (value.profile !== "sitla-account-id/1" || !Number.isSafeInteger(value.bindingVersion) || value.bindingVersion < 0)
    throw new Error("account_binding_version_invalid");
  if (!value.controllerDid.startsWith("did:sitla:v1:")) throw new Error("account_controller_unsupported");
  base64urlBytes(value.controllerDid.slice("did:sitla:v1:".length), 64);
}
// Issuer-side state-transition check only. An independent verifier can instead
// accept an authenticated current-version observation without every intermediate VC.
export function validateAccountIdentifierTransition(previous: AccountIdentifierSubject, next: AccountIdentifierSubject): void {
  validateAccountIdentifierSubject(previous);
  validateAccountIdentifierSubject(next);
  if (previous.id !== next.id || previous.namespace !== next.namespace) throw new Error("account_identity_changed");
  if (next.bindingVersion !== previous.bindingVersion + 1) throw new Error("account_version_not_successor");
}

export interface AccountBindingSubject {
  id: string;
  profile: "sitla-account/1";
  namespace: string;
  controllerDid: string;
  bindingVersion: number;
}
export interface AccountHandleSubject {
  id: string;
  profile: "sitla-account-handle/1";
  namespace: string;
  handle: string;
  handleUri: string;
  assignmentVersion: number;
}
function validateAccountReference(id: string, namespace: string): void {
  const origin = new URL(namespace);
  const labels = origin.hostname.split(".");
  if (origin.protocol !== "https:" || origin.origin !== namespace || isIP(origin.hostname) ||
      origin.hostname.length > 253 || labels.length < 2 ||
      labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
    throw new Error("account_namespace_noncanonical");
  const prefix = `${namespace}/accounts/`;
  if (!id.startsWith(prefix) || !/^[A-Za-z0-9_-]{22}$/.test(id.slice(prefix.length))) throw new Error("account_reference_mismatch");
}
// Validate the corresponding subject JSON Schema first. Names and profile data
// intentionally do not participate in the account-to-controller binding.
export function validateAccountBindingSubject(value: AccountBindingSubject): void {
  validateAccountReference(value.id, value.namespace);
  if (value.profile !== "sitla-account/1" || !Number.isSafeInteger(value.bindingVersion) || value.bindingVersion < 0)
    throw new Error("account_binding_version_invalid");
  if (!value.controllerDid.startsWith("did:sitla:v1:")) throw new Error("account_controller_unsupported");
  base64urlBytes(value.controllerDid.slice("did:sitla:v1:".length), 64);
}
export function validateAccountBindingTransition(previous: AccountBindingSubject, next: AccountBindingSubject): void {
  validateAccountBindingSubject(previous);
  validateAccountBindingSubject(next);
  if (previous.id !== next.id || previous.namespace !== next.namespace) throw new Error("account_identity_changed");
  if (next.bindingVersion !== previous.bindingVersion + 1) throw new Error("account_version_not_successor");
}
export function validateAccountHandleSubject(value: AccountHandleSubject): void {
  validateAccountReference(value.id, value.namespace);
  if (value.profile !== "sitla-account-handle/1" || !Number.isSafeInteger(value.assignmentVersion) || value.assignmentVersion < 0)
    throw new Error("account_assignment_version_invalid");
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(value.handle)) throw new Error("account_handle_noncanonical");
  if (value.handleUri !== `${value.namespace}/@${value.handle}`) throw new Error("account_handle_uri_mismatch");
}
// Static same-account check, not proof of the handle's current/active status.
export function validateHandleAccountBinding(account: AccountBindingSubject, handle: AccountHandleSubject): void {
  validateAccountBindingSubject(account);
  validateAccountHandleSubject(handle);
  if (account.id !== handle.id || account.namespace !== handle.namespace) throw new Error("handle_account_mismatch");
}
