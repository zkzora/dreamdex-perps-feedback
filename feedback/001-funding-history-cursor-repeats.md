# Funding-history pagination repeats the last record indefinitely with the documented millisecond cursor
Severity: normal
Area: SDK

## Steps to reproduce
1. Install the pinned dependencies with `npm ci --ignore-scripts`.
2. Run `npm run repro:funding`. No wallet or private key is required.
3. The script loads the live Tokyo BTC perp, obtains the newest funding record, then calls `fetchFundingRateHistory(symbol, last.timestamp + 1, 1)` three times. Each subsequent cursor is the previous result's timestamp plus one millisecond, matching the SDK's pagination example.
4. Inspect `evidence/001-funding-cursor.json`.

Minimal call sequence:

```js
const [last] = await exchange.fetchFundingRateHistory(symbol, undefined, 1);
const since = last.timestamp + 1;
const page = await exchange.fetchFundingRateHistory(symbol, since, 1);
// page[0].timestamp < since; the previous record is returned again.
```

## Expected
The inclusive millisecond `since` bound excludes a record whose timestamp is one millisecond earlier. At the end of history the next page is empty; if new funding has settled, it contains only records at or after `since`. The documented forward-pagination loop terminates when caught up.

## Actual
The previous funding record is returned even though its timestamp precedes `since`. Advancing the cursor by one millisecond produces the same request bound repeatedly. A consumer using the documented loop can run indefinitely, repeatedly processing the same funding record and issuing unnecessary requests.

In the published `0.32.1` package, `src/unified/exchange.ts:5699` implements `fetchFundingRateHistory`; its conversion at line 5707 uses `Math.floor(since / 1000)`. The downstream `listFundingRateHistory` query uses an inclusive seconds bound. Consequently, the extra millisecond is discarded. The pagination example immediately above this method advances by `timestamp + 1`.

Preserve the millisecond lower bound, for example by rounding the lower bound upward to the next represented second, or by applying the exact millisecond filter before enforcing the page limit. Existing whole-second inclusivity must remain intact.

## Evidence
Captured on October 22, 2026:

```text
Market: BTC/USDso:USDso
Pool: 0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0
Existing record timestamp: 1792681903000
Requested since:          1792681903001
Returned timestamp:       1792681903000
The same record was returned on all three iterations.
```

Indexed record ID: `0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0_30298868_42`.

Funding transaction hash recorded by the indexer: `0x0d0fe6d5f123535ba4f9454924fc423fc34b648839f02f9dacafe810bab72f07`.

- [Executable reproducer](../repro/001-funding-cursor.mjs)
- [Full SDK request arguments and returned records](../evidence/001-funding-cursor.json)
- [Pinned published SDK](https://www.npmjs.com/package/@somnia-chain/markets-sdk/v/0.32.1)

The reproducer also requests the next whole-second cursor as a control. It uses only four funding-history requests after obtaining the initial record, and does not run an unbounded loop.

Follow-up verification: `npm run validate:round2` reproduced this on BTC, ETH and SOL. Offsets of 1 ms and 999 ms returned records before `since` in all six cases; exact-second offsets of 0 ms and 1000 ms passed all six controls. See [the expanded validation evidence](../evidence/round2-validation.json).

## Environment
- SDK: `@somnia-chain/markets-sdk@0.32.1`; dependencies pinned in `package-lock.json`.
- Network: Somnia Tokyo testnet / Hideki v2, chain ID `50383`.
- Indexer: `https://hideki-dev.smk.somnia.host/v1/graphql`.
- Runtime: Node.js `v24.16.0`, Windows.
- Wallet address: not applicable; public reads only.
- Submitted transactions: none. The hash above identifies an existing public funding event.
