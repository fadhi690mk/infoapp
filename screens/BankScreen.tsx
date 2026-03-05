import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent } from "../components/ui";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Landmark, Plus, Search, X, Trash2, ChevronLeft, ChevronRight } from "lucide-react-native";
import {
  getPromoterMe,
  getPromoterBankAccounts,
  createPromoterBankAccount,
  setPromoterBankAccountActive,
  deletePromoterBankAccount,
} from "../services/api";
import type { PromoterMe, PromoterBankAccount } from "../services/api";
import { colors } from "../utils/theme";

const PAGE_SIZE = 25;

export function BankScreen() {
  const [me, setMe] = useState<PromoterMe | null>(null);
  const [accounts, setAccounts] = useState<PromoterBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settingActiveId, setSettingActiveId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const promoter = await getPromoterMe();
      setMe(promoter);
      const list = await getPromoterBankAccounts(promoter.id);
      setAccounts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bank accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        String(a.account_holder_name ?? "").toLowerCase().includes(q) ||
        String(a.bank_name ?? "").toLowerCase().includes(q) ||
        String(a.account_number_display ?? "").toLowerCase().includes(q) ||
        String(a.ifsc ?? "").toLowerCase().includes(q) ||
        String(a.branch ?? "").toLowerCase().includes(q)
    );
  }, [accounts, search]);

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

  const handleAddAccount = async () => {
    if (!me) return;
    const name = form.accountHolderName.trim();
    const bank = form.bankName.trim();
    const acct = form.accountNumber.trim();
    const ifscVal = form.ifsc.trim();
    if (!name || !bank || !acct || !ifscVal) {
      Alert.alert("Missing fields", "Account holder name, bank name, account number and IFSC are required.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createPromoterBankAccount(me.id, {
        account_holder_name: name,
        bank_name: bank,
        account_number: acct,
        ifsc: ifscVal,
        branch: form.branch.trim(),
      });
      setAccounts((prev) =>
        [...prev, created].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0))
      );
      setForm({ accountHolderName: "", bankName: "", accountNumber: "", ifsc: "", branch: "" });
      setModalOpen(false);
      Alert.alert("Success", "Bank account added.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetActive = async (id: number) => {
    if (!me) return;
    setSettingActiveId(id);
    try {
      const updated = await setPromoterBankAccountActive(me.id, id);
      setAccounts((prev) =>
        prev.map((a) => ({ ...a, is_active: a.id === updated.id }))
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to set active.");
    } finally {
      setSettingActiveId(null);
    }
  };

  const handleRemove = (id: number) => {
    if (!me) return;
    if (accounts.length <= 1) {
      Alert.alert("Cannot remove", "You must have at least one bank account.");
      return;
    }
    Alert.alert(
      "Remove account",
      "Remove this bank account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await deletePromoterBankAccount(me.id, id);
              setAccounts((prev) => prev.filter((a) => a.id !== id));
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed to remove.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <AppLayout title="Bank Accounts">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View style={styles.topRow}>
          <Text style={styles.description}>
            Manage your bank accounts for payouts. Only one can be active at a time.
          </Text>
          <Button size="sm" onPress={() => setModalOpen(true)}>
            <Plus size={16} color="#fff" />
            <Text style={styles.btnText}>Add</Text>
          </Button>
        </View>

        {loading ? (
          <Text className="py-6 text-center text-muted-foreground">Loading…</Text>
        ) : error ? (
          <Text className="py-4 text-destructive">{error}</Text>
        ) : (
          <>
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
                <Input
                  placeholder="Search accounts…"
                  value={search}
                  onChangeText={(v) => { setSearch(v); setPage(1); }}
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

            <View className="gap-3 mt-2">
              {paginated.length === 0 ? (
                <Text className="py-8 text-center text-sm text-muted-foreground">
                  No accounts found. Add one to receive payouts.
                </Text>
              ) : (
                paginated.map((a) => (
                  <Card key={a.id} style={a.is_active ? styles.cardActive : undefined}>
                    <CardContent padding={16}>
                      <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                          <View style={styles.bankIconWrap}>
                            <Landmark size={20} color={colors.primary} />
                          </View>
                          <View style={styles.cardDetails}>
                            <Text style={styles.accountName}>{a.account_holder_name}</Text>
                            <Text style={styles.muted}>{a.bank_name}</Text>
                            <Text style={styles.muted}>A/C: {a.account_number_display}</Text>
                            <Text style={styles.muted}>
                              IFSC: {a.ifsc}{a.branch ? ` · ${a.branch}` : ""}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.cardActions}>
                          {a.is_active ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onPress={() => handleSetActive(a.id)}
                              disabled={settingActiveId !== null}
                            >
                              {settingActiveId === a.id ? (
                                <ActivityIndicator size="small" color={colors.foreground} />
                              ) : (
                                <Text style={styles.outlineBtnText}>Set Active</Text>
                              )}
                            </Button>
                          )}
                          <Pressable
                            onPress={() => handleRemove(a.id)}
                            disabled={deletingId !== null || accounts.length <= 1}
                            style={styles.deleteBtn}
                          >
                            {deletingId === a.id ? (
                              <ActivityIndicator size="small" color={colors.mutedForeground} />
                            ) : (
                              <Trash2 size={18} color={colors.mutedForeground} />
                            )}
                          </Pressable>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                ))
              )}
            </View>

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
        )}
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => !submitting && setModalOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalCenter}>
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Bank Account</Text>
                <Pressable onPress={() => !submitting && setModalOpen(false)} hitSlop={12}>
                  <X size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
                <View style={styles.field}>
                  <Label>Account Holder Name *</Label>
                  <Input
                    placeholder="e.g. Ravi Kumar"
                    value={form.accountHolderName}
                    onChangeText={(v) => setForm((f) => ({ ...f, accountHolderName: v }))}
                  />
                </View>
                <View style={styles.field}>
                  <Label>Bank Name *</Label>
                  <Input
                    placeholder="e.g. State Bank of India"
                    value={form.bankName}
                    onChangeText={(v) => setForm((f) => ({ ...f, bankName: v }))}
                  />
                </View>
                <View style={styles.field}>
                  <Label>Account Number *</Label>
                  <Input
                    placeholder="Enter account number"
                    value={form.accountNumber}
                    onChangeText={(v) => setForm((f) => ({ ...f, accountNumber: v }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.field}>
                  <Label>IFSC Code *</Label>
                  <Input
                    placeholder="e.g. SBIN0001234"
                    value={form.ifsc}
                    onChangeText={(v) => setForm((f) => ({ ...f, ifsc: v.toUpperCase() }))}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.field}>
                  <Label>Branch</Label>
                  <Input
                    placeholder="e.g. MG Road"
                    value={form.branch}
                    onChangeText={(v) => setForm((f) => ({ ...f, branch: v }))}
                  />
                </View>
                <Button onPress={handleAddAccount} disabled={submitting} style={styles.saveBtn}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Save Account</Text>
                  )}
                </Button>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  btnText: { color: "#fff", fontSize: 14 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  searchWrap: { flex: 1, position: "relative" as const, minWidth: 0 },
  searchIcon: { position: "absolute" as const, left: 12, top: 12, zIndex: 1 },
  searchInput: { paddingLeft: 36, height: 40 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  clearText: { fontSize: 14, color: colors.mutedForeground, fontWeight: "500" },
  cardActive: { borderWidth: 2, borderColor: colors.primary },
  cardRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  cardLeft: { flexDirection: "row", gap: 12, flex: 1, minWidth: 0 },
  bankIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(30, 58, 95, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: { flex: 1, minWidth: 0 },
  accountName: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 2 },
  muted: { fontSize: 12, color: colors.mutedForeground, marginBottom: 1 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  outlineBtnText: { color: colors.foreground, fontSize: 14 },
  deleteBtn: { padding: 8 },
  pagination: { marginTop: 16, paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
  paginationInfo: { fontSize: 12, color: colors.mutedForeground },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  pageNum: { fontSize: 14, color: colors.mutedForeground },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalCenter: { maxWidth: 400, width: "100%", alignSelf: "center" },
  modalContent: { backgroundColor: colors.card, borderRadius: 12, padding: 20, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  formScroll: { maxHeight: 400 },
  field: { marginBottom: 16 },
  saveBtn: { marginTop: 8 },
});
