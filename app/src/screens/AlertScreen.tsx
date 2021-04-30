import { StackScreenProps } from "@react-navigation/stack"
import React, { useRef } from 'react'
import { View, Text, Alert } from 'react-native'
import Button from "../components/Button"
import Input from "../components/Input"
import StackHeader from "../components/StackHeader"
import { useAuth } from "../context/AuthContext"
import { useLoading } from "../context/LoadingContext"
import { AlertError } from "../util/util"

export default function AlertScreen(props: StackScreenProps<RootStackParams, "Alert">) {
  const ctx = useAuth();
  const percentageRef = useRef("1.00");
  const loading = useLoading();

  function handleSubmit() {
    if(isNaN(parseFloat(percentageRef.current))) {
      Alert.alert("Invalid input");
    } else {
      loading(() => ctx.addAlert(props.route.params.symbol, parseFloat(percentageRef.current.replace(",", ".")) / 100))
        .then(() => {
          Alert.alert("Success");
          props.navigation.pop();
        })
        .catch(AlertError);
    }
  }

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <StackHeader title={props.route.params.symbol} />
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 5 }}>Percentage (eg. 1.00%):</Text>
        <Input
          placeholder={`Percentage eg. 1.00%`}
          onChangeText={(txt) => percentageRef.current = txt}
          textInputProps={{ keyboardType: "numbers-and-punctuation", defaultValue: "1.00" }}
        />
        <Button style={{ marginTop: 20 }} onPress={handleSubmit}>Create alert</Button>
      </View>
    </View>
  )
}
