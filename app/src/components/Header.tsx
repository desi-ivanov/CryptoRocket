import React, { ReactNode } from 'react'
import { View, Text, SafeAreaView } from 'react-native'

export default function Header(props: {
  children?: ReactNode
  title: string | ReactNode
}) {
  return (
    <SafeAreaView>
      <View style={{ paddingHorizontal: 20 }}>
        {typeof props.title === "string"
          ? <Text style={{ fontWeight: "600", fontSize: 32, marginBottom: 10 }}>{props.title}</Text>
          : props.title
        }
        {props.children}
      </View>
    </SafeAreaView>
  )
}
