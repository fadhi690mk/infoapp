import React from "react";
import { View, Text, type ViewProps, type TextStyle } from "react-native";
import { cn } from "../../utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary",
  secondary: "border-transparent bg-secondary",
  destructive: "border-transparent bg-destructive",
  outline: "border-border bg-transparent",
  success: "border-transparent bg-success",
  warning: "border-transparent bg-warning",
};

const textVariantStyles: Record<BadgeVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
};

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  /** Optional: use with variant="outline" for colored text (e.g. text-success, text-warning) */
  textClassName?: string;
  /** Optional: style for the text (overrides text color when using outline + StyleSheet) */
  textStyle?: TextStyle;
}

export function Badge({ variant = "default", className, textClassName, textStyle, children, style, ...props }: BadgeProps) {
  return (
    <View
      style={style}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Text style={textStyle} className={cn("text-xs font-semibold", textVariantStyles[variant], textClassName)}>{children}</Text>
    </View>
  );
}
