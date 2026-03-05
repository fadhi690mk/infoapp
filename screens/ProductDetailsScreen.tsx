import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Linking } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent, PlaceholderImage } from "../components/ui";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ArrowLeft, Share2, ShoppingCart } from "lucide-react-native";
import { getEcomProduct, resolveImageUrl } from "../services/api";
import type { EcomProduct } from "../services/api";

export function ProductDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const id = route.params?.id;
  const [product, setProduct] = useState<EcomProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setLoading(false);
        return;
      }
      const numId = parseInt(id, 10);
      if (Number.isNaN(numId)) {
        setError("Invalid product");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      let cancelled = false;
      getEcomProduct(numId)
        .then((data) => { if (!cancelled) setProduct(data); })
        .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [id])
  );

  if (loading) {
    return (
      <AppLayout title="Product Details">
        <Text className="py-8 text-center text-muted-foreground">Loading…</Text>
      </AppLayout>
    );
  }
  if (error || !product) {
    return (
      <AppLayout title="Product Details">
        <Text className="py-4 text-destructive">{error || "Product not found"}</Text>
        <Button variant="outline" onPress={() => navigation.goBack()}>
          <Text className="text-foreground">Back</Text>
        </Button>
      </AppLayout>
    );
  }

  const basePrice = parseFloat(product.base_cost_price || "0");
  const sellPrice = parseFloat(product.final_selling_price || "0");
  const outOfStock = product.stock_quantity === 0;
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= product.minimum_stock_alert;
  const shareText = product.whatsapp_share_text || product.name;
  const shareImageUrl = resolveImageUrl(product.whatsapp_status_image || product.image);

  const openWhatsApp = () => {
    Linking.openURL(`https://api.whatsapp.com/send/?text=${encodeURIComponent(shareText)}`);
  };

  return (
    <AppLayout title="Product Details">
      <Button variant="ghost" size="sm" className="mb-3" onPress={() => navigation.goBack()}>
        <ArrowLeft size={16} color="#333" />
        <Text className="text-sm">Back</Text>
      </Button>

      <PlaceholderImage
        uri={product.image ? resolveImageUrl(product.image) : ""}
        style={{ width: "100%", height: 208, borderRadius: 8, marginBottom: 16 }}
        resizeMode="cover"
      />

      <View className="gap-3 mb-4">
        <View className="flex flex-row items-start justify-between gap-2">
          <Text className="text-lg font-bold flex-1">{product.name}</Text>
          {outOfStock && <Badge variant="destructive">Out of Stock</Badge>}
          {lowStock && <Badge variant="warning">Low Stock</Badge>}
          {!outOfStock && !lowStock && <Badge variant="success">In Stock</Badge>}
        </View>
        <Text className="text-sm text-muted-foreground">{product.description || ""}</Text>

        <Card>
          <CardContent className="p-4 flex flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted-foreground">Base Price</Text>
              <Text className="text-lg font-bold">₹{basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted-foreground">Selling Price</Text>
              <Text className="text-lg font-bold text-secondary">₹{sellPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
            </View>
          </CardContent>
        </Card>

        <View>
          <Text className="text-xs text-muted-foreground mb-1">Available Stock</Text>
          <Text className="text-sm font-semibold">{product.stock_quantity} units</Text>
        </View>
      </View>

      <Card className="mb-6">
        <CardContent className="p-4 gap-3">
          <Text className="text-sm font-semibold">Share on WhatsApp</Text>
          {shareImageUrl ? (
            <Image
              source={{ uri: shareImageUrl }}
              style={{ width: "100%", height: 160, borderRadius: 6 }}
              resizeMode="cover"
            />
          ) : null}
          {product.whatsapp_share_text ? (
            <View className="rounded-md border border-border bg-muted p-3">
              <Text className="text-sm">{product.whatsapp_share_text}</Text>
            </View>
          ) : null}
          <Button className="w-full" onPress={openWhatsApp}>
            <Share2 size={16} color="#fff" />
            <Text className="text-primary-foreground">Share on WhatsApp</Text>
          </Button>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={outOfStock}
        onPress={() => navigation.navigate("SubmitSale", { productId: id })}
      >
        <ShoppingCart size={20} color="#fff" />
        <Text className="text-primary-foreground">{outOfStock ? "Out of Stock" : "Submit Sale"}</Text>
      </Button>
    </AppLayout>
  );
}
