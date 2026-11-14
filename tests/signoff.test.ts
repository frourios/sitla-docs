// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import assert from "node:assert/strict";
import test from "node:test";
import { hasAuthorSignoff } from "./check-signoff.ts";

test("requires an actual matching author sign-off trailer", () => {
  const trailer = "Signed-off-by: Ada Example <ada@example.org>";
  assert.equal(hasAuthorSignoff(`Change\n\n${trailer}\n`, "Ada Example", "ada@example.org"), true);
  assert.equal(hasAuthorSignoff("Unsigned change\n", "Ada Example", "ada@example.org"), false);
  assert.equal(hasAuthorSignoff(`Quoted text\n${trailer}\n\nThis is body text.\n`, "Ada Example", "ada@example.org"), false);
  assert.equal(hasAuthorSignoff(`Change\n\n${trailer}\n`, "Different Author", "other@example.org"), false);
});
