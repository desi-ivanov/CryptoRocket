import React, { ReactNode } from 'react'
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/core"
import { StackScreenProps } from "@react-navigation/stack"
import { NavigationProp } from "@react-navigation/native"

export default function StackHeader(props: {
  title: string
  left?: ReactNode
  right?: ReactNode
}) {
  const nav = useNavigation<NavigationProp<StackScreenProps<RootStackParams>>>();

  return (
    <SafeAreaView>
      <View style={{ flexDirection: "row", paddingHorizontal: 20, alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          {props.left ?? (
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Feather name="chevron-left" style={{ fontSize: 35 }} />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: 5, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ textAlignVertical: "center", textAlign: "center", fontWeight: "600", fontSize: 27, marginBottom: 10 }}>{props.title}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          {props.right}
        </View>
      </View >
    </SafeAreaView >
  )
}
