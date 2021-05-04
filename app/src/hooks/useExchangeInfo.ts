import useSWR from "swr";

export function useExchangeInfo() {
  const exchangeInfo = useSWR<ExchangeInfo>("https://api.binance.com/api/v3/exchangeInfo");
  return {
    ...exchangeInfo
    , map: Object.fromEntries((exchangeInfo.data?.symbols ?? []).map(x => [x.symbol, x]))
  }
}