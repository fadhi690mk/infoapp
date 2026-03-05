import React from "react";
import { Text, StyleSheet, type TextProps } from "react-native";
import { cn } from "../../utils";
import { colors } from "../../utils/theme";

export interface LabelProps extends TextProps {
  children: React.ReactNode;
}

export function Label({ className, style, ...props }: LabelProps) {
  return (
    <Text style={[styles.label, style]} className={cn("text-sm font-medium leading-none text-foreground", className)} {...props} />
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    marginBottom: 4,
  },
});
