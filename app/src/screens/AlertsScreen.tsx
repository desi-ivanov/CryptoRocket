import React from 'react'
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import Header from "../components/Header"
import Colors from "../constants/Colors";
import { useAuth } from "../context/AuthContext"
import { useLoading } from "../context/LoadingContext";
import { AlertError } from "../util/util";
import { CryptoAssetImage, useExchangeInfo } from "./TrendingScreen";

export default function AlertsScreen() {
  const authCtx = useAuth();
  const exInfo = useExchangeInfo();
  const loading = useLoading();

  function handleAlertPressed(item: { id: string, data: PriceAlert }) {
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

  return (
    <View style={{ backgroundColor: "#fff", flex: 1 }}>
      <Header title="Alerts" />
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        data={authCtx.alerts}
        refreshControl={<RefreshControl refreshing={exInfo.isValidating} onRefresh={exInfo.revalidate} />}
        ItemSeparatorComponent={() => <View style={{ borderTopWidth: 1, marginVertical: 10, borderColor: Colors.lightgray }} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleAlertPressed(item)} style={{ flexDirection: "row", alignItems: "center" }}>
            <CryptoAssetImage asset={exInfo.map[item.data.symbol].baseAsset ?? ""} />
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
}