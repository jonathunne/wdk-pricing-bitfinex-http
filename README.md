# @tetherto/wdk-pricing-bitfinex-http

Note: This package is in beta. Please test in a dev setup first.

HTTP client for prices from Bitfinex, it uses [Bitfinex Public HTTP API](https://docs.bitfinex.com/docs/rest-public) to obtain the current price & historical data for given ticker.

It works as a `PricingClient` for [`@tetherto/wdk-pricing-provider`](https://github.com/tetherto/wdk-pricing-provider).

## 🔍 About WDK

This module is part of the WDK (Wallet Development Kit) project. Learn more at https://docs.wallet.tether.io.

## ✨ Features

- Compatible with [@tetherto/wdk-pricing-provider](https://github.com/tetherto/wdk-pricing-provider)
- Fetch current price for given ticker (single or batch) via the Bitfinex FX endpoint
- Fetch historical prices given ticker
- Downscales long history to max 100 points

## ⬇️ Installation

```bash
npm install @tetherto/wdk-pricing-bitfinex-http
```

## 🚀 Quick Start

```javascript
import { BitfinexPricingClient } from "@tetherto/wdk-pricing-bitfinex-http";

// Create the client
const client = new BitfinexPricingClient();

// Get latest price
const current = await client.getCurrentPrice("BTC", "USD");

// Get historical prices
const history = await client.getHistoricalPrice("BTC", "USD", {
  start: 1709906400000, // optional
  end: 1709913600000, // optional
});
```

## 📚 API Reference

### BitfinexPricingClient

Simple HTTP pricing client for Bitfinex.

#### Constructor

```javascript
new BitfinexPricingClient(options?)
```

Parameters:

- `options` (optional):
  - `currencyCodes`: map of common ticker symbols to Bitfinex currency codes, merged
    over the built-in defaults. Keys and values are upper-cased.

Symbols passed to every method are common ticker symbols (`USDT`, `BTC`, ...).
The client translates them to the currency codes Bitfinex expects before
calling the API, on both the base and the quote side. It resolves each symbol
in three steps:

1. The built-in table below, with any `currencyCodes` override merged over it.
2. Bitfinex's published aliases, read once per client from
   `https://api-pub.bitfinex.com/v2/conf/pub:map:currency:sym`. Test and
   derivative codes are ignored, and a symbol claimed by more than one code is
   skipped so step 3 applies.
3. The symbol itself, sent unchanged.

Step 1 is the pinned fast path: it covers the symbols Bitfinex publishes under
more than one code, where the aliases alone cannot say which is right, and it
keeps working when the alias endpoint is unreachable. Step 2 covers everything
else, so new listings need no change here. Built-in translations:

| Symbol | Bitfinex code |
| ------ | ------------- |
| `USDT` | `UST`         |
| `USDC` | `UDC`         |
| `WBTC` | `WBT`         |
| `WBT`  | `WHBT`        |
| `OP`   | `OPX`         |
| `ALGO` | `ALG`         |
| `DASH` | `DSH`         |
| `IOTA` | `IOT`         |

Use `currencyCodes` to pin a translation or to price one asset as another:

```javascript
const client = new BitfinexPricingClient({
  currencyCodes: { USDT0: "UST" }, // value USDT0 at the USDT price
});
```

### Methods

| Method                               | Description                       | Returns                                  |
| ------------------------------------ | --------------------------------- | ---------------------------------------- |
| `getCurrentPrice(base, quote)`       | Get latest price                  | `Promise<number \| null>`                |
| `getMultiCurrentPrices(pairs)`       | Get latest prices in a batch      | `Promise<Array<number \| null>>`         |
| `getMultiPriceData(pairs)`           | Get last price + 24h change batch | `Promise<Array<PriceData \| null>>`      |
| `getHistoricalPrice(from, to, opts?)`| Get price history                 | `Promise<Array<any>>`                    |

#### `getCurrentPrice(base, quote)`

Uses the Bitfinex `/calc/fx/batch` endpoint. Returns `null` if Bitfinex cannot
quote the pair directly (typically a fiat currency it does not list).

```javascript
const price = await client.getCurrentPrice("BTC", "USD");
```

#### `getMultiCurrentPrices(pairs)`

Resolves many pairs in a single batch request. Results are returned in the same
order as the input; a pair Bitfinex cannot quote directly is `null`.

```javascript
const prices = await client.getMultiCurrentPrices([
  { from: "BTC", to: "USD" },
  { from: "ETH", to: "USD" },
]);
```

#### `getMultiPriceData(pairs)`

Returns the last price plus 24h absolute and relative change for each pair, from
the Bitfinex `/tickers` endpoint. A currency Bitfinex does not quote directly
resolves to `null`. Results are returned in the same order as the input.

```javascript
const data = await client.getMultiPriceData([{ from: "BTC", to: "USD" }]);
// [{ lastPrice, dailyChange, dailyChangeRelative }]
```

#### `getHistoricalPrice(from, to, opts?)`

If the list is longer than 100 points, it is downscaled by 2x steps until <= 100.

```javascript
const series = await client.getHistoricalPrice("BTC", "USD");
```

## ⚠️ Limitations

- **Ambiguous symbols need an entry.** When Bitfinex publishes several codes for
  one common symbol, the aliases cannot say which is right, so step 2 skips it and
  the symbol is sent unchanged. Pin the right code in the table or via the
  `currencyCodes` option. `USDT` is the current example: `UST`, `USE`, `USX` and
  `USDTTON` all claim it, and only `UST` has a ticker market.
- **Only pairs Bitfinex quotes directly are supported.** Fiat currencies
  Bitfinex does not quote (e.g. BRL, ARS) resolve to `null` in
  `getCurrentPrice`, `getMultiCurrentPrices`, and `getMultiPriceData`, and
  `getHistoricalPrice` returns an empty array for them (Bitfinex has no
  historical FX series for such pairs).

## 🛠️ Development

```bash
npm install
npm run lint
npm test
```

## 📜 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For support, please open an issue on the GitHub repository.
