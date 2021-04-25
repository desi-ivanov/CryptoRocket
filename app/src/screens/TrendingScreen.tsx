import React, { useEffect, useState } from 'react'
import { View, Text, SafeAreaView, TextInput, FlatList, RefreshControl, TouchableOpacity, Image } from 'react-native'
import Colors from "../constants/Colors";
import useSWR from 'swr'
import SearchBar from "../components/SearchBar";
import Header from "../components/Header";
import { StackScreenProps } from "@react-navigation/stack";

function CryptoAssetImageUri(asset: string) {
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32@2x/color/${asset}@2x.png`;
}

export function useExchangeInfo() {
  const exchangeInfo = useSWR<ExchangeInfo>("https://api.binance.com/api/v3/exchangeInfo");
  return {
    ...exchangeInfo
    , map: Object.fromEntries((exchangeInfo.data?.symbols ?? []).map(x => [x.symbol, x]))
  }
}

export function use24HrTicker() {
  const tick = useSWR<PriceTicker[]>("https://api.binance.com/api/v3/ticker/24hr");
  return {
    ...tick
    , map: Object.fromEntries((tick.data ?? []).map(v => ([v.symbol, v])))
  }
}

export default function TrendingScreen(props: StackScreenProps<RootStackParams, "Tabs">) {
  const res = use24HrTicker();

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <Header title="Trending" />
      <Pairs
        navigationProps={props}
        data={res.data}
        isValidating={res.isValidating}
        revalidate={res.revalidate}
      />
    </View>
  );
}

export function Pairs(props: {
  navigationProps: StackScreenProps<RootStackParams, "Tabs">
  data?: PriceTicker[]
  isValidating: boolean
  revalidate: () => void
}) {
  const [q, setQ] = useState("");
  const exInfo = useExchangeInfo();

  function handleSymbolPressed(tick: PriceTicker) {
    props.navigationProps.navigation.navigate("Chart", { symbol: tick.symbol });
  }
  return <>
    <View style={{ paddingHorizontal: 20 }}>
      <SearchBar onChange={setQ} />
    </View>
    <FlatList
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
      refreshControl={<RefreshControl refreshing={props.isValidating} onRefresh={props.revalidate} />}
      data={props.data?.filter(x => q.length === 0 ? x.symbol.endsWith("USDT") : x.symbol.includes(q.toUpperCase()))?.slice(0, 10) ?? []}
      ItemSeparatorComponent={() => <View style={{ borderTopWidth: 1, borderColor: Colors.lightgray }} />}
      ListEmptyComponent={props.isValidating ? <></> : <Text>No pairs found 🤷‍♂️</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleSymbolPressed(item)} style={{ flexDirection: "row", paddingVertical: 10 }}>
          <CryptoAssetImage asset={exInfo.map[item.symbol]?.baseAsset?.toLowerCase()} />
          <View style={{ flex: 1, paddingVertical: 5, paddingLeft: 8 }}>
            <Text style={{ fontWeight: "600" }}>{item.symbol}</Text>
            <Text style={{ color: Colors.gray }}>{parseFloat(item.priceChangePercent) >= 0 ? "+" : ""}{item.priceChangePercent}%</Text>
          </View>
          <View style={{ paddingVertical: 5 }}>
            <Text style={{ fontWeight: "600" }}>{parseFloat(item.lastPrice).toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={it => it.symbol}
    />
  </>
}

export function CryptoAssetImage(props: {
  asset: string
}) {
  return <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: "#faeffa", alignItems: "center", justifyContent: "center" }}>
    <Image
      source={{ uri: CryptoAssetImageUri(props.asset.toLowerCase()) }}
      style={{ width: 32, height: 32 }}
    />
  </View>

}