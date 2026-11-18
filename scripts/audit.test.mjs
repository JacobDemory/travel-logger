import assert from "node:assert/strict";
import test from "node:test";
import { assessAudit, exception } from "./audit.mjs";

const now = Date.parse("2026-11-18T12:00:00Z");
function fixture() {
  return {
    report: {
      metadata: { vulnerabilities: { total: 2 } },
      vulnerabilities: {
        picomatch: {
          nodes: ["node_modules/picomatch"],
          via: [{ name: "picomatch", dependency: "picomatch", url: exception.advisory }],
        },
        tool: { nodes: ["node_modules/tool"], via: ["picomatch"] },
      },
    },
    lock: { packages: {
      "node_modules/picomatch": { version: "4.0.7", dev: true },
      "node_modules/tool": { version: "1.0.0", dev: true },
    } },
  };
}
test("allows only the approved advisory and its development-only dependency chain", () => {
  const { report, lock } = fixture();
  assert.deepEqual(assessAudit(report, lock, { now }), { allowed: ["picomatch", "tool"], blocked: [] });
});
test("does not exempt production findings", () => {
  const { report, lock } = fixture();
  assert.equal(assessAudit(report, lock, { production: true, now }).blocked.length, 2);
});
test("rejects a runtime copy even when the report is a full audit", () => {
  const { report, lock } = fixture();
  lock.packages["node_modules/picomatch"].dev = false;
  assert.equal(assessAudit(report, lock, { now }).blocked.length, 2);
});
test("rejects a runtime ancestor of an otherwise allowed advisory", () => {
  const { report, lock } = fixture();
  lock.packages["node_modules/tool"].dev = false;
  assert.equal(assessAudit(report, lock, { now }).blocked.length, 1);
});
test("rejects another advisory on the same package", () => {
  const { report, lock } = fixture();
  report.vulnerabilities.picomatch.via.push({ name: "picomatch", dependency: "picomatch", url: "https://example.invalid/new-advisory" });
  assert.equal(assessAudit(report, lock, { now }).blocked.length, 2);
});
test("rejects unexpected versions and missing lockfile nodes", () => {
  for (const change of [
    lock => { lock.packages["node_modules/picomatch"].version = "4.0.8"; },
    lock => { delete lock.packages["node_modules/picomatch"]; },
  ]) {
    const { report, lock } = fixture();
    change(lock);
    assert.equal(assessAudit(report, lock, { now }).blocked.length, 2);
  }
});
test("fails at the exact expiry without granting a grace period", () => {
  const { report, lock } = fixture();
  assert.equal(assessAudit(report, lock, { now: Date.parse(exception.expires) }).blocked.length, 2);
});
test("accepts a clean audit after expiry without retaining a required exception", () => {
  const report = { metadata: { vulnerabilities: { total: 0 } }, vulnerabilities: {} };
  assert.deepEqual(assessAudit(report, { packages: {} }, { now: Date.parse("2027-01-01") }), { allowed: [], blocked: [] });
});
test("rejects missing dependencies, cyclic reports, and malformed reports", () => {
  const { report, lock } = fixture();
  report.vulnerabilities.tool.via = ["missing"];
  assert.equal(assessAudit(report, lock, { now }).blocked.length, 1);
  report.vulnerabilities.tool.via = ["tool"];
  assert.equal(assessAudit(report, lock, { now }).blocked.length, 1);
  assert.throws(() => assessAudit({ error: { message: "Registry unavailable" } }, lock, { now }));
  report.metadata.vulnerabilities.total = 0;
  assert.throws(() => assessAudit(report, lock, { now }));
});
