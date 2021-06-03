import useSWR from "swr";
export const EXCHANGE_INFO_ENDPOINT = "https://api.binance.com/api/v3/exchangeInfo";

export function useExchangeInfo() {
  const exchangeInfo = useSWR<ExchangeInfo>(EXCHANGE_INFO_ENDPOINT);
  const map: { [k: string]: ExchangeInfo["symbols"][0] | undefined } = Object.fromEntries((exchangeInfo.data?.symbols ?? []).map(x => [x.symbol, x]));
  return {
    ...exchangeInfo
    , map
  }
}