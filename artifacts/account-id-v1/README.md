# Legacy combined account/name credential

Profile `sitla-account-id/1` and type `urn:sitla:credential:OperatorAccountIdentifierCredential:1` combine an immutable account URI, namespace, mandatory handle/handle URI, controller DID and bindingVersion. Its original subject schema and unsigned examples remain unchanged. It requires an accepted full VC securing/status adapter and namespace authority; neither a subject example nor its shape proves current control or uniqueness.

The recommended design now separates `sitla-account/1` (automatic account-to-controller binding, no handle) from optional `sitla-account-handle/1`. A verifier must explicitly support each profile. Signed legacy bytes cannot be relabeled or have their handle fields deleted to become a new-profile credential. An authorized issuer may issue the new profiles for the same account URI and preserve known binding-version monotonicity. Possession of a legacy document alone does not authorize migration, recovery, login or payout.

The old profile remains a valid explicitly selected legacy format under its original expiry/status/authority rules. Documenting a new recommended profile does not revoke it. New accounts do not need to claim a human-selected handle.
