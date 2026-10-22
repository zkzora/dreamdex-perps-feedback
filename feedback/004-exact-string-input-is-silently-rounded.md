# fromHuman silently rounds overprecise decimal strings despite its exact-input documentation
Severity: normal
Area: SDK

## Steps to reproduce
1. Install the pinned package with `npm ci --ignore-scripts`.
2. Run `npm run repro:precision`.
3. Observe `fromHuman('0.0000009', 6)`, which returns `1n`. Formatting that result with `toHumanString(result, 6)` returns `'0.000001'`, a different amount.
4. Observe `fromHuman('1.0000009', 6)`, which returns `1000001n` rather than rejecting the unrepresentable exact string.
5. The reproducer repeats this at 6, 7, 8, 9, 18 and 24 decimals, covering the base decimal scales used by Tokyo perp markets. It also tests valid strings, trailing zeroes, documented number rounding and non-finite-number rejection as controls.

## Expected
The published [fromHuman reference](https://prd.smk.somnia.host/docs/typescript/api/index/functions/fromHuman) tells callers to pass a string when the exact value must be preserved or rejected. A decimal string that cannot be represented at the requested scale should therefore be rejected, while exactly representable strings, including extra trailing zeroes, remain accepted.

Numeric input rounding is explicitly documented and is not the issue reported here.

## Actual
The string overload calls viem's `parseUnits` directly. That parser rounds excess decimal places, so string inputs are silently changed too. Values can increase, decrease, become zero, or cross a whole-token boundary without an error.

This affects callers using the public conversion helper to prepare raw amounts for the write API under the documented assumption that the string path preserves exactness. This report does not claim a specific app form uses this path or that funds were lost.

Either validate that a string is exactly representable before conversion, or explicitly document the rounding behavior and provide a strict conversion API. The current exact-string guarantee should not be retained alongside silent rounding.

## Evidence

```text
input='1.0000009', decimals=6
raw=1000001, output='1.000001'

input='0.0000009', decimals=6
raw=1, output='0.000001'

input='0.999999999', decimals=8
raw=100000000, output='1'

input='1.0000000000000000009', decimals=18
raw=1000000000000000001, output='1.000000000000000001'
```

- [Executable reproducer](../repro/004-exact-string-rounding.mjs)
- [Six-scale test matrix and controls](../evidence/004-exact-string-rounding.json)
- Published package implementation: `src/units.ts:54` (`fromHuman`).
- [Public function reference](https://prd.smk.somnia.host/docs/typescript/api/index/functions/fromHuman)

## Environment
- SDK: `@somnia-chain/markets-sdk@0.32.1`, viem `2.57.10` from the lockfile.
- Network: offline conversion; applicable to Somnia Tokyo testnet perps and other SDK consumers using these decimal scales.
- Runtime: Node.js `v24.16.0`, Windows.
- Wallet address: not applicable; no signer or wallet needed.
- Transactions: none.
