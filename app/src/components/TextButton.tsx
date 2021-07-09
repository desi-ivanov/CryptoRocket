import React from 'react'
import { TouchableOpacity, Text, StyleProp, ViewStyle } from 'react-native'
import Colors from "../constants/Colors"

export default function TextButton(props: {
  children: string
  style?: StyleProp<ViewStyle>
  onPress: () => void
}) {
  return (
    <TouchableOpacity onPress={props.onPress} style={[{ alignItems: "center", }, props.style]}>
      <Text style={{ fontSize: 18, textAlign: "center", fontWeight: "600", color: Colors.darkgray }}>{props.children}</Text>
    </TouchableOpacity>
  )
}
