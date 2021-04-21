import "react-native-gesture-handler";
import "./src/firebaseInit"
import React, { ReactChild } from "react";
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
import { StatusBar } from "react-native";
import TradeScreen from "./src/screens/TradeScreen";
import AlertScreen from "./src/screens/AlertScreen";

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