import { StackNavigationProp, StackScreenProps } from "@react-navigation/stack";
import React from 'react'
import { FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { View, Text, Image, Dimensions } from 'react-native'
import Button from "../components/Button";
import Header from "../components/Header"
import Assets from "../constants/Assets"
import Colors from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { use24HrTicker } from "../hooks/use24HrTicker";
import { CryptoAssetImage } from "./TrendingScreen";

const FullWidth = Dimensions.get("screen").width;

const CardWidth = Math.min(FullWidth, 500) - 20 * 2;
const CardHeight = CardWidth / 1.8

export default function WalletScreen(props: StackScreenProps<RootStackParams, "Tabs">) {
  const authCtx = useAuth();

  function handleSugnupPressed() {
    props.navigation.navigate("Signup");
  }

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <Header title="Wallet" />
      <View style={{ marginTop: 20, flex: 1 }}>
        {authCtx.user
          .mapLazy(usr => (
            <View style={{ flex: 1 }}>
              <Holdings user={usr} nvaigation={props.navigation} />
            </View>
          )
            , () => <Button style={{ marginHorizontal: 20 }} onPress={handleSugnupPressed}>Signup</Button>)}
      </View>
    </View >
  )
}


function Holdings(props: {
  user: User
  nvaigation: StackNavigationProp<RootStackParams, "Tabs">
}) {
  const ticker24hr = use24HrTicker();


  const fullBalance = Object.entries(props.user.wallet)
    .reduce((acc, [asset, quantity]) => acc +
      ((asset + "USDT") in ticker24hr.map
        ? (parseFloat(ticker24hr.map[asset + "USDT"].lastPrice) * quantity)
        : asset === "USDT" ? quantity
          : 0)
      , 0);

  function handleAssetPressed(asset: string) {
    if((asset + "USDT") in ticker24hr.map) {
      props.nvaigation.navigate("Chart", { symbol: asset + "USDT" });
    } else if(asset === "USDT") {
      props.nvaigation.navigate("Chart", { symbol: "BTCUSDT" });
    }
  }

  return <FlatList
    ListHeaderComponent={
      <View style={{
        overflow: "hidden"
        , borderRadius: 28
        , width: CardWidth
        , height: CardHeight
        , marginBottom: 20
        , alignSelf: "center"
      }}>
        <Image source={Assets.Card} style={{ position: "absolute", height: "100%", width: "100%" }} resizeMode="cover" />
        <View style={{ paddingLeft: 28, paddingTop: 28 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 32 }}>$ {fullBalance.toFixed(2)}</Text>
          <Text style={{ color: "#fff", marginTop: 5, fontSize: 15 }}>≈ {(fullBalance / (parseFloat(ticker24hr.map["BTCUSDT"]?.lastPrice ?? (fullBalance)))).toFixed(4)} ₿</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "flex-end", paddingLeft: 28, paddingBottom: 28 }}>
          <Text style={{ color: "#fff", marginTop: 20, fontSize: 10 }}>This balance is not real.</Text>
        </View>
      </View>
    }
    refreshControl={<RefreshControl refreshing={ticker24hr.isValidating} onRefresh={ticker24hr.revalidate} />}
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
    data={Object.entries(props.user.wallet).filter(x => x[1] > 0.0001)}
    ItemSeparatorComponent={() => <View style={{ borderTopWidth: 1, marginVertical: 10, borderColor: Colors.lightgray }} />}
    renderItem={({ item: [asset, quantity] }) => (
      <TouchableOpacity
        onPress={() => handleAssetPressed(asset)}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <CryptoAssetImage asset={asset} />
        <View style={{ flex: 1, paddingLeft: 10 }}><Text style={{ fontWeight: "600" }}>{asset}</Text></View>
        <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
          <Text style={{ fontWeight: "600" }}>{quantity.toFixed(4)}</Text>
          {(asset + "USDT") in ticker24hr.map
            && <Text style={{ color: Colors.lightgray2 }}>${(parseFloat(ticker24hr.map[asset + "USDT"].lastPrice) * quantity).toFixed(2)}</Text>
          }
        </View>
      </TouchableOpacity>

    )}
    keyExtractor={([asset]) => asset}
  />;
}