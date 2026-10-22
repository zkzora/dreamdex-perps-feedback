# DoraHacks submission text

## Title

dreamDEX Perps Feedback: SDK History, Precision and App Routing

## Track

Feedback

## Repository

https://github.com/zkzora/dreamdex-perps-feedback

## Description

Reproducible feedback for dreamDEX perps on Somnia Tokyo testnet using @somnia-chain/markets-sdk 0.32.1. Four primary reports cover funding-history cursor repetition, skipped OHLCV history, Perps entry routing and the documented exact-string conversion contract. A fifth supplementary report documents missing HTTP API endpoint schemas and is explicitly separated from claims about Tokyo perps REST support.

Each issue has its own Markdown file in feedback/ following the bounty template. The repository includes executable reproduction scripts, captured request arguments and responses, independent GraphQL comparisons, control cases and browser screenshots where relevant.

The funding issue reproduced on BTC, ETH and SOL. The OHLCV issue reproduced on Tokyo BTC/ETH perps and mainnet SOMI/WETH spot. Tests use bounded public reads and offline conversions; no transactions were submitted. Proposed severity is normal for each item; no funds-loss or security-exploit claim is made.

## Submission steps

1. Log in to your DoraHacks account.
2. Open https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail and select Submit Build.
3. Create or select a Build, choose the Feedback track, and enter the title, description and repository URL above.
4. Complete any account-specific required fields, then submit and verify the Build appears under this hackathon.

Use the Feedback track for this repository. Account-specific eligibility is determined by the submission form.

Official deadline: November 1, 2026, 23:59 UTC, equivalent to November 2, 2026, 06:59 WIB.
