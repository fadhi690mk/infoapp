import React, { useState } from "react";
import { View, Image, StyleSheet, type ImageStyle } from "react-native";
import { ImageIcon } from "lucide-react-native";
import { colors } from "../../utils/theme";

interface PlaceholderImageProps {
  uri: string | null | undefined;
  style?: ImageStyle;
  placeholderStyle?: ImageStyle;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}

/**
 * Renders an image from uri; shows a placeholder when uri is empty or when the image fails to load.
 */
export function PlaceholderImage({
  uri,
  style,
  placeholderStyle,
  resizeMode = "cover",
}: PlaceholderImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedUri = uri && uri.trim() ? uri.trim() : "";
  const showPlaceholder = !resolvedUri || failed;

  if (showPlaceholder) {
    return (
      <View style={[styles.placeholder, style, placeholderStyle]}>
        <ImageIcon size={32} color={colors.mutedForeground} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
});
