export class BitfinexPricingClient extends PricingClient {
    /** @internal */
    HISTORICAL_DATA_AGE: number;
    /** @internal */
    MAX_HISTORICAL_ENTRIES: number;
    /** @internal */
    client: import("axios").AxiosInstance;
    /**
     * Posts a batch of FX conversion requests to Bitfinex and returns the
     * resulting rates in the same order as the input pairs. Bitfinex returns
     * `null` for any pair it cannot convert directly.
     * @internal
     * @param {Array<{ ccy1: string, ccy2: string, fiat_fx?: number, amount?: number }>} pairs
     * @returns {Promise<Array<number|null>>}
     */
    _fxBatch(pairs: Array<{
        ccy1: string;
        ccy2: string;
        fiat_fx?: number;
        amount?: number;
    }>): Promise<Array<number | null>>;
    /**
     * Builds a Bitfinex ticker symbol for a currency pair.
     * Bitfinex requires a colon separator when either symbol is longer than 3 characters
     * (e.g. tXAUT:USD instead of tXAUTUSD).
     * @internal
     * @param {string} from - Base currency (e.g. 'BTC', 'XAUT')
     * @param {string} to - Quote currency (e.g. 'USD')
     * @returns {string} Bitfinex ticker symbol (e.g. 'tBTCUSD', 'tXAUT:USD')
     */
    _tickerFor(from: string, to: string): string;
    /**
     * @internal
     * @param {import('@tetherto/wdk-pricing-provider').HistoricalPriceResult[]} results
     * @returns {import('@tetherto/wdk-pricing-provider').HistoricalPriceResult[]}
     */
    _cappedToMaxResults(results: import("@tetherto/wdk-pricing-provider").HistoricalPriceResult[]): import("@tetherto/wdk-pricing-provider").HistoricalPriceResult[];
}
import { PricingClient } from '@tetherto/wdk-pricing-provider';
