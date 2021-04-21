import { StackScreenProps } from "@react-navigation/stack"
import React from 'react'
import { Text, View } from 'react-native'
import Button from "../components/Button"
import Header from "../components/Header"
import Colors from "../constants/Colors"
import { useAuth } from "../context/AuthContext"

export default function ProfileScreen(props: StackScreenProps<RootStackParams, "Tabs">) {
  const auth = useAuth();
  function handleSignupPressed() {
    props.navigation.navigate("Signup");
  }

  function handleLogoutPressed() {
    auth.logout();
  }

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <Header title="Profile" />
      <View style={{ paddingHorizontal: 20, flex: 1, marginTop: 20 }}>
        {auth.user
          .mapLazy(x => (
            <View style={{ justifyContent: "space-between", flex: 1 }}>
              <View>
                {
                  [["Name", x.name], ["Email", x.email]].map(([label, value]) => (
                    <View key={label} style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
                      <View style={{ flex: 1 }}><Text style={{ fontWeight: "600", color: "#A9A9A9" }}>{label}</Text></View>
                      <View style={{ flex: 1, alignItems: "flex-end" }}><Text style={{ fontWeight: "600" }}>{value}</Text></View>
                    </View>
                  ))
                }
              </View>
              <View style={{ marginBottom: 50 }}>
                <Button onPress={handleLogoutPressed} style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: Colors.gray }} textStyle={{ color: Colors.gray }}>Logout</Button>
              </View>
            </View>
          )
            , () => <Button onPress={handleSignupPressed}>Signup</Button>)}
      </View>
    </View>
  )
}
