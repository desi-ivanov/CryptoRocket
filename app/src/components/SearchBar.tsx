import React, { useRef } from 'react'
import { View, TextInput, Text, Animated, TouchableOpacity, LayoutAnimation } from 'react-native'
import Colors from "../constants/Colors";
import { Feather } from "@expo/vector-icons"
import { useState } from "react";

export default function SearchBar(props: { onChange: (txt: string) => void }) {
  const [q, setQ] = useState("");
  const [isFocusing, setIsFocusing] = useState(false);
  const tiref = useRef<TextInput | null>(null);

  function handleChange(x: string) {
    setQ(x);
    props.onChange(x);
  }


  function handleCancel() {
    tiref.current?.blur();
    hideCancel();
  }

  function hideCancel() {
    setIsFocusing(false);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  function showCancel() {
    setIsFocusing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  return (
    <View style={{ backgroundColor: Colors.lightgray, alignItems: "center", borderRadius: 17, flexDirection: "row", paddingHorizontal: 17 }}>
      <Feather name="search" style={{ fontSize: 16 }} />
      <TextInput value={q} onBlur={hideCancel} onFocus={showCancel} ref={tiref} onChangeText={handleChange} placeholderTextColor={Colors.placeholder} placeholder="Search" style={{ marginLeft: 6, fontSize: 16, flex: 1, paddingVertical: 10 }} />
      {q.length > 0 && <TouchableOpacity style={{ paddingHorizontal: 5, paddingVertical: 10 }} onPress={() => handleChange("")}><Feather style={{ fontSize: 16 }} name="x" /></TouchableOpacity>}
      {isFocusing && <TouchableOpacity onPress={handleCancel} style={{ paddingLeft: 5, paddingVertical: 10 }}>
        <Text>Cancel</Text>
      </TouchableOpacity>
      }
    </View>
  )
}
