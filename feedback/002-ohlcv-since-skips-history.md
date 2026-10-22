# OHLCV forward pagination skips existing historical candles on Tokyo perps and mainnet spot
Severity: normal
Area: SDK

## Steps to reproduce
1. Install dependencies with `npm ci --ignore-scripts`.
2. Run `npm run repro:candles`. It checks Tokyo `BTC/USDso:USDso` and mainnet `SOMI/USDso` using public reads.
3. Request 24 existing hourly candles. Use the oldest returned candle's timestamp as `since`.
4. Call `fetchOHLCV(symbol, '1h', since, 2)` to begin paginating that known history with two candles per page.
5. Advance to `lastReturnedTimestamp + 3600000` and request the next page.
6. Compare the paginated output against the original 24-candle window.

## Expected
With an explicit `since`, a forward historical read starts with the earliest available candles at or after that cursor. Two-candle pagination can traverse the same known window without dropping its earlier candles.

This also matches the forward-cursor behavior described beside `fetchFundingRateHistory` in the published SDK, which explicitly compares that behavior with `fetchOHLCV`. Without `since`, returning the most recent candles is appropriate.

## Actual
The first page contains the newest two candles, despite the earlier explicit cursor. The next page is empty. Twenty-two existing candles are omitted on both tested networks.

In SDK `0.32.1`, `src/unified/exchange.ts:2443` implements `fetchOHLCV`. The call to `getCandles` supplies only `limit` and `market`; `since` is applied after the newest `limit` rows have already been selected by the indexer. The caller therefore cannot paginate forward through older candles with this method. This is a different failure from the funding cursor's millisecond rounding: the OHLCV reproducer uses exact hourly boundaries.

Apply the requested lower bound and forward ordering before the limit when `since` is supplied. Merely adding a client-side filter or a lower bound to a newest-first limited query still skips earlier eligible candles.

## Evidence
The same timestamps were observed for both Tokyo BTC perps and mainnet SOMI spot on October 22, 2026:

```text
since: 1792598400000
limit: 2
Expected first-page timestamps: [1792598400000, 1792602000000]
Actual first-page timestamps:   [1792677600000, 1792681200000]
Next cursor: 1792684800000
Actual next page: []
Existing candles skipped: 22 of the sampled 24
```

Tokyo BTC perp pool: `0x4181dd08e73bbcdd1ba3e615a18f6abd941b94c0`.

Mainnet SOMI spot pool: `0x035de7403eac6872787779cca7ccf1b4cdb61379`.

- [Executable reproducer for both networks](../repro/002-candle-pagination.mjs)
- [Tokyo requests, responses, original candles and skipped candles](../evidence/002-candle-pagination-tokyo.json)
- [Mainnet requests, responses, original candles and skipped candles](../evidence/002-candle-pagination-mainnet.json)
- [Published SDK exchange guide](https://prd.smk.somnia.host/docs/typescript/exchange)

The practical impact is incomplete historical input for charts, exports and strategy backfills that use a standard forward cursor. No trading loss was demonstrated.

Follow-up verification: `npm run validate:round2` compared SDK output with direct ascending GraphQL candle queries. The earlier candles existed and were omitted on Tokyo BTC/ETH perps and mainnet SOMI/WETH spot. The [validation evidence](../evidence/round2-validation.json) includes each independent GraphQL request and response.

## Environment
- SDK: `@somnia-chain/markets-sdk@0.32.1`; dependencies pinned in `package-lock.json`.
- Primary bounty reproduction: Somnia Tokyo testnet, chain ID `50383`, `BTC/USDso:USDso`.
- Additional verified reproduction: Somnia mainnet, chain ID `5031`, `SOMI/USDso` spot. This does not assert that mainnet perps are deployed.
- Indexers: `https://hideki-dev.smk.somnia.host/v1/graphql` and `https://prd.smk.somnia.host/v1/graphql`.
- Runtime: Node.js `v24.16.0`, Windows.
- Wallet address: not applicable; public reads only.
- Submitted transactions: none.
