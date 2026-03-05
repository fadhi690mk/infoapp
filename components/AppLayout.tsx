import React, { type ReactNode } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "../utils";
import { colors } from "../utils/theme";

const logo = require("../assets/infozerv-logo.png");

interface AppLayoutProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function AppLayout({ title, children, className }: AppLayoutProps) {
  return (
    <View style={styles.root} className={cn("flex-1 bg-muted/30", className)}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.muted,
  },
  header: {
    backgroundColor: colors.primary,
  },
  headerInner: {
    maxWidth: 768,
    marginHorizontal: "auto",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logo: {
    height: 32,
    width: 64,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primaryForeground,
  },
  content: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
