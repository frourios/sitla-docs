// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Frourio, Inc.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function hasAuthorSignoff(message: string, authorName: string, authorEmail: string): boolean {
  const trailers = execFileSync("git", ["interpret-trailers", "--parse"], { input: message, encoding: "utf8" });
  return trailers.split("\n").some(line => {
    const match = /^Signed-off-by:\s*(.+?)\s*<([^<>\s]+)>\s*$/i.exec(line);
    return !!match && match[1].trim() === authorName.trim() && match[2].toLowerCase() === authorEmail.toLowerCase();
  });
}
export function checkPullRequestSignoffs(base: string, head: string): number {
  for (const oid of [base, head]) {
    if (!/^[a-f0-9]{40,64}$/.test(oid)) throw new Error("Expected exact PR base/head commit IDs");
    execFileSync("git", ["cat-file", "-e", `${oid}^{commit}`]);
  }
  const commits = execFileSync("git", ["rev-list", `${base}..${head}`], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  if (!commits.length) throw new Error("No PR commits to certify");
  for (const oid of commits) {
    const [name, email, message] = execFileSync("git", ["show", "-s", "--format=%an%x00%ae%x00%B", oid], { encoding: "utf8" }).split("\0");
    if (!hasAuthorSignoff(message, name, email)) throw new Error(`Missing matching author Signed-off-by trailer: ${oid}`);
  }
  return commits.length;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  console.log(`Signed-off-by verified for ${checkPullRequestSignoffs(process.env.PR_BASE_SHA ?? "", process.env.PR_HEAD_SHA ?? "")} PR commits.`);
}
