import assert from 'node:assert/strict';
import { fromHuman, toHumanString } from '@somnia-chain/markets-sdk';
import { saveEvidence } from './config.mjs';

const cases = [];
for (const decimals of [6, 7, 8, 9, 18, 24]) {
  // One tenth of an atom below the next atom. This cannot be represented exactly.
  const input = `1.${'0'.repeat(decimals)}9`;
  let raw;
  let error;
  try { raw = fromHuman(input, decimals); }
  catch (caught) { error = { name: caught.name, message: caught.message }; }
  cases.push({ decimals, input, raw: raw?.toString(), output: raw === undefined ? undefined : toHumanString(raw, decimals), error });
}

const exact = fromHuman('1.123456', 6);
const trailingZeros = fromHuman('1.123456000', 6);
const numberRounding = fromHuman(0.1234567, 6);
const tinyInput = '0.0000009';
const tinyResult = fromHuman(tinyInput, 6);
const negativeResult = fromHuman('-1.0000009', 6);
const wholeBoundaryResult = fromHuman('0.999999999', 8);
const invalidNumbers = [NaN, Infinity, -Infinity].map(input => {
  try { return { input: String(input), accepted: true, result: fromHuman(input, 6).toString() }; }
  catch (error) { return { input: String(input), accepted: false, error: error.name }; }
});

const result = saveEvidence('004-exact-string-rounding', {
  network: 'Offline SDK conversion; decimal scales used by Somnia Tokyo perp markets', wallet: null,
  docs: 'https://prd.smk.somnia.host/docs/typescript/api/index/functions/fromHuman',
  cases,
  controls: { exact: exact.toString(), trailingZeros: trailingZeros.toString(), numberRounding: numberRounding.toString(), invalidNumbers },
  tiny: { input: tinyInput, decimals: 6, raw: tinyResult.toString(), output: toHumanString(tinyResult, 6) },
  negative: { input: '-1.0000009', decimals: 6, raw: negativeResult.toString(), output: toHumanString(negativeResult, 6) },
  wholeBoundary: { input: '0.999999999', decimals: 8, raw: wholeBoundaryResult.toString(), output: toHumanString(wholeBoundaryResult, 8) },
});

assert.equal(exact, 1123456n);
assert.equal(trailingZeros, exact);
assert.equal(numberRounding, 123457n, 'Number rounding is documented and is a control, not a reported bug');
assert.ok(invalidNumbers.every(c => !c.accepted && c.error === 'InvalidInputError'));
assert.ok(cases.every(c => c.error === undefined && BigInt(c.raw) === 10n ** BigInt(c.decimals) + 1n), 'Issue not reproduced: overprecise strings were not silently rounded upward');
console.log(`BUG REPRODUCED at ${cases.length} decimal scales; exact, trailing-zero, number-rounding and non-finite controls passed.`);
console.log(JSON.stringify({ tiny: result.tiny, negative: result.negative }));
