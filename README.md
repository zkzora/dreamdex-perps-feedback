# dreamDEX Perps feedback

Reproducible feedback for the [dreamDEX Perps Builder Bounty](https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail), based on the published SDK, Tokyo testnet market data and public app flows. Each item uses the organizer's Markdown template in its own `feedback/` file. Report 005 is supplementary HTTP documentation feedback; Tokyo bounty eligibility is not established.

Severity values are provisional assessments. Acceptance, duplicate status and payment have not been established. A GitHub repository alone does not confirm DoraHacks submission.

| Report | Observed impact | Verified environment | Proposed severity |
| --- | --- | --- | --- |
| [001: Funding cursor](feedback/001-funding-history-cursor-repeats.md) | Documented cursor loop repeatedly returns the same funding event | Tokyo BTC perps | normal |
| [002: OHLCV history](feedback/002-ohlcv-since-skips-history.md) | Forward pagination skips 22 of 24 known candles | Tokyo BTC perps and mainnet SOMI spot | normal |
| [003: Perps routing](feedback/003-perps-entry-redirects-to-spot.md) | Logged-out Perps entry links lead to Spot | Testnet app | normal |
| [004: Exact string conversion](feedback/004-exact-string-input-is-silently-rounded.md) | Decimal strings are silently rounded despite the exact-input documentation | SDK, six Tokyo decimal scales | normal |
| [005: API reference schemas](feedback/005-http-api-reference-omits-endpoint-schemas.md) | Required candle parameters and response schemas are absent | Both docs hosts; mainnet REST control | normal; supplementary |

Reports 001 and 002 include expanded tests with exact-second controls and independent GraphQL comparisons. Report 004 includes exact, trailing-zero and invalid-number controls.

## Reproduce

Requirements: Node.js and npm; Python 3 for the HTTP redirect check. Tested with Node.js v24.16.0, npm 11.13.0 and Python 3.12 on Windows.

```sh
npm ci --ignore-scripts
npm run repro:funding
npm run repro:candles
npm run repro:routing
npm run repro:precision
npm run repro:api-docs
npm run validate:round2
```

Run commands from this directory. No environment variables, wallet, private key or test funds are required. The scripts perform bounded public reads and submit no transactions. Dependencies are pinned by `package-lock.json`.

The scripts print `BUG REPRODUCED` when their observations match the report and save full request arguments and responses under `evidence/`. Assertions intentionally check for the reported bug; after an upstream fix, they should fail with an issue-not-reproduced message. Live values can change; the included evidence is the observation captured on October 22, 2026, with UTC collection times inside each JSON file.

Report 002's mainnet evidence comes from the same SDK method on an existing spot market. Mainnet perps were not found in the loaded registry; no mainnet-perps failure is claimed.

The `feedback/`, `repro/` and `evidence/` directories and dependency files form the review package. Local exploratory notes and review notes are ignored. The organizer asks that security vulnerabilities be reported privately; the five reports here concern non-security SDK behavior, documentation and app routing. No confirmed security vulnerability is included.
