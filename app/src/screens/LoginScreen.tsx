import { StackScreenProps } from "@react-navigation/stack"
import React, { useRef } from 'react'
import { View, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native'
import Button from "../components/Button"
import Input from "../components/Input"
import StackHeader from "../components/StackHeader"
import TextButton from "../components/TextButton"
import { useAuth } from "../context/AuthContext"
import { useLoading } from "../context/LoadingContext"
import { AlertError } from "../util/util"

export default function LoginScreen(props: StackScreenProps<RootStackParams, "Login">) {
  const inputRef = useRef<{ email: string, password: string }>({
    email: ""
    , password: ""
  });
  const loading = useLoading();
  const auth = useAuth();

  function handleEmailChanged(txt: string) { inputRef.current.email = txt }
  function handlePasswordChanged(txt: string) { inputRef.current.password = txt }

  function handleLoginPressed() {
    loading(() => auth.login(inputRef.current.email, inputRef.current.password))
      .then(() => {
        props.navigation.popToTop();
      }).catch(AlertError)
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StackHeader title="Login" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <Input onChangeText={handleEmailChanged} textInputProps={{ keyboardType: "email-address" }} placeholder="Email" style={{ marginTop: 80 }} />
            <Input onChangeText={handlePasswordChanged} placeholder="Password" style={{ marginTop: 20 }} secureTextEntry />
            <Button onPress={handleLoginPressed} style={{ width: "100%", marginTop: 60 }}>Login</Button>
          </View>
          <TextButton onPress={() => props.navigation.navigate("PasswordReset")} style={{ marginTop: 60 }}>Forgot password?</TextButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
