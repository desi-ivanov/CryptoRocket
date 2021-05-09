import { StackScreenProps } from "@react-navigation/stack"
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather, AntDesign } from "@expo/vector-icons"
import Binance from "../context/Binance"
import WebView from "react-native-webview"
import useSWR from "swr"
import Button from "../components/Button"
import StackHeader from "../components/StackHeader"
import { useProtected } from "../hooks/useProtected"
import { useAuth } from "../context/AuthContext"
import { AlertError } from "../util/util"
import { useLoading } from "../context/LoadingContext"
import { useExchangeInfo } from "../hooks/useExchangeInfo"
import { CryptoAssetImage } from "./TrendingScreen"
import Colors from "../constants/Colors"
import { maybe } from "../util/Maybe"


export default function ChartScreen(props: StackScreenProps<RootStackParams, "Chart">) {
  const protect = useProtected();
  const ctx = useAuth();
  const loading = useLoading();
  function handleStar() {
    protect(() => {
      loading(() => ctx.addOrRemoveFavourite(props.route.params.symbol).catch(AlertError));
    });
  }
  function handleAlertPressed() {
    protect(() => {
      props.navigation.navigate("Alert", { symbol: props.route.params.symbol })
    });
  }
  function handleBuyPressed() {
    protect(() => {
      props.navigation.navigate("Trade", { symbol: props.route.params.symbol, type: "buy" })
    });
  }
  function handleSellPressed() {
    protect(() => {
      props.navigation.navigate("Trade", { symbol: props.route.params.symbol, type: "sell" })
    });
  }


  const isFavourite = useMemo(() => ctx.user.get()?.favoritePairs?.includes(props.route.params.symbol), [ctx.user.get()?.favoritePairs]);


  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <StackHeader
        title={props.route.params.symbol}
        right={(
          <TouchableOpacity onPress={handleStar}>
            <AntDesign
              name={isFavourite ? "star" : "staro"}
              style={{ fontSize: 35, color: isFavourite ? "#F0B90B" : "black" }}
            />
          </TouchableOpacity>
        )}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "500" }}>Price</Text>
        <Price symbol={props.route.params.symbol} />
        <Chart symbol={props.route.params.symbol} />
        <Holdings symbol={props.route.params.symbol} />
      </ScrollView>
      <SafeAreaView>
        <View style={{ paddingHorizontal: 20, flexDirection: "row", paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.lightgray }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <TouchableOpacity onPress={handleAlertPressed}><Feather name="bell" style={{ fontSize: 30 }} /></TouchableOpacity>
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Button textStyle={{ fontSize: 13 }} onPress={handleBuyPressed} style={{ paddingHorizontal: 30 }}>BUY</Button>
          </View>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Button textStyle={{ fontSize: 13 }} onPress={handleSellPressed} style={{ paddingHorizontal: 30 }}>SELL</Button>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}

function Holdings(props: {
  symbol: string
}) {
  const ctx = useAuth();
  const exInfo = useExchangeInfo();
  const tradeInfo = exInfo.map[props.symbol];

  if(!tradeInfo) {
    return null;
  }
  return ctx.user
    .map((u) => (
      <View>
        <Text style={{ fontSize: 20, fontWeight: "500" }}>Available</Text>
        {([
          [tradeInfo.baseAsset, tradeInfo.baseAssetPrecision]
          , [tradeInfo.quoteAsset, tradeInfo.quoteAssetPrecision]
        ] as [string, number][]
        ).map(([asset, precision]) => (
          <View key={asset} style={{ flexDirection: "row", marginTop: 10, alignItems: "center" }}>
            <View><CryptoAssetImage asset={asset} /></View>
            <Text style={{ marginLeft: 10 }}>{asset}: {(u.wallet[asset] ?? 0).toFixed(precision)}</Text>
          </View>
        ))}
      </View>
    ))
    .orElse(null);
}

function Price(props: {
  symbol: string
}) {
  const [{ price, prevPrice }, setPrice] = useState({ price: 0, prevPrice: 0 });

  useEffect(() => {
    return Binance.instance.subscribePrice(props.symbol, newPrice => {
      setPrice(cur => ({ prevPrice: cur.price, price: newPrice }))
    });
  }, [props.symbol]);

  return (
    <Text style={{ fontSize: 25, color: prevPrice === price ? "gray" : prevPrice > price ? "red" : "green" }}>{price} {prevPrice > price ? "↓" : "↑"}</Text>
  )
}

type Granularity = "1m" | "15m" | "1h" | "4h" | "1d"
const Granularities: Granularity[] = ["1m", "15m", "1h", "4h", "1d"];

function Chart(props: {
  symbol: string
}) {
  const [granularity, setGranularity] = useState<Granularity>("1m");

  return <View>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {Granularities.map(gran => <TouchableOpacity
        key={gran}
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 }}
        onPress={() => setGranularity(gran)}
      >
        <Text style={[gran === granularity && { fontWeight: "600" }]}>{gran}</Text>
      </TouchableOpacity>
      )}
    </View>
    <ChartBase granularity={granularity} symbol={props.symbol} />
  </View>
}

function ChartBase(props: {
  symbol: string
  granularity: Granularity
}) {
  const webViewRef = useRef<WebView | null>(null);
  // [time, open, high, low, close, volume]
  const res = useSWR<[number, number, number, number, number, number][]>(`https://api.binance.com/api/v3/klines?symbol=${props.symbol}&interval=${props.granularity}`);

  useEffect(() => {
    return Binance.instance.subscribePrice(props.symbol, newPrice => {
      webViewRef.current?.injectJavaScript(`(function(){if(gotPrice) gotPrice(${newPrice})})()`);
    })
  }, [props.symbol]);
  const CHART_HEIGHT = 300;

  if(!res.data) {
    return <View style={{ height: CHART_HEIGHT, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  }
  return <WebView
    ref={webViewRef}
    style={{ width: "100%", height: CHART_HEIGHT, }}
    source={{
      html: `
    <html>
    <head>
      <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' />
      <script type="text/javascript" src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
    </head>
    <body style="width: 100vw; height: 100vh; margin: 0px; position: relative; font-family: arial">
      <div id="chart_div"></div>
    </body>
    <script type="text/javascript">
      var chart = LightweightCharts.createChart(document.getElementById("chart_div"), {
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
        },
        grid: {
          vertLines: {
            visible: false,
          },
          horzLines: {
            visible: false,
          },
        },
        timeScale: {
          timeVisible: true,
          fitContent: true
        },
      });
      var candleSeries = chart.addCandlestickSeries({
        upColor: '#68BA42',
        downColor: 'red',
        borderDownColor: 'red',
        borderUpColor: '#68BA42',
        wickDownColor: 'red',
        wickUpColor: '#68BA42',
        priceFormat: {
          precision: ${res.data.slice(-1)[0][4] > 100 ? 2 : 4},
          minMove: ${res.data.slice(-1)[0][4] > 100 ? 0.01 : 0.0001}
        },
      });
      var data = JSON.parse(\`${JSON.stringify(res.data.map(([time, open, high, low, close]) => ({ time: time / 1000, open, high, low, close })))}\`);
      candleSeries.setData(data);

      function gotPrice(price) {
        if(candleSeries) {
          data[data.length-1] = {
            time: data[data.length-1].time, 
            high: data[data.length-1].high >= price ? data[data.length-1].high : price,
            low: data[data.length-1].low <= price ? data[data.length-1].low : price, 
            open: data[data.length-1].open,
            close: price, 
          }
          candleSeries.update(data[data.length-1]);
        }
      }

    </script>
  </html>`
    }}
  />

}