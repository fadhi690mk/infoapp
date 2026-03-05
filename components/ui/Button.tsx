import React from "react";
import { Pressable, Text, StyleSheet, type PressableProps } from "react-native";
import { cn } from "../../utils";
import { colors } from "../../utils/theme";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary rounded-md active:opacity-90",
  destructive: "bg-destructive rounded-md active:opacity-90",
  outline: "border border-input bg-background rounded-md active:bg-muted",
  secondary: "bg-secondary rounded-md active:opacity-90",
  ghost: "active:bg-muted rounded-md",
  link: "rounded-md",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 rounded-md",
  lg: "h-11 px-8 rounded-md",
  icon: "h-10 w-10",
};

const textVariantStyles: Record<ButtonVariant, string> = {
  default: "text-primary-foreground text-sm font-medium",
  destructive: "text-destructive-foreground text-sm font-medium",
  outline: "text-foreground text-sm font-medium",
  secondary: "text-secondary-foreground text-sm font-medium",
  ghost: "text-foreground text-sm font-medium",
  link: "text-primary text-sm font-medium underline",
};

const variantStyleMap: Record<ButtonVariant, object> = {
  default: { backgroundColor: colors.primary },
  destructive: { backgroundColor: colors.destructive },
  outline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.input },
  secondary: { backgroundColor: colors.secondary },
  ghost: {},
  link: {},
};

const textColorMap: Record<ButtonVariant, string> = {
  default: colors.primaryForeground,
  destructive: colors.destructiveForeground,
  outline: colors.foreground,
  secondary: colors.secondaryForeground,
  ghost: colors.foreground,
  link: colors.primary,
};

export interface ButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "default",
  size = "default",
  className,
  textClassName,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const sizeStyle = size === "sm" ? { height: 36, paddingHorizontal: 12 } : size === "lg" ? { height: 44, paddingHorizontal: 32 } : size === "icon" ? { height: 40, width: 40 } : { height: 40, paddingHorizontal: 16, paddingVertical: 8 };
  return (
    <Pressable
      style={[
        styles.base,
        variantStyleMap[variant],
        sizeStyle,
        disabled && styles.disabled,
        style as any,
      ]}
      className={cn(
        "flex-row items-center justify-center gap-2",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {typeof children === "string" ? (
        <Text style={[styles.text, { color: textColorMap[variant] }]} className={cn(textVariantStyles[variant], textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
  disabled: {
    opacity: 0.5,
  },
});
