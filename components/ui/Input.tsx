import React from "react";
import { TextInput, StyleSheet, type TextInputProps } from "react-native";
import { cn } from "../../utils";
import { colors } from "../../utils/theme";

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground",
          className
        )}
        placeholderTextColor={colors.mutedForeground}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const styles = StyleSheet.create({
  input: {
    height: 40,
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.foreground,
  },
});
