# Published HTTP trading reference contains endpoint headings but omits required parameters and response schemas
Severity: normal
Area: docs

## Steps to reproduce
1. Open [the mainnet HTTP trading reference](https://app.dreamdex.io/docs/developers/http-api/trading), or [the testnet copy](https://app.testnet.dreamdex.io/docs/developers/http-api/trading).
2. Locate `GET /v0/markets/{symbol}/candles`.
3. Observe that the endpoint heading is immediately followed by the Order Management section. There is no parameter table, allowed interval values, timestamp-unit reference, response schema, or request example for candles.
4. Make the request that the section actually documents: `GET https://api.dreamdex.io/v0/markets/SOMI:USDso/candles`.
5. Observe HTTP `400`: the undocumented `interval` query parameter is required.
6. Run `python repro/005-api-docs-schema.py` to capture the article content from both hosts and the API response.

## Expected
The endpoint reference documents required query parameters, their valid values and units, and the response shape. An integrator can construct a valid candle request without discovering its contract through successive validation errors.

## Actual
The candle section contains only its method/path heading. The API requires an `interval` parameter, which the section does not identify. The trades and ticker references on the same page likewise appear only as headings. The HTTP API overview supplies environment URLs but does not link a complete OpenAPI specification as a replacement for these missing sections.

This was confirmed in the rendered browser page as well as the server-rendered article, so the observation is not based solely on a text search engine missing an interactive table.

Restore or add the endpoint parameter/request/response reference and a minimal working candle request. If a generated API component is intended to provide it, ensure it actually renders and include a usable specification link as a fallback.

## Evidence

```text
Rendered section:
GET /v0/markets/{symbol}/candles
[next heading: Order Management]

GET https://api.dreamdex.io/v0/markets/SOMI:USDso/candles
HTTP 400
{"description":"Query argument interval is required, but not found",
 "name":"missing_field","status":400}
```

- [HTTP reproducer](../repro/005-api-docs-schema.py)
- [Captured articles and live validation response](../evidence/005-api-docs-schema.json)
- [Rendered browser screenshot](../evidence/005-api-docs-headings.jpg)

## Environment
- SDK version: not applicable; HTTP API documentation.
- Networks verified: Somnia mainnet REST API (`5031`) and the documentation published at both mainnet and testnet app hosts.
- Bounty scope note: this is supplementary HTTP documentation feedback; it is not a demonstrated Tokyo perps REST endpoint defect. Tokyo bounty eligibility is for the organizer to assess.
- Browser: in-app browser, logged out, Windows; independent Python 3.12 HTTP capture.
- Wallet address: not applicable.
- Transactions: none.
