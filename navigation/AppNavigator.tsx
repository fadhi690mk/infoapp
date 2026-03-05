import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer, CommonActions } from "@react-navigation/native";
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

const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
  const navRef = useRef<React.ComponentRef<typeof NavigationContainer>>(null);
  const prevAuthRef = useRef<boolean | null>(null);

  // Only reset when isAuthenticated *changes* (login or logout), not on first mount
  useEffect(() => {
    if (isLoading) return;
    const prev = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;
    if (prev === null) return; // first time: initialRouteName already correct, do nothing
    if (prev === isAuthenticated) return;
    const name = isAuthenticated ? "Main" : "Login";
    navRef.current?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name }] })
    );
  }, [isLoading, isAuthenticated]);

  // Do not mount NavigationContainer until auth check is done (avoids context issues)
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  const initialRoute = isAuthenticated ? "Main" : "Login";

  return (
    <NavigationContainer ref={navRef}>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export function AppNavigator() {
  return <AppNavigatorInner />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
  },
});
