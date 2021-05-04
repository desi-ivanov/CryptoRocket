import useSWR from "swr";

export function use24HrTicker() {
  const tick = useSWR<PriceTicker[]>("https://api.binance.com/api/v3/ticker/24hr");
  return {
    ...tick
    , map: Object.fromEntries((tick.data ?? []).map(v => ([v.symbol, v])))
  }
}