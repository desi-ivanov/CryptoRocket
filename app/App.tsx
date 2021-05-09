import "react-native-gesture-handler";
import "./src/firebaseInit"
import React, { ReactChild, useEffect, useRef, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Colors from "./src/constants/Colors";
import TrendingScreen from "./src/screens/TrendingScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import WalletScreen from "./src/screens/WalletScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { createStackNavigator } from "@react-navigation/stack";
import ChartScreen from "./src/screens/ChartScreen";
import SignupScreen from "./src/screens/SignupScreen";
import LoginScreen from "./src/screens/LoginScreen";
import PasswordResetScreen from "./src/screens/PasswordResetScreen";
import { LoadingContextProvider } from "./src/context/LoadingContext";
import { AuthProvider } from "./src/context/AuthContext";
import { StatusBar, Text, View } from "react-native";
import TradeScreen from "./src/screens/TradeScreen";
import AlertScreen from "./src/screens/AlertScreen";
import * as Updates from "expo-updates";
import LottieView from 'lottie-react-native';
import Assets from "./src/constants/Assets";
import { Dimensions } from "react-native";
import * as Notifications from "expo-notifications";

const TabsNavigator = createBottomTabNavigator<{
  Trending: undefined
  Favorites: undefined
  Wallet: undefined
  Alerts: undefined
  Profile: undefined
}>();

const Stack = createStackNavigator<RootStackParams>();

const TabBarIcon: (name: keyof typeof Feather["glyphMap"]) => (ps: { focused: boolean }) => ReactChild
  = name => ps => <Feather style={[{ fontSize: 24 }]} color={ps.focused ? Colors.blue : Colors.gray} name={name} />

function Tabs() {
  return (
    <TabsNavigator.Navigator tabBarOptions={{ showLabel: false }}    >
      <TabsNavigator.Screen name="Trending" options={{ tabBarIcon: TabBarIcon("bar-chart-2") }} component={TrendingScreen} />
      <TabsNavigator.Screen name="Favorites" options={{ tabBarIcon: TabBarIcon("star") }} component={FavoritesScreen} />
      <TabsNavigator.Screen name="Wallet" options={{ tabBarIcon: TabBarIcon("credit-card") }} component={WalletScreen} />
      <TabsNavigator.Screen name="Alerts" options={{ tabBarIcon: TabBarIcon("clock") }} component={AlertsScreen} />
      <TabsNavigator.Screen name="Profile" options={{ tabBarIcon: TabBarIcon("user") }} component={ProfileScreen} />
    </TabsNavigator.Navigator>
  );
}

function Navigator() {
  const navigatorRef = useRef<NavigationContainerRef>(null);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  React.useEffect(() => {
    if(
      lastNotificationResponse
      && lastNotificationResponse.notification.request.content.data
      && lastNotificationResponse.notification.request.content.data.type === "chart"
      && lastNotificationResponse.notification.request.content.data.symbol
      && lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      navigatorRef.current?.navigate("Chart", { symbol: lastNotificationResponse.notification.request.content.data.symbol } as RootStackParams["Chart"]);
    }
  }, [lastNotificationResponse]);

  return <NavigationContainer ref={navigatorRef}>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Chart" component={ChartScreen} />
      <Stack.Screen name="Trade" component={TradeScreen} />
      <Stack.Screen name="Alert" component={AlertScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
    </Stack.Navigator>
  </NavigationContainer>
}

type UpdatesStatus = "loading" | "will_reload" | "no_updates";
function useUpdates(): { status: UpdatesStatus } {
  const [updatesStatus, setUpdatesStatus] = useState<UpdatesStatus>("loading");

  useEffect(() => {
    Updates.checkForUpdateAsync()
      .then((res) => {
        if(res.isAvailable) {
          setUpdatesStatus("will_reload");
          return Updates.fetchUpdateAsync().then(() => Updates.reloadAsync().catch(console.error))
        } else {
          setUpdatesStatus("no_updates");
          return Promise.resolve();
        }
      }).catch(() => setUpdatesStatus("no_updates"))
  }, []);

  return { status: updatesStatus };
}

const { width, height } = Dimensions.get("screen");
const Size = Math.min(width * 0.8, height * 0.8);
export default function App() {
  const updates = useUpdates();

  if(updates.status === "loading" || updates.status === "will_reload") {
    return <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
      <LottieView speed={2} autoPlay style={{ width: Size, height: Size, }} source={Assets.lottieMining} />
      <Text>{updates.status === "loading"
        ? "Checking for updates..."
        : "Downloading updates..."}
      </Text>
    </View>;
  }

  return (
    <LoadingContextProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" />
        <Navigator />
      </AuthProvider>
    </LoadingContextProvider>
  );
}