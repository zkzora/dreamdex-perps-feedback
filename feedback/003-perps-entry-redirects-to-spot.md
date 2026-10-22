# Logged-out Perps entry links silently redirect to the Spot trading page
Severity: normal
Area: app

## Steps to reproduce
1. Open a fresh browser session without signing in to dreamDEX.
2. Follow the Perps link from the [testnet developer guide](https://app.testnet.dreamdex.io/docs/developers/perps-testnet), whose target is `https://app.testnet.dreamdex.io/perps`.
3. Observe the final URL and market. It opens `/trade/spot/tokyo/STT:USDso` and displays STT spot trading.
4. Alternatively, open the app's **Trade** menu. Its **Perps** entry targets `/trade/perps/tokyo/BTC-PERP`; that target also redirects to Spot.
5. For a browser-independent reproduction, run `python repro/003-perps-routing.py`. It records each HTTP response before following its `Location` header.

## Expected
Both entry points open the requested perps product. If accessing that product requires signing in, show a clear sign-in requirement and preserve the requested destination.

## Actual
The server issues a sequence of redirects to Spot, without indicating why Perps was unavailable. A new user following the bounty's onboarding material reaches the wrong product. The app's own Perps navigation link has the same result, so this is not limited to the legacy `/perps` alias.

This report covers the logged-out entry flow. Authenticated routing and order placement were not tested, and this report does not claim that authenticated perps trading is unavailable.

## Evidence
Unauthenticated GET requests captured on October 22, 2026:

```text
GET /perps
307 Location: /trade/perps/tokyo/BTC-PERP

GET /trade/perps/tokyo/BTC-PERP
307 Location: /trade

GET /trade
307 Location: /trade/spot/tokyo/STT:USDso

GET /trade/spot/tokyo/STT:USDso
200
```

The direct Spot URL returns `200` as a control. The same final Spot URL and STT market were observed in the browser after following the navigation entry.

- [Executable standard-library HTTP reproducer](../repro/003-perps-routing.py)
- [Full redirect chains and control request](../evidence/003-perps-routing.json)
- [Browser view of the resulting STT Spot page](../evidence/003-perps-spot-landing.jpg)
- [Perps developer guide](https://app.testnet.dreamdex.io/docs/developers/perps-testnet)

## Environment
- SDK version: not applicable; app/server routing.
- Network: Somnia Tokyo testnet application at `https://app.testnet.dreamdex.io`.
- Browser: in-app browser, logged out, Windows.
- Independent HTTP reproduction: Python 3.12 standard library, no cookies or authentication headers.
- Wallet address: not applicable; no wallet connected.
- Submitted transactions: none.
