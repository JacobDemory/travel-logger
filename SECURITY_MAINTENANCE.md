# Dependency security policy

Reviewed November 18, 2026.

Run `npm run audit` for the security gate and `npm run audit:raw` to see npm's complete, unfiltered report.

The gate first requires a production-only audit with zero findings. It then rejects every full-audit finding except the explicitly approved temporary exception below. Registry failures, invalid reports, missing lockfile information, other advisories, and runtime dependency paths fail the check.

## Temporary development-only exception

- Advisory: https://github.com/advisories/GHSA-fc5q-39xc-vjpf
- Package/version: picomatch 4.0.7 only.
- Expiry: December 18, 2026 at 00:00 UTC; expiry is enforced by the audit script.
- Approved November 18, 2026 because the upstream advisory lists no patched release.
- Scope: development/build tooling using repository-controlled glob patterns. The exception includes only dependency-chain findings whose sole underlying advisory is the one above. Every affected lockfile node must be marked development-only.
- Residual risk: malicious glob patterns can exhaust the build process. Build trusted source/configuration; this exception does not make the affected dependency safe or remove its raw audit findings.

Replace the affected dependency as soon as a compatible upstream fix is available, rerun the raw audit and build checks, and remove the exception when unnecessary. Do not extend the expiry or suppress another advisory without review.

`npm run test:security` verifies production rejection, advisory/version/dependency-path limits, expiration, and malformed-report handling. No dependency or audit level is downgraded to clear the gate.
