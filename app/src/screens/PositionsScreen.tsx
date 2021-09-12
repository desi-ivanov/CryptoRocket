import { StackScreenProps } from "@react-navigation/stack"
import React from 'react'
import { FlatList, View, Text } from 'react-native'
import Header from "../components/Header"
import { useAuth } from "../context/AuthContext"

type Position = {
  symbol: string
  margin: number
  price: number
  leverage: number
  type: "long" | "short"
}

export default function PositionsScreen(props: StackScreenProps<RootStackParams, "Tabs">) {

  const positions: Position[] = [];

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <Header title="Positions" />
      <FlatList 
        data={positions}
        renderItem={() => <Text>Hi</Text>}
      />
    </View>
  )
}
