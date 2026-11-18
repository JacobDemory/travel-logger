import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const exception = Object.freeze({
  advisory: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf",
  package: "picomatch",
  version: "4.0.7",
  expires: "2026-12-18T00:00:00Z",
});

export function assessAudit(report, lock, { production = false, now = Date.now() } = {}) {
  const findings = report?.vulnerabilities;
  if (report?.error || !findings || typeof findings !== "object" || Array.isArray(findings) ||
      report?.metadata?.vulnerabilities?.total !== Object.keys(findings).length ||
      !lock?.packages || !Number.isFinite(now)) {
    throw new Error("Invalid audit report, lockfile, or evaluation time.");
  }
  const developmentOnly = finding =>
    Array.isArray(finding.nodes) && finding.nodes.length > 0 &&
    finding.nodes.every(node => Object.hasOwn(lock.packages, node) && lock.packages[node].dev === true);

  const covered = (name, ancestors = new Set()) => {
    if (!Object.hasOwn(findings, name) || ancestors.has(name)) return false;
    const finding = findings[name];
    if (!developmentOnly(finding) || !Array.isArray(finding.via) || finding.via.length === 0) return false;
    const next = new Set(ancestors).add(name);
    return finding.via.every(via => {
      if (typeof via === "string") return covered(via, next);
      return name === exception.package && via?.name === exception.package &&
        via?.dependency === exception.package && via?.url === exception.advisory &&
        finding.nodes.every(node => lock.packages[node].version === exception.version);
    });
  };

  const allowed = [];
  const blocked = [];
  for (const name of Object.keys(findings)) {
    if (production) blocked.push(name + ": production findings cannot be exempted");
    else if (!covered(name)) blocked.push(name + ": outside the approved development-only advisory");
    else if (now >= Date.parse(exception.expires)) blocked.push(name + ": exception expired");
    else allowed.push(name);
  }
  return { allowed, blocked };
}

function getReport(production) {
  if (!process.env.npm_execpath) throw new Error("Run this check with npm run audit.");
  const result = spawnSync(process.execPath,
    [process.env.npm_execpath, "audit", "--json", ...(production ? ["--omit=dev"] : [])],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 120_000 });
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    throw new Error("npm audit could not complete; the check fails closed.");
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error("npm audit returned invalid JSON; the check fails closed.");
  }
}

export function run() {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  for (const production of [true, false]) {
    const { allowed, blocked } = assessAudit(getReport(production), lock, { production });
    if (blocked.length) throw new Error(blocked.join("\n"));
    if (production) console.log("Production audit: zero vulnerabilities.");
    else if (allowed.length) {
      console.warn("Temporary development-only exception: " + exception.advisory);
      console.warn("Expires " + exception.expires + "; affected dependency entries: " + allowed.join(", "));
      console.warn("Raw findings remain visible with npm run audit:raw.");
    } else console.log("Full audit: zero vulnerabilities; the exception is not needed.");
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    run();
  } catch (error) {
    console.error("Security audit failed: " + error.message);
    process.exitCode = 1;
  }
}
