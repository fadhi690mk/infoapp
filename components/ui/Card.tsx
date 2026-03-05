import React from "react";
import { View, Text, StyleSheet, type ViewProps, type TextProps, type StyleProp, type TextStyle } from "react-native";
import { cn } from "../../utils";
import { colors } from "../../utils/theme";

export function Card({ className, style, ...props }: ViewProps) {
  return (
    <View
      style={[styles.card, style]}
      className={cn("rounded-lg border border-border bg-card shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, style, ...props }: ViewProps) {
  return <View style={[styles.cardHeader, style]} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, style, ...props }: Omit<TextProps, "style"> & { style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[styles.cardTitle, style]} className={cn("text-2xl font-semibold leading-tight tracking-tight text-card-foreground", className)} {...props} />
  );
}

export function CardDescription({ className, style, ...props }: Omit<TextProps, "style"> & { style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.cardDescription, style]} className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({
  className,
  style,
  noPadding,
  padding,
  ...props
}: ViewProps & { noPadding?: boolean; padding?: number }) {
  const paddingStyle =
    noPadding
      ? styles.cardContentNoPadding
      : padding !== undefined
        ? { padding }
        : styles.cardContent;

  return (
    <View
      style={[paddingStyle, style]}
      className={cn(
        noPadding ? "p-0" : padding !== undefined ? undefined : "p-6 pt-0",
        className
      )}
      {...props}
    />
  );
}

export function CardFooter({ className, style, ...props }: ViewProps) {
  return <View style={[styles.cardFooter, style]} className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardHeader: {
    flexDirection: "column",
    padding: 24,
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.cardForeground,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cardContentNoPadding: {
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
