/**
 * @typedef {import('@tetherto/wdk-pricing-provider').PricePair} PricePair
 * @typedef {import('@tetherto/wdk-pricing-provider').HistoricalPriceOptions} HistoricalPriceOptions
 * @typedef {import('@tetherto/wdk-pricing-provider').HistoricalPriceResult} HistoricalPriceResult
 * @typedef {import('@tetherto/wdk-pricing-provider').PriceData} PriceData
 */
/**
 * @typedef {Object} BitfinexPricingClientOptions
 * @property {Object<string, string>} [currencyCodes] - Common-symbol-to-Bitfinex-currency-code
 *   overrides, merged over the built-in defaults (e.g. `{ USDT0: 'UST' }`). Keys and
 *   values are upper-cased.
 */
export class BitfinexPricingClient extends PricingClient {
    /**
     * @param {BitfinexPricingClientOptions} [opts={}]
     */
    constructor(opts?: BitfinexPricingClientOptions);
    /** @private */
    private HISTORICAL_DATA_AGE;
    /** @private */
    private MAX_HISTORICAL_ENTRIES;
    /** @private */
    private client;
    /** @private */
    private _currencyCodes;
    /**
     * Returns the Bitfinex currency code for a common ticker symbol.
     * @private
     * @param {string} symbol - Common ticker symbol (e.g. 'USDT')
     * @returns {string} Bitfinex currency code (e.g. 'UST'), or the upper-cased symbol when no translation exists
     */
    private _currencyCode;
    /** @private */
    private _fxBatch;
    /**
     * Builds a Bitfinex ticker symbol for a currency pair.
     * Bitfinex requires a colon separator when either symbol is longer than 3 characters
     * (e.g. tXAUT:USD instead of tXAUTUSD).
     * @private
     * @param {string} from - Base currency (e.g. 'BTC', 'XAUT')
     * @param {string} to - Quote currency (e.g. 'USD')
     * @returns {string} Bitfinex ticker symbol (e.g. 'tBTCUSD', 'tXAUT:USD', 'tUSTUSD' for USDT)
     */
    private _tickerFor;
    /**
     * @private
     * @param {HistoricalPriceResult[]} results
     * @returns {HistoricalPriceResult[]}
     */
    private _cappedToMaxResults;
}
export type BitfinexPricingClientOptions = {
    /**
     * - Common-symbol-to-Bitfinex-currency-code
     * overrides, merged over the built-in defaults (e.g. `{ USDT0: 'UST' }`). Keys and
     * values are upper-cased.
     */
    currencyCodes?: {
        [x: string]: string;
    };
};
export type PricePair = import("@tetherto/wdk-pricing-provider").PricePair;
export type HistoricalPriceOptions = import("@tetherto/wdk-pricing-provider").HistoricalPriceOptions;
export type HistoricalPriceResult = import("@tetherto/wdk-pricing-provider").HistoricalPriceResult;
export type PriceData = import("@tetherto/wdk-pricing-provider").PriceData;
import { PricingClient } from '@tetherto/wdk-pricing-provider';
