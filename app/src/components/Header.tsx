import React, { ReactNode } from 'react'
import { View, Text, SafeAreaView } from 'react-native'

export default function Header(props: {
  children?: ReactNode
  title: string | ReactNode
  right?: ReactNode
}) {
  return (
    <SafeAreaView>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {typeof props.title === "string"
            ? <Text style={{ fontWeight: "600", fontSize: 32, marginBottom: 10 }}>{props.title}</Text>
            : props.title
          }
          {props.right}
        </View>
        {props.children}
      </View>
    </SafeAreaView>
  )
}
