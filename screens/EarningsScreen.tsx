import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent } from "../components/ui";
import { Badge } from "../components/ui/Badge";
import { Wallet, Clock, CheckCircle } from "lucide-react-native";
import { getPromoterMe, getMySubmissions } from "../services/api";
import type { PromoterMe, PromoterRelatedPayment, ApiSubmissionItem } from "../services/api";
import { colors } from "../utils/theme";

function formatRupee(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// Promoter-style outline badges: StyleSheet (opacity works in RN; Tailwind /10 /20 often doesn't)
const badgeSubmission = StyleSheet.create({
  Approved: { backgroundColor: "rgba(22, 163, 74, 0.12)", borderColor: "rgba(22, 163, 74, 0.25)", borderWidth: 1 },
  Pending: { backgroundColor: "rgba(234, 179, 8, 0.12)", borderColor: "rgba(234, 179, 8, 0.25)", borderWidth: 1 },
  Rejected: { backgroundColor: "rgba(220, 38, 38, 0.12)", borderColor: "rgba(220, 38, 38, 0.25)", borderWidth: 1 },
  Paid: { backgroundColor: "rgba(30, 58, 95, 0.12)", borderColor: "rgba(30, 58, 95, 0.25)", borderWidth: 1 },
  default: { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 },
});
const badgeSubmissionText: Record<string, { color: string }> = {
  Approved: { color: colors.success },
  Pending: { color: colors.warning },
  Rejected: { color: colors.destructive },
  Paid: { color: colors.primary },
};
const badgePayment = {
  container: { backgroundColor: "rgba(22, 163, 74, 0.12)", borderColor: "rgba(22, 163, 74, 0.25)", borderWidth: 1 } as const,
  text: { color: colors.success } as const,
};

export function EarningsScreen() {
  const [tab, setTab] = useState<"submissions" | "payments">("submissions");
  const [me, setMe] = useState<PromoterMe | null>(null);
  const [submissions, setSubmissions] = useState<ApiSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const [meRes, subRes] = await Promise.all([
            getPromoterMe(),
            getMySubmissions(),
          ]);
          if (!cancelled) {
            setMe(meRes);
            setSubmissions(subRes.results ?? []);
          }
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const total = me ? parseFloat(me.total_earnings || "0") : 0;
  const payments = me?.related_payments ?? [];
  const paid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const pending = Math.max(0, total - paid);

  const summary = [
    { label: "Total Earnings", value: me ? formatRupee(total) : "—", icon: Wallet, color: "bg-secondary" },
    { label: "Pending", value: me ? formatRupee(pending) : "—", icon: Clock, color: "bg-warning" },
    { label: "Paid", value: me ? formatRupee(paid) : "—", icon: CheckCircle, color: "bg-success" },
  ];

  return (
    <AppLayout title="Earnings">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View className="flex flex-row flex-wrap gap-3 mb-5 justify-center">
          {summary.map((s) => (
            <Card key={s.label} style={styles.summaryCard}>
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

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setTab("submissions")}
            style={[styles.tab, tab === "submissions" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === "submissions" && styles.tabTextActive]}>Submissions</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("payments")}
            style={[styles.tab, tab === "payments" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === "payments" && styles.tabTextActive]}>Payments</Text>
          </Pressable>
        </View>

        {loading ? (
          <Text className="py-4 text-muted-foreground">Loading…</Text>
        ) : error ? (
          <Text className="py-4 text-destructive">{error}</Text>
        ) : tab === "submissions" ? (
          <View className="gap-3 mt-2">
            {submissions.length === 0 ? (
              <Text className="py-8 text-center text-sm text-muted-foreground">No submissions yet.</Text>
            ) : (
              submissions.map((s) => {
                const status = s.status?.charAt(0).toUpperCase() + (s.status?.slice(1) ?? "") || "—";
                const payoutDisplay =
                  s.payout_amount != null && String(s.payout_amount).trim() !== ""
                    ? /^₹/.test(String(s.payout_amount))
                      ? s.payout_amount
                      : `₹${Number(s.payout_amount).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    : "—";
                return (
                  <Card key={s.id}>
                    <CardContent padding={16} className="gap-2">
                      <View className="flex flex-row items-start justify-between gap-2">
                        <View className="min-w-0 flex-1">
                          <Text className="text-sm font-semibold" numberOfLines={1}>{s.campaign?.title ?? "—"}</Text>
                          <Text className="text-xs text-muted-foreground">Day {s.campaign_day ?? "—"} · {s.submitted_at?.slice(0, 10)}</Text>
                          <Text className="text-xs text-muted-foreground">{s.view_count?.toLocaleString()} views</Text>
                        </View>
                        <View className="items-end gap-1">
                          <Badge
                            variant="outline"
                            style={badgeSubmission[status as keyof typeof badgeSubmission] ?? badgeSubmission.default}
                            textStyle={badgeSubmissionText[status] ?? { color: colors.mutedForeground }}
                          >
                            {status}
                          </Badge>
                          <Text className="text-sm font-semibold">{payoutDisplay}</Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </View>
        ) : (
          <View className="gap-3 mt-2">
            {payments.length === 0 ? (
              <Text className="py-8 text-center text-sm text-muted-foreground">No payments yet.</Text>
            ) : (
              payments.map((p: PromoterRelatedPayment, i: number) => {
                const amountDisplay =
                  p.amount != null && p.amount !== ""
                    ? /^₹/.test(String(p.amount)) ? p.amount : `₹${Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    : "—";
                const statusLabel = p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "Paid";
                return (
                  <Card key={`payment-${i}-${p.batch_id || ""}`}>
                    <CardContent padding={16} className="gap-2">
                      <View className="flex flex-row items-center justify-between gap-2">
                        <Text className="text-sm font-semibold">{amountDisplay}</Text>
                        <Badge
                          variant="outline"
                          style={badgePayment.container}
                          textStyle={badgePayment.text}
                        >
                          {statusLabel}
                        </Badge>
                      </View>
                      <Text className="text-xs text-muted-foreground">{p.batch_id} · {p.date}</Text>
                      {p.campaign_title ? (
                        <Text className="text-xs text-muted-foreground">{p.campaign_title}</Text>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  summaryCard: { width: "47%", minWidth: 140 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    padding: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.foreground,
    fontWeight: "600",
  },
});
