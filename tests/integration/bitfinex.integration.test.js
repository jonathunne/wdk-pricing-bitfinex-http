'use strict'

import { describe, expect, it, jest, beforeAll } from '@jest/globals'
import { BitfinexPricingClient } from '../../index.js'

describe('Integration: BitfinexPricingClient (real API)', () => {
  beforeAll(() => {
    jest.setTimeout(20000)
  })

  it('fetches current price from Bitfinex API without mocks', async () => {
    const client = new BitfinexPricingClient()

    const price = await client.getCurrentPrice('BTC', 'USD')

    expect(typeof price).toBe('number')
    expect(price).toBeGreaterThan(0)
  })

  it('fetches multiple prices from Bitfinex API without mocks', async () => {
    const client = new BitfinexPricingClient()

    const prices = await client.getMultiCurrentPrices([
      { from: 'BTC', to: 'USD' },
      { from: 'ETH', to: 'USD' }
    ])

    expect(prices).toHaveLength(2)
    expect(typeof prices[0]).toBe('number')
    expect(typeof prices[1]).toBe('number')
    expect(prices[0]).toBeGreaterThan(0)
    expect(prices[1]).toBeGreaterThan(0)
  })

  it('prices USDT by translating it to the Bitfinex UST code', async () => {
    const client = new BitfinexPricingClient()

    const price = await client.getCurrentPrice('USDT', 'USD')

    expect(price).toBeGreaterThan(0.9)
    expect(price).toBeLessThan(1.1)
  })

  it('returns price data for USDT via the translated ticker', async () => {
    const client = new BitfinexPricingClient()

    const [data] = await client.getMultiPriceData([{ from: 'USDT', to: 'USD' }])

    expect(data.lastPrice).toBeGreaterThan(0.9)
    expect(data.lastPrice).toBeLessThan(1.1)
    expect(data.dailyChange).toBeGreaterThan(-0.05)
    expect(data.dailyChange).toBeLessThan(0.05)
    expect(data.dailyChangeRelative).toBeGreaterThan(-0.05)
    expect(data.dailyChangeRelative).toBeLessThan(0.05)
  })

  it('prices a symbol that only the published aliases can resolve', async () => {
    const client = new BitfinexPricingClient()

    // LBTC is absent from the built-in table; Bitfinex quotes it as LBT.
    const price = await client.getCurrentPrice('LBTC', 'USD')

    expect(typeof price).toBe('number')
    expect(price).toBeGreaterThan(0)
  })

  it('returns null for a fiat currency Bitfinex does not quote directly', async () => {
    const client = new BitfinexPricingClient()

    // BRL is not quoted directly by Bitfinex, so the pair cannot be resolved
    const price = await client.getCurrentPrice('BTC', 'BRL')

    expect(price).toBeNull()
  })
})



