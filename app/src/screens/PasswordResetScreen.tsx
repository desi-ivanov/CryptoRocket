import { StackScreenProps } from "@react-navigation/stack"
import React, { useRef } from 'react'
import { View, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native'
import Button from "../components/Button"
import Input from "../components/Input"
import StackHeader from "../components/StackHeader"
import { useLoading } from "../context/LoadingContext"
import firebase from "firebase"
import { AlertError } from "../util/util"

export default function PasswordResetScreen(props: StackScreenProps<RootStackParams, "PasswordReset">) {
  const emailRef = useRef("");
  const loading = useLoading();

  function handleSubmit() {
    loading(() => firebase.auth().sendPasswordResetEmail(emailRef.current))
      .then(() => {
        props.navigation.pop();
        Alert.alert("Success", "We've sent you an email with instructions on how to recover your account");
      })
      .catch(AlertError);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StackHeader title="Recover" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <Input placeholder="Email" style={{ marginTop: 80 }} onChangeText={txt => emailRef.current = txt} />
            <Button onPress={handleSubmit} style={{ width: "100%", marginTop: 60 }}>Reset password</Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
