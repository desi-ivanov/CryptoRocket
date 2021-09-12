import Feather from "@expo/vector-icons/build/Feather";
import { StackScreenProps } from "@react-navigation/stack";
import React from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import Button from "../components/Button";
import Header from "../components/Header"
import Colors from "../constants/Colors";
import { useAuth } from "../context/AuthContext"
import { useLoading } from "../context/LoadingContext";
import { useExchangeInfo } from "../hooks/useExchangeInfo";
import { AlertError } from "../util/util";
import { CryptoAssetImage } from "./TrendingScreen";

export default function AlertsScreen(props: StackScreenProps<RootStackParams, "Tabs">) {
  const authCtx = useAuth();
  const exInfo = useExchangeInfo();
  const loading = useLoading();

  function handleSugnupPressed() {
    props.navigation.navigate("Signup");
  }

  function handleAlertPressed(item: { id: string, data: PriceAlert }) {
    props.navigation.navigate("Chart", { symbol: item.data.symbol });
  }

  function handleAlertLongPressed(item: { id: string, data: PriceAlert }) {
    Alert.alert(
      "Confirm"
      , "Are you sure you want to remove this " + (item.data.symbol) + " alert"
      , [
        { text: "Cancel", style: "cancel" }
        , {
          text: "Yes"
          , style: "destructive"
          , onPress: () => {
            loading(() => authCtx.removeAlert(item.id))
              .catch(AlertError);
          }
        }
      ]);
  }

  const handlePlusPressed = React.useCallback(() => {
    props.navigation.navigate("PickSymbolScreen", {
      onFinish: (symbol) => props.navigation.navigate("Alert", { symbol })
    });
  }, [props.navigation])

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <Header
        title="Alerts"
        right={authCtx.auth.isPresent() && <TouchableOpacity onPress={handlePlusPressed} style={{ alignItems: "center", justifyContent: "center", padding: 5 }}><Feather name="plus" style={{ fontSize: 25 }} /></TouchableOpacity>}
      />
      <View style={{ marginTop: 20, flex: 1 }}>
        {authCtx.user
          .mapLazy(_ => (
            <View style={{ flex: 1 }}>
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
                data={authCtx.alerts}
                refreshControl={<RefreshControl refreshing={exInfo.isValidating} onRefresh={exInfo.revalidate} />}
                ItemSeparatorComponent={() => <View style={{ borderTopWidth: 1, marginVertical: 10, borderColor: Colors.lightgray }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleAlertPressed(item)}
                    onLongPress={() => handleAlertLongPressed(item)}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <CryptoAssetImage asset={exInfo.map[item.data.symbol]?.baseAsset} />
                    <View style={{ flex: 1, paddingLeft: 10 }}><Text style={{ fontWeight: "600" }}>{item.data.symbol}</Text></View>
                    <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
                      <Text style={{ fontWeight: "600" }}>{(item.data.percentage * 100).toFixed(2)}%</Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={({ id }) => id}
              />
            </View>
          )
            , () => <Button style={{ marginHorizontal: 20 }} onPress={handleSugnupPressed}>Signup</Button>)}
      </View>

    </View>
  )
}