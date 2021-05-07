import "react-native-gesture-handler";
import "./src/firebaseInit"
import React, { ReactChild, useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
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

export default function App() {
  const [hasUpdates, setHasUpdates] = useState(false);
  const [checkedForUpdates, setCheckedForUpdates] = useState(false);

  useEffect(() => {
    Updates.checkForUpdateAsync()
      .then((res) => {
        if(res.isAvailable) {
          setHasUpdates(true);
          return Updates.fetchUpdateAsync().then(() => Updates.reloadAsync())
        } else {
          setHasUpdates(false);
          return Promise.resolve();
        }
      }).catch(() => setHasUpdates(false))
      .finally(() => setCheckedForUpdates(true))
  }, []);

  if(hasUpdates || !checkedForUpdates) {
    const { width, height } = Dimensions.get("screen");
    const Size = Math.min(width * 0.8, height * 0.8);
    return <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
      <LottieView speed={2} autoPlay style={{ width: Size, height: Size, }} source={Assets.lottieMining} />
      <Text>Downloading updates...</Text>
    </View>;
  }

  return (
    <LoadingContextProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
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
      </AuthProvider>
    </LoadingContextProvider>
  );
}