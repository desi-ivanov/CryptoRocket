import fetch from "cross-fetch";
import { EXCHANGE_INFO_ENDPOINT } from "../hooks/useExchangeInfo";

describe('echange info', () => {
  it('all fields set and has btcusdt', async (finish) => {
    const tick = await fetch(EXCHANGE_INFO_ENDPOINT);
    const json = await tick.json() as ExchangeInfo;
    expect(json).toBeDefined();
    expect(
      [
        "timezone",
        "serverTime",
        "symbols",
      ].every(key => key in json)
    ).toBe(true);

    expect(
      [
        "symbol",
        "baseAsset",
        "baseAssetPrecision",
        "quoteAsset",
        "quotePrecision",
        "quoteAssetPrecision",
      ].every(key => json.symbols.every(s => key in s))
    ).toBe(true);

    expect(
      json.symbols.some(s => s.symbol === "BTCUSDT" && s.baseAsset === "BTC" && s.quoteAsset === "USDT")
    ).toBe(true);

    finish();
  });
});