// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

import { PricingClient } from '@tetherto/wdk-pricing-provider'
import axios from 'axios'

export class BitfinexPricingClient extends PricingClient {
  /** @internal */
  HISTORICAL_DATA_AGE = 365 * 24 * 60 * 60000

  /** @internal */
  MAX_HISTORICAL_ENTRIES = 100

  constructor () {
    super()
    /** @internal */
    this.client = axios.create({
      baseURL: 'https://api-pub.bitfinex.com/v2'
    })
  }

  /**
   * @param {string} from - Base currency (e.g. 'BTC')
   * @param {string} to - Quote currency (e.g. 'USD')
   * @returns {Promise<number|null>}
   */
  async getCurrentPrice (from, to) {
    const [price] = await this.getMultiCurrentPrices([{ from, to }])
    return price ?? null
  }

  /**
   * Posts a batch of FX conversion requests to Bitfinex and returns the
   * resulting rates in the same order as the input pairs. Bitfinex returns
   * `null` for any pair it cannot convert directly.
   * @internal
   * @param {Array<{ ccy1: string, ccy2: string, fiat_fx?: number, amount?: number }>} pairs
   * @returns {Promise<Array<number|null>>}
   */
  async _fxBatch (pairs) {
    const response = await this.client.post(
      '/calc/fx/batch',
      { pairs },
      {
        headers: {
          contentType: 'application/json',
          accept: 'application/json'
        }
      }
    )
    return response.data
  }

  /**
   * Builds a Bitfinex ticker symbol for a currency pair.
   * Bitfinex requires a colon separator when either symbol is longer than 3 characters
   * (e.g. tXAUT:USD instead of tXAUTUSD).
   * @internal
   * @param {string} from - Base currency (e.g. 'BTC', 'XAUT')
   * @param {string} to - Quote currency (e.g. 'USD')
   * @returns {string} Bitfinex ticker symbol (e.g. 'tBTCUSD', 'tXAUT:USD')
   */
  _tickerFor (from, to) {
    const f = from.toUpperCase()
    const t = to.toUpperCase()
    if (f.length > 3 || t.length > 3) {
      return `t${f}:${t}`
    }
    return `t${f}${t}`
  }

  /**
   * Fetches the current conversion rate for multiple currency pairs in a single
   * batch request. Pairs that Bitfinex cannot convert directly (typically fiat
   * currencies it does not quote, e.g. BRL or ARS) fall back to a two-leg
   * conversion through USD using its fiat FX rates: `from -> USD -> to`.
   * @param {import('@tetherto/wdk-pricing-provider').PricePair[]} list - Array of currency pairs
   * @returns {Promise<Array<number|null>>} Prices in the same order as input pairs; `null` for pairs that cannot be resolved
   */
  async getMultiCurrentPrices (list) {
    const direct = await this._fxBatch(
      list.map((p) => ({
        ccy1: p.from.toUpperCase(),
        ccy2: p.to.toUpperCase(),
        amount: 1
      }))
    )

    const pivotIndexes = []
    direct.forEach((price, index) => {
      if (price == null) {
        pivotIndexes.push(index)
      }
    })

    if (pivotIndexes.length === 0) {
      return direct
    }

    // Fall back to converting through USD for pairs Bitfinex cannot quote
    // directly. Each pair contributes two legs: `from -> USD` and `USD -> to`,
    // the latter using fiat FX rates.
    const pivotPairs = []
    for (const index of pivotIndexes) {
      const p = list[index]
      pivotPairs.push({ ccy1: p.from.toUpperCase(), ccy2: 'USD', amount: 1 })
      pivotPairs.push({ ccy1: 'USD', ccy2: p.to.toUpperCase(), fiat_fx: 1, amount: 1 })
    }

    const pivot = await this._fxBatch(pivotPairs)

    const prices = [...direct]
    pivotIndexes.forEach((listIndex, n) => {
      const fromUsd = pivot[n * 2]
      const usdTo = pivot[n * 2 + 1]
      prices[listIndex] =
        fromUsd == null || usdTo == null ? null : fromUsd * usdTo
    })

    return prices
  }

  /**
   * Fetches full price data (last price, daily change, relative daily change)
   * for multiple currency pairs in a single batch request.
   * @param {import('@tetherto/wdk-pricing-provider').PricePair[]} list - Array of currency pairs
   * @returns {Promise<Array<import('@tetherto/wdk-pricing-provider').PriceData|null>>} Price data in the same order as input pairs; `null` for pairs not present in the response
   */
  async getMultiPriceData (list) {
    const symbols = list.map((p) => this._tickerFor(p.from, p.to)).join(',')

    const response = await this.client.get(`/tickers?symbols=${symbols}`)

    const SYMBOL_INDEX = 0
    const DAILY_CHANGE_INDEX = 5
    const DAILY_CHANGE_RELATIVE_INDEX = 6
    const LAST_PRICE_INDEX = 7

    const priceDataBySymbol = new Map()
    for (const ticker of response.data) {
      priceDataBySymbol.set(ticker[SYMBOL_INDEX], {
        lastPrice: ticker[LAST_PRICE_INDEX],
        dailyChange: ticker[DAILY_CHANGE_INDEX],
        dailyChangeRelative: ticker[DAILY_CHANGE_RELATIVE_INDEX]
      })
    }

    return list.map((p) => priceDataBySymbol.get(this._tickerFor(p.from, p.to)) ?? null)
  }

  /**
   * @param {string} from - Base currency (e.g. 'BTC')
   * @param {string} to - Quote currency (e.g. 'USD')
   * @param {import('@tetherto/wdk-pricing-provider').HistoricalPriceOptions} [opts={}]
   * @returns {Promise<import('@tetherto/wdk-pricing-provider').HistoricalPriceResult[]>}
   */
  async getHistoricalPrice (from, to, opts = {}) {
    if (
      opts.start &&
      opts.start < new Date().getTime() - this.HISTORICAL_DATA_AGE
    ) {
      throw new Error('Start date should be within last 365 days')
    }

    const start = opts.start
    const end = opts.end

    const results = []

    let cursor = end

    // Bitfinex returns data rounded to 1 hour, results are always in descending order
    while (Math.abs(cursor - start) > 3600000) {
      const response = await this.client.get(
        `/tickers/hist?symbols=${this._tickerFor(from, to)}&limit=100&start=${start}&end=${cursor}`
      )

      if (!response.data.length) {
        break
      }

      results.push(
        ...response.data.map((item) => ({
          price: item[3],
          ts: item[12]
        }))
      )

      const resultStart = response.data[response.data.length - 1][12]

      cursor = resultStart
    }

    return this._cappedToMaxResults(results)
  }

  /**
   * @internal
   * @param {import('@tetherto/wdk-pricing-provider').HistoricalPriceResult[]} results
   * @returns {import('@tetherto/wdk-pricing-provider').HistoricalPriceResult[]}
   */
  _cappedToMaxResults (results) {
    if (results.length <= this.MAX_HISTORICAL_ENTRIES) {
      return results
    }

    return this._cappedToMaxResults(
      results.filter((_, index) => index % 2 === 0)
    )
  }
}
