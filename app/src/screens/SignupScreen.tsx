import React, { useContext, useRef } from 'react'
import { StackScreenProps } from "@react-navigation/stack"
import { View, ScrollView, KeyboardAvoidingView, Platform, Text, Alert } from 'react-native'
import Button from "../components/Button"
import Input from "../components/Input"
import StackHeader from "../components/StackHeader"
import TextButton from "../components/TextButton"
import { useLoading } from "../context/LoadingContext"
import { AuthContext } from "../context/AuthContext"
import { AlertError } from "../util/util"
import * as AppleAuthentication from 'expo-apple-authentication';

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

  async function handleSignInWithApple() {
    auth.signInWithApple()
      .then(() => {
        props.navigation.goBack()
      }).catch(AlertError)
  }

  function handleSkip() {
    Alert.alert(
      "Attention",
      "Are you sure you want to log in anonymously?",
      [
        { text: "Cancel", style: "cancel" }
        , {
          text: "Sign in anonymously", style: "default", onPress: () => {
            loading(() => auth.signInAnonimously())
              .then(() => {
                props.navigation.goBack()
              }).catch(AlertError);
          }
        }
      ]
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StackHeader title="Signup" right={<TextButton onPress={handleSkip}>Skip</TextButton>} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding" })}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <Input placeholder="Name" style={{ marginTop: 80 }} onChangeText={handleNameChanged} />
            <Input placeholder="Email" style={{ marginTop: 20 }} onChangeText={handleEmailChanged} />
            <Input placeholder="Password" style={{ marginTop: 20 }} onChangeText={handlePasswordChanged} secureTextEntry />
            <Button onPress={handleCreatePressed} style={{ width: "100%", marginTop: 60 }}>Create account</Button>
            {Platform.OS === "ios" && AppleAuthentication && <AppleButton onPress={handleSignInWithApple} />}
            <TextButton onPress={() => props.navigation.navigate("Login")} style={{ marginTop: 60 }}>Sign in</TextButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const AppleButton = ({ onPress }: { onPress: () => void }) => {
  return <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={16}
    style={{ width: "100%", paddingVertical: 25, marginTop: 20 }}
    onPress={onPress}
  />
}