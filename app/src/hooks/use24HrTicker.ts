import useSWR from "swr";
export const TICKER_24HR_ENDPOINT = "https://api.binance.com/api/v3/ticker/24hr";
export function use24HrTicker() {
  const tick = useSWR<PriceTicker[]>(TICKER_24HR_ENDPOINT);
  return {
    ...tick
    , map: Object.fromEntries((tick.data ?? []).map(v => ([v.symbol, v])))
  }
}