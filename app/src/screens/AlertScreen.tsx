import { StackScreenProps } from "@react-navigation/stack"
import React, { useState } from 'react'
import { View, Text, Alert, TouchableOpacity } from 'react-native'
import Button from "../components/Button"
import Input from "../components/Input"
import StackHeader from "../components/StackHeader"
import Colors from "../constants/Colors"
import { useAuth } from "../context/AuthContext"
import { useLoading } from "../context/LoadingContext"
import { AlertError } from "../util/util"
import { Feather } from "@expo/vector-icons"

export default function AlertScreen(props: StackScreenProps<RootStackParams, "Alert">) {
  const ctx = useAuth();
  const [percentage, setPercentage] = useState("1.00");
  const loading = useLoading();

  function handleSubmit() {
    if(isNaN(parseFloat(percentage.replace(",", ".")))) {
      Alert.alert("Invalid input");
    } else {
      loading(() => ctx.addAlert(props.route.params.symbol, parseFloat(percentage.replace(",", ".")) / 100))
        .then(() => {
          Alert.alert("Success", `You will receive a notification everytime the price drops or rises by ${percentage}%`);
          props.navigation.pop();
        })
        .catch(AlertError);
    }
  }

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <StackHeader title={props.route.params.symbol} />
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 5 }}>Percentage:</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Input
            placeholder={`Percentage eg. 1.00%`}
            onChangeText={setPercentage}
            textInputProps={{ keyboardType: "numeric", defaultValue: "1.00", value: percentage }}
            style={{ flex: 1 }}
          />
          <TouchableOpacity onPress={() => parseFloat(percentage) - 0.5 > 0 && setPercentage(p => (parseFloat(p) - 0.5).toFixed(2))} style={{ padding: 15, alignItems: "center", justifyContent: "center" }}><Feather size={20} color={Colors.gray} name="minus" /></TouchableOpacity>
          <TouchableOpacity onPress={() => setPercentage(p => (parseFloat(p) + 0.5).toFixed(2))} style={{ padding: 15, alignItems: "center", justifyContent: "center" }}><Feather size={20} color={Colors.gray} name="plus" /></TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", marginTop: 20 }}>
          {
            [0.005, 0.01, 0.015, 0.02]
              .map(x => (
                <TouchableOpacity style={{ flex: 1, paddingHorizontal: 5, flexDirection: "row" }} key={x} onPress={() => setPercentage((x * 100).toFixed(2))}>
                  <View
                    style={{
                      flex: 1
                      , borderWidth: 1
                      , borderRadius: 5
                      , borderColor: Colors.gray
                      , alignItems: "center"
                      , paddingVertical: 5
                    }}>
                    <Text style={{ fontWeight: "500", color: "#000" }}>{(x * 100).toFixed(1)}%</Text>
                  </View>
                </TouchableOpacity>
              ))
          }
        </View>
        <Button style={{ marginTop: 20 }} onPress={handleSubmit}>Create alert</Button>
      </View>
    </View>
  )
}
