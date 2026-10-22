import assert from 'node:assert/strict';
import { exchangeFor, saveEvidence } from './config.mjs';

for (const mainnet of [false, true]) {
  const exchange = exchangeFor(mainnet);
  try {
    const markets = await exchange.loadMarkets();
    const market = Object.values(markets).find(m => mainnet
      ? m.type === 'spot' && m.base === 'SOMI'
      : m.type === 'swap' && m.base === 'BTC');
    assert.ok(market, 'Target market must exist');
    const window = await exchange.fetchOHLCV(market.symbol, '1h', undefined, 24);
    assert.ok(window.length > 2, 'Need more than two existing hourly candles');
    const since = window[0][0];
    const page1 = await exchange.fetchOHLCV(market.symbol, '1h', since, 2);
    assert.ok(page1.length > 0, 'First page must contain candles');
    const nextSince = page1.at(-1)[0] + 3_600_000;
    const page2 = await exchange.fetchOHLCV(market.symbol, '1h', nextSince, 2);
    const returned = new Set([...page1, ...page2].map(c => c[0]));
    const skipped = window.filter(c => !returned.has(c[0]));
    const result = saveEvidence(`002-candle-pagination-${mainnet ? 'mainnet' : 'tokyo'}`, {
      network: mainnet ? 'Somnia mainnet' : 'Somnia Tokyo testnet',
      chainId: mainnet ? 5031 : 50383, wallet: null,
      symbol: market.symbol, pool: market.id, timeframe: '1h',
      since, limit: 2, expectedFirstPage: window.slice(0, 2), page1,
      nextSince, page2, existingWindow: window, skipped,
      observed: {
        firstPageSkipsAvailableEarlierCandles: page1[0][0] > window[0][0],
        nextPageIsEmptyDespiteSkippedHistory: page2.length === 0 && skipped.length > 0,
      },
    });
    console.log(`${result.network}: ${JSON.stringify(result.observed)}; skipped=${skipped.length}`);
    assert.ok(result.observed.firstPageSkipsAvailableEarlierCandles, 'Issue not reproduced: page starts at requested history');
    assert.ok(result.observed.nextPageIsEmptyDespiteSkippedHistory, 'Issue not reproduced: no premature end of pagination');
  } finally {
    await exchange.close();
  }
}
console.log('BUG REPRODUCED on Tokyo perps and mainnet spot. See evidence/002-*.json');
