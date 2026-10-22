import assert from 'node:assert/strict';
import { exchangeFor, saveEvidence } from './config.mjs';

const funding = [];
const candles = [];
async function gql(url, query, variables) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(20000) });
  assert.ok(response.ok, `GraphQL HTTP status ${response.status}`);
  const body = await response.json();
  assert.equal(body.errors, undefined, JSON.stringify(body.errors));
  return body.data;
}

const tokyo = exchangeFor();
try {
  const markets = Object.values(await tokyo.loadMarkets());
  for (const base of ['BTC', 'ETH', 'SOL']) {
    const market = markets.find(m => m.type === 'swap' && m.base === base);
    assert.ok(market);
    const [latest] = await tokyo.fetchFundingRateHistory(market.symbol, undefined, 1);
    assert.ok(latest);
    for (const offsetMs of [0, 1, 999, 1000]) {
      const since = latest.timestamp + offsetMs;
      const rows = await tokyo.fetchFundingRateHistory(market.symbol, since, 1);
      funding.push({ symbol: market.symbol, offsetMs, since, returned: rows.map(r => ({ timestamp: r.timestamp, id: r.info.id })), violatesLowerBound: rows.some(r => r.timestamp < since) });
    }
  }
} finally { await tokyo.close(); }

const query = `query VerifyCandles($where: Candle_bool_exp!, $limit: Int!) {
  Candle(where: $where, order_by: [{bucketStart: asc}], limit: $limit) { bucketStart openPrice high low closePrice baseVolume }
}`;
for (const mainnet of [false, true]) {
  const exchange = exchangeFor(mainnet);
  try {
    const markets = Object.values(await exchange.loadMarkets());
    const bases = mainnet ? ['SOMI', 'WETH'] : ['BTC', 'ETH'];
    for (const base of bases) {
      const market = markets.find(m => m.type === (mainnet ? 'spot' : 'swap') && m.base === base);
      assert.ok(market);
      const full = await exchange.fetchOHLCV(market.symbol, '1h', undefined, 24);
      assert.ok(full.length > 2);
      const since = full[0][0];
      const variables = { where: { pool: { _eq: market.id }, market_id: { _eq: market.id }, intervalSeconds: { _eq: 3600 }, bucketStart: { _gte: since / 1000 } }, limit: 2 };
      const indexer = mainnet ? 'https://prd.smk.somnia.host/v1/graphql' : 'https://hideki-dev.smk.somnia.host/v1/graphql';
      const direct = await gql(indexer, query, variables);
      const actual = await exchange.fetchOHLCV(market.symbol, '1h', since, 2);
      const expectedTimestamps = direct.Candle.map(c => Number(c.bucketStart) * 1000);
      const actualTimestamps = actual.map(c => c[0]);
      candles.push({ network: mainnet ? 'mainnet' : 'Tokyo', symbol: market.symbol, since, request: { indexer, query, variables }, response: direct, expectedTimestamps, actualTimestamps, skippedEarlierRows: actualTimestamps[0] > expectedTimestamps[0] });
    }
  } finally { await exchange.close(); }
}

saveEvidence('round2-validation', { funding, candles });
assert.ok(funding.filter(c => c.offsetMs === 0 || c.offsetMs === 1000).every(c => !c.violatesLowerBound), 'Whole-second controls failed');
assert.ok(funding.filter(c => c.offsetMs === 1 || c.offsetMs === 999).every(c => c.violatesLowerBound), 'Funding issue did not reproduce for every fractional-second case');
assert.ok(candles.every(c => c.skippedEarlierRows), 'Candle discrepancy did not reproduce for every market');
console.log('Funding: 6 fractional-second failures, 6 whole-second controls passed across BTC/ETH/SOL.');
console.log('Candles: 4 discrepancies confirmed against direct ascending GraphQL queries on Tokyo and mainnet.');
