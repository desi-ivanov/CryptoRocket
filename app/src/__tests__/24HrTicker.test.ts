import { TICKER_24HR_ENDPOINT } from "../hooks/use24HrTicker";
import fetch from "cross-fetch";

describe('24 hr ticker', () => {
  it('has all properties and BTCUSDT is set', async (finish) => {
    const tick = await fetch(TICKER_24HR_ENDPOINT);
    const json = await tick.json() as PriceTicker[];
    expect(json).toBeDefined();
    const priceTickerKeys = [
      "symbol",
      "priceChange",
      "priceChangePercent",
      "weightedAvgPrice",
      "prevClosePrice",
      "lastPrice",
      "lastQty",
      "bidPrice",
      "bidQty",
      "askPrice",
      "askQty",
      "openPrice",
      "highPrice",
      "lowPrice",
      "volume",
      "quoteVolume",
      "openTime",
      "closeTime",
      "firstId",
      "lastId",
      "count",
    ]
    expect(json.every(x => priceTickerKeys.every(key => key in x))).toBe(true);
    expect(json.some(x => x.symbol === "BTCUSDT")).toBe(true);
    finish();
  });
});