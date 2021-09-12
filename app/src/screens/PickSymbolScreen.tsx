import { StackScreenProps } from "@react-navigation/stack";
import React from 'react'
import { View } from 'react-native'
import StackHeader from "../components/StackHeader"
import { Pairs } from "./TrendingScreen"

export default function PickSymbolScreen(props: StackScreenProps<RootStackParams, "PickSymbolScreen">) {
  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <StackHeader title={"New alert"} />
      <View style={{height: 20}}></View>
      <Pairs onItemPressed={t => props.route.params.onFinish(t.symbol)} />
    </View>
  )
}
