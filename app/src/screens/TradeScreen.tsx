import { StackScreenProps } from "@react-navigation/stack"
import React, { useEffect, useState } from 'react'
import { View, Text, Alert } from 'react-native'
import Button from "../components/Button"
import Input from "../components/Input"
import StackHeader from "../components/StackHeader"
import { useAuth } from "../context/AuthContext"
import Binance from "../context/Binance"
import { useLoading } from "../context/LoadingContext"
import { AlertError } from "../util/util"
import { useExchangeInfo } from "./TrendingScreen"

export default function TradeScreen(props: StackScreenProps<RootStackParams, "Trade">) {
  const ctx = useAuth();

  function handleSignupPressed() {
    props.navigation.navigate("Signup");
  }


  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <StackHeader title={props.route.params.symbol} />
      {ctx.user.mapLazy(
        (user) => <TradeBase
          user={user}
          symbol={props.route.params.symbol}
          type={props.route.params.type}
          navigationProps={props}
        />
        , () => <Button onPress={handleSignupPressed}>Signup</Button>
      )}
    </View>
  )
}

function TradeBase(props: {
  user: User
  symbol: string
  navigationProps: StackScreenProps<RootStackParams, "Trade">
  type: "buy" | "sell"
}) {
  const exInfo = useExchangeInfo();
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState(1);
  const loading = useLoading();
  const ctx = useAuth();

  useEffect(() => {
    return Binance.instance.subscribePrice(props.symbol, setPrice);
  }, [props.symbol])

  const actionAsset = exInfo.map[props.symbol]?.[props.type === "buy" ? "quoteAsset" : "baseAsset"];
  const takeAsset = exInfo.map[props.symbol]?.[props.type === "buy" ? "baseAsset" : "quoteAsset"];
  const qtynum = parseFloat(qty.replace(/,/g, ".")) || 0;
  const takeQty = (qtynum) * (props.type === "sell" ? price : (1 / price));
  const availability = props.user.wallet[actionAsset] ?? 0;

  function handleSubmit() {
    loading(() => ctx.trade(actionAsset, takeAsset, qtynum))
      .then(() => {
        Alert.alert("Success")
        props.navigationProps.navigation.pop()
      })
      .catch(AlertError);
  }

  return <View style={{ padding: 20 }}>
    <Input
      placeholder={`Amount in ${actionAsset}`}
      onChangeText={setQty}
      textInputProps={{ keyboardType: "decimal-pad" }}
    />
    <Text style={{ marginVertical: 20 }}>You will get: <Text style={{ fontWeight: "bold" }}>{(takeQty).toFixed(4)} {takeAsset}</Text></Text>
    <Text style={{ marginVertical: 20 }}>Available: <Text style={{ fontWeight: "600" }}>{availability.toFixed(4)} {actionAsset}</Text></Text>
    <Button onPress={handleSubmit}>{"Market " + props.type}</Button>
  </View>

}
