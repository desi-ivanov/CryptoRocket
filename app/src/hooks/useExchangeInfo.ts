import useSWR from "swr";

export function useExchangeInfo() {
  const exchangeInfo = useSWR<ExchangeInfo>("https://api.binance.com/api/v3/exchangeInfo");
  const map: { [k: string]: ExchangeInfo["symbols"][0] | undefined } = Object.fromEntries((exchangeInfo.data?.symbols ?? []).map(x => [x.symbol, x]));
  return {
    ...exchangeInfo
    , map
  }
}