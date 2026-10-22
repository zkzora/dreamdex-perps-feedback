import { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES, SOMNIA_MAINNET_ADDRESSES } from '@somnia-chain/markets-sdk';
import { hidekiTestnet, somniaMainnet } from '@somnia-chain/markets-sdk/chains';
import { mkdirSync, writeFileSync } from 'node:fs';

export function exchangeFor(mainnet = false) {
  return new SomniaMarkets(mainnet
    ? { chain: somniaMainnet, indexerUrl: 'https://prd.smk.somnia.host/v1/graphql', addresses: SOMNIA_MAINNET_ADDRESSES }
    : { chain: hidekiTestnet, indexerUrl: 'https://hideki-dev.smk.somnia.host/v1/graphql', addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES });
}

export function saveEvidence(name, data) {
  mkdirSync('evidence', { recursive: true });
  const output = { collectedAtUtc: new Date().toISOString(), sdk: '@somnia-chain/markets-sdk@0.32.1', node: process.version, ...data };
  writeFileSync(`evidence/${name}.json`, JSON.stringify(output, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2) + '\n');
  return output;
}
