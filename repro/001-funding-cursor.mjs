import assert from 'node:assert/strict';
import { exchangeFor, saveEvidence } from './config.mjs';

const exchange = exchangeFor();
try {
  const markets = await exchange.loadMarkets();
  const btc = Object.values(markets).find(m => m.type === 'swap' && m.base === 'BTC');
  assert.ok(btc, 'BTC perp market must exist');
  const [latest] = await exchange.fetchFundingRateHistory(btc.symbol, undefined, 1);
  assert.ok(latest, 'The market must have funding history');
  let cursor = latest.timestamp + 1;
  const pages = [];
  // Bounded to three requests: demonstrate the cursor cycle without an infinite loop.
  for (let i = 0; i < 3; i++) {
    const rows = await exchange.fetchFundingRateHistory(btc.symbol, cursor, 1);
    pages.push({ since: cursor, rows });
    if (rows.length === 0) break;
    cursor = rows.at(-1).timestamp + 1;
  }
  const roundedCursor = Math.ceil((latest.timestamp + 1) / 1000) * 1000;
  const control = await exchange.fetchFundingRateHistory(btc.symbol, roundedCursor, 1);
  const result = saveEvidence('001-funding-cursor', {
    network: 'Somnia Tokyo testnet', chainId: 50383, wallet: null,
    symbol: btc.symbol, pool: btc.id, latest, pages,
    control: { since: roundedCursor, rows: control },
    observed: {
      returnsBeforeSince: pages.some(p => p.rows.some(r => r.timestamp < p.since)),
      cursorCycles: pages.length === 3 && pages.every(p => p.rows[0]?.info.id === latest.info.id),
    },
  });
  console.log(JSON.stringify(result.observed));
  console.log(`Record: ${latest.info.id}; timestamp: ${latest.timestamp}; requested since: ${pages[0].since}`);
  assert.ok(result.observed.returnsBeforeSince, 'Issue not reproduced: no row precedes since');
  assert.ok(result.observed.cursorCycles, 'Issue not reproduced: the bounded cursor loop did not cycle');
  console.log('BUG REPRODUCED. See evidence/001-funding-cursor.json');
} finally {
  await exchange.close();
}
