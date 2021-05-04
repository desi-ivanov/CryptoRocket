import React, { useContext, useRef } from 'react'
import { StackScreenProps } from "@react-navigation/stack"
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import Button from "../components/Button"
import Input from "../components/Input"
import StackHeader from "../components/StackHeader"
import TextButton from "../components/TextButton"
import { useLoading } from "../context/LoadingContext"
import { AuthContext } from "../context/AuthContext"
import { AlertError } from "../util/util"

export default function SignupScreen(props: StackScreenProps<RootStackParams, "Login">) {
  const inputRef = useRef<{ name: string, email: string, password: string }>({
    name: ""
    , email: ""
    , password: ""
  });
  const loading = useLoading();
  const auth = useContext(AuthContext);

  function handleNameChanged(txt: string) { inputRef.current.name = txt }
  function handleEmailChanged(txt: string) { inputRef.current.email = txt }
  function handlePasswordChanged(txt: string) { inputRef.current.password = txt }

  function handleCreatePressed() {
    loading(() => auth.signup(inputRef.current.name, inputRef.current.email, inputRef.current.password))
      .then(() => {
        props.navigation.goBack()
      }).catch(AlertError)
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StackHeader title="Signup" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <Input placeholder="Name" style={{ marginTop: 80 }} onChangeText={handleNameChanged} />
            <Input placeholder="Email" style={{ marginTop: 20 }} onChangeText={handleEmailChanged} />
            <Input placeholder="Password" style={{ marginTop: 20 }} onChangeText={handlePasswordChanged} secureTextEntry />
            <Button onPress={handleCreatePressed} style={{ width: "100%", marginTop: 60 }}>Create account</Button>
          </View>
          <TextButton onPress={() => props.navigation.navigate("Login")} style={{ marginTop: 60 }}>Sign in</TextButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
