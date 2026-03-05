import React, { useCallback, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent } from "../components/ui";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ShoppingCart, CheckCircle, Clock, XCircle, Search, X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { getPromoterMe, getEcomOrders } from "../services/api";
import type { PromoterMe, EcomOrder } from "../services/api";
import { colors } from "../utils/theme";

const PAGE_SIZE = 25;

function formatRupee(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// Promoter-style outline badges: StyleSheet (opacity works in RN; Tailwind /10 /20 doesn't)
const badgePayment = StyleSheet.create({
  "Under Review": { backgroundColor: "rgba(234, 179, 8, 0.12)", borderColor: "rgba(234, 179, 8, 0.25)", borderWidth: 1 },
  Verified: { backgroundColor: "rgba(22, 163, 74, 0.12)", borderColor: "rgba(22, 163, 74, 0.25)", borderWidth: 1 },
  Rejected: { backgroundColor: "rgba(220, 38, 38, 0.12)", borderColor: "rgba(220, 38, 38, 0.25)", borderWidth: 1 },
});
const badgePaymentText: Record<string, { color: string }> = {
  "Under Review": { color: colors.warning },
  Verified: { color: colors.success },
  Rejected: { color: colors.destructive },
};
const badgeDelivery = StyleSheet.create({
  Pending: { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
  Processing: { backgroundColor: "rgba(234, 179, 8, 0.12)", borderColor: "rgba(234, 179, 8, 0.25)", borderWidth: 1 },
  Shipped: { backgroundColor: "rgba(30, 58, 95, 0.12)", borderColor: "rgba(30, 58, 95, 0.25)", borderWidth: 1 },
  Delivered: { backgroundColor: "rgba(22, 163, 74, 0.12)", borderColor: "rgba(22, 163, 74, 0.25)", borderWidth: 1 },
  Cancelled: { backgroundColor: "rgba(220, 38, 38, 0.12)", borderColor: "rgba(220, 38, 38, 0.25)", borderWidth: 1 },
});
const badgeDeliveryText: Record<string, { color: string }> = {
  Pending: { color: colors.mutedForeground },
  Processing: { color: colors.warning },
  Shipped: { color: colors.primary },
  Delivered: { color: colors.success },
  Cancelled: { color: colors.destructive },
};

export function MySalesScreen() {
  const [me, setMe] = useState<PromoterMe | null>(null);
  const [orders, setOrders] = useState<EcomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const promoter = await getPromoterMe();
          if (cancelled) return;
          setMe(promoter);
          const res = await getEcomOrders({ promoter: promoter.id, page_size: 25 });
          if (!cancelled) setOrders(res.results ?? []);
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const getDeliveryLabel = (o: EcomOrder) =>
    o.delivery_status === "delivered" ? "Delivered" : o.delivery_status === "shipped" ? "Shipped" : o.delivery_status === "cancelled" ? "Cancelled" : "Pending";

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const paymentLabel = o.payment_verified ? "Verified" : "Under Review";
      const deliveryLabel = getDeliveryLabel(o);
      return (
        String(o.product_name ?? "").toLowerCase().includes(q) ||
        String(o.customer_name ?? "").toLowerCase().includes(q) ||
        String(o.id ?? "").toLowerCase().includes(q) ||
        paymentLabel.toLowerCase().includes(q) ||
        deliveryLabel.toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );
  const hasFiltersApplied = search !== "";
  const clearFilters = () => {
    setSearch("");
    setPage(1);
  };

  const verified = orders.filter((o) => o.payment_verified).length;
  const underReview = orders.filter((o) => !o.payment_verified).length;
  const rejected = orders.filter((o) => o.delivery_status === "rejected").length;
  const totalSelling = orders.reduce((sum, o) => sum + parseFloat(o.product_selling_price || "0"), 0);
  const totalProfit = orders.reduce(
    (sum, o) =>
      sum +
      parseFloat(o.product_selling_price || "0") -
      parseFloat(o.product_base_price || "0"),
    0
  );

  const stats = [
    { label: "Total Sales", value: String(orders.length), icon: ShoppingCart, color: "bg-primary" },
    { label: "Verified", value: String(verified), icon: CheckCircle, color: "bg-success" },
    { label: "Under Review", value: String(underReview), icon: Clock, color: "bg-warning" },
    { label: "Rejected", value: String(rejected), icon: XCircle, color: "bg-destructive" },
    { label: "Total Selling", value: formatRupee(totalSelling), icon: ShoppingCart, color: "bg-primary" },
    { label: "Total Profit", value: formatRupee(totalProfit), icon: CheckCircle, color: "bg-success" },
  ];

  return (
    <AppLayout title="My Sales">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {loading ? (
          <Text className="py-4 text-center text-muted-foreground">Loading…</Text>
        ) : null}
        {error ? (
          <Text className="py-4 text-destructive">{error}</Text>
        ) : null}
        {!loading && !error ? (
          <>
            <View className="flex flex-row flex-wrap gap-3 mb-5 justify-center">
              {stats.map((s) => (
                <Card key={s.label} style={{ width: "47%", minWidth: 140 }}>
                  <CardContent padding={16} className="flex flex-row items-center gap-3">
                    <View className={`h-10 w-10 rounded-lg items-center justify-center ${s.color}`}>
                      <s.icon size={20} color="#fff" />
                    </View>
                    <View>
                      <Text className="text-xs text-muted-foreground">{s.label}</Text>
                      <Text className="text-lg font-bold">{s.value}</Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
                <Input
                  placeholder="Search sales…"
                  value={search}
                  onChangeText={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  style={styles.searchInput}
                />
              </View>
              {hasFiltersApplied && (
                <Pressable onPress={clearFilters} style={styles.clearBtn}>
                  <X size={16} color={colors.mutedForeground} />
                  <Text style={styles.clearText}>Clear filters</Text>
                </Pressable>
              )}
            </View>
            <View className="gap-3">
              {paginated.map((o) => {
                const base = parseFloat(o.product_base_price || "0");
                const sell = parseFloat(o.product_selling_price || "0");
                const profit = sell - base;
                const date = o.order_date || o.created_at?.slice(0, 10) || "";
                const paymentStatus = o.payment_verified ? "Verified" : "Under Review";
                const deliveryLabel =
                  o.delivery_status === "delivered"
                    ? "Delivered"
                    : o.delivery_status === "shipped"
                      ? "Shipped"
                      : o.delivery_status === "cancelled"
                        ? "Cancelled"
                        : "Pending";
                return (
                  <Card key={o.id}>
                    <CardContent padding={16} className="gap-2">
                      <View className="flex flex-row items-start justify-between gap-2">
                        <View>
                          <Text className="text-sm font-semibold">{o.product_name}</Text>
                          <Text className="text-xs text-muted-foreground">{o.id} · {o.customer_name}</Text>
                        </View>
                        <Text className="text-xs text-muted-foreground shrink-0">{date}</Text>
                      </View>
                      <View className="flex flex-row items-center gap-3">
                        <View>
                          <Text className="text-xs text-muted-foreground">Base</Text>
                          <Text className="text-sm font-semibold">₹{base.toFixed(0)}</Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground">Sell</Text>
                          <Text className="text-sm font-semibold text-secondary">₹{sell.toFixed(0)}</Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground">Profit</Text>
                          <Text className="text-sm font-semibold text-success">₹{profit.toFixed(0)}</Text>
                        </View>
                      </View>
                      <View className="flex flex-row flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          style={badgePayment[paymentStatus as keyof typeof badgePayment] ?? { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }}
                          textStyle={badgePaymentText[paymentStatus] ?? { color: colors.mutedForeground }}
                        >
                          {paymentStatus}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={badgeDelivery[deliveryLabel as keyof typeof badgeDelivery] ?? { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }}
                          textStyle={badgeDeliveryText[deliveryLabel] ?? { color: colors.mutedForeground }}
                        >
                          {deliveryLabel}
                        </Badge>
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
            </View>
            {paginated.length === 0 ? (
              <Text className="py-8 text-center text-sm text-muted-foreground">
                {filtered.length === 0 && orders.length > 0 ? "No sales found." : "No sales yet."}
              </Text>
            ) : null}
            {totalPages > 1 ? (
              <View style={styles.pagination}>
                <Text style={styles.paginationInfo}>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </Text>
                <View style={styles.paginationControls}>
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft size={18} color={colors.foreground} />
                  </Button>
                  <Text style={styles.pageNum}>{currentPage} / {totalPages}</Text>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onPress={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <ChevronRight size={18} color={colors.foreground} />
                  </Button>
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  searchWrap: {
    flex: 1,
    position: "relative" as const,
    minWidth: 0,
  },
  searchIcon: {
    position: "absolute" as const,
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 36,
    height: 40,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearText: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  pagination: {
    marginTop: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  paginationInfo: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pageNum: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
