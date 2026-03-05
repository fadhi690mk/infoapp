import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  LayoutDashboard,
  Wallet,
  UserCircle,
  ShoppingBag,
  Package,
  Landmark,
} from "lucide-react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "../utils/theme";

const tabIcons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Dashboard: LayoutDashboard,
  Products: ShoppingBag,
  MySales: Package,
  Earnings: Wallet,
  Bank: Landmark,
  Profile: UserCircle,
};

const tabLabels: Record<string, string> = {
  Dashboard: "Home",
  Products: "Products",
  MySales: "My Sales",
  Earnings: "Earnings",
  Bank: "Bank",
  Profile: "Profile",
};

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = tabIcons[route.name] ?? LayoutDashboard;
          const label = tabLabels[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabFocused]}
            >
              <Icon size={20} color={isFocused ? colors.secondary : colors.mutedForeground} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    opacity: 0.85,
  },
  tabFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  tabLabelFocused: {
    color: colors.secondary,
    fontWeight: "600",
  },
});
