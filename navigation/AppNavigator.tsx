import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import {
  LoginScreen,
  DashboardScreen,
  ProductsScreen,
  ProductDetailsScreen,
  MySalesScreen,
  EarningsScreen,
  BankScreen,
  ProfileScreen,
  SubmitSaleScreen,
  SubmitProofScreen,
} from "../screens";

export type RootStackParamList = {
  Loading: undefined;
  Login: undefined;
  Main: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Shown while auth is loading. */
function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#1e3a5f" />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="MySales" component={MySalesScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Bank" component={BankScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <MainStack.Screen name="SubmitSale" component={SubmitSaleScreen} />
      <MainStack.Screen name="SubmitProof" component={SubmitProofScreen} />
    </MainStack.Navigator>
  );
}

function AppNavigatorInner() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isLoading ? (
        <RootStack.Screen name="Loading" component={LoadingScreen} />
      ) : isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Login" component={LoginScreen} />
      )}
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <AppNavigatorInner />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
  },
});
