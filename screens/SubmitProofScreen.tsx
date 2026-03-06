import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect, type RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { ArrowLeft, Upload, CheckCircle, CalendarDays, Lock, AlertCircle, X } from "lucide-react-native";
import {
  getPromoterCampaigns,
  getMySubmissions,
  createSubmission,
  type ApiSubmissionItem,
  type PromoterCampaign,
} from "../services/api";

const PAGE_SIZE = 25;

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  approved: { bg: "rgba(22,163,74,0.1)", text: "#16a34a", border: "rgba(22,163,74,0.3)" },
  pending: { bg: "rgba(234,179,8,0.1)", text: "#ca8a04", border: "rgba(234,179,8,0.3)" },
  rejected: { bg: "rgba(220,38,38,0.1)", text: "#dc2626", border: "rgba(220,38,38,0.3)" },
  paid: { bg: "rgba(30,58,95,0.1)", text: "#1e3a5f", border: "rgba(30,58,95,0.3)" },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatEarning(payout: string | null): string {
  if (payout == null || payout === "") return "—";
  const n = parseFloat(payout);
  return isNaN(n) ? "—" : `₹${n}`;
}

function SubmissionRow({ s }: { s: ApiSubmissionItem }) {
  const statusLabel = s.status.charAt(0).toUpperCase() + s.status.slice(1);
  const style = statusColors[s.status] ?? { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" };
  return (
    <Card>
      <CardContent style={styles.submissionRow}>
        <View>
          <Text style={styles.submissionDate}>{formatDate(s.submitted_at)}</Text>
          <Text style={styles.submissionViews}>{s.view_count} views</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
            <Text style={[styles.badgeText, { color: style.text }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.payoutText}>{formatEarning(s.payout_amount)}</Text>
        </View>
      </CardContent>
    </Card>
  );
}

type RouteParams = { campaignId?: number; campaignTitle?: string };

export function SubmitProofScreen() {
  const route = useRoute<RouteProp<{ params: RouteParams }, "params">>();
  const navigation = useNavigation<any>();
  const campaignIdParam = route.params?.campaignId;
  const campaignTitleParam = route.params?.campaignTitle;

  const [campaigns, setCampaigns] = useState<PromoterCampaign[]>([]);
  const [submissions, setSubmissions] = useState<ApiSubmissionItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [viewCount, setViewCount] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const selectedCampaign = useMemo(
    () =>
      campaignIdParam != null
        ? campaigns.find((c) => c.id === campaignIdParam) ?? null
        : null,
    [campaigns, campaignIdParam]
  );

  const campaignTitle = selectedCampaign?.title ?? campaignTitleParam ?? "Campaign";
  const todayISO = new Date().toISOString().slice(0, 10);
  const submittedToday = submissions.some((s) => s.submitted_at === todayISO);
  const campaignNotFound = campaignIdParam != null && !selectedCampaign && !loadingCampaigns;

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const list = await getPromoterCampaigns();
      setCampaigns(Array.isArray(list) ? list : []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  const loadSubmissions = useCallback(async (campaignId: number | undefined) => {
    setLoadingSubmissions(true);
    try {
      const res = await getMySubmissions(campaignId);
      setSubmissions(res.results ?? []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, [loadCampaigns])
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedCampaign?.id != null) {
        loadSubmissions(selectedCampaign.id);
      } else if (campaignIdParam == null) {
        loadSubmissions(undefined);
      } else {
        setSubmissions([]);
        setLoadingSubmissions(false);
      }
    }, [selectedCampaign?.id, campaignIdParam, loadSubmissions])
  );

  const campaignSubmissions = useMemo(() => {
    if (!selectedCampaign) return submissions;
    return submissions.filter((s) => s.campaign?.id === selectedCampaign.id);
  }, [submissions, selectedCampaign]);

  const searchLower = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!searchLower) return campaignSubmissions;
    return campaignSubmissions.filter(
      (s) =>
        s.status.toLowerCase().includes(searchLower) ||
        (s.submitted_at && s.submitted_at.toLowerCase().includes(searchLower))
    );
  }, [campaignSubmissions, searchLower]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = useMemo(
    () => filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [filtered, currentPage]
  );

  const hasFiltersApplied = campaignIdParam != null || search.trim() !== "";
  const clearFilters = () => {
    setSearch("");
    setPage(0);
    if (campaignIdParam != null) navigation.getParent()?.navigate("MainTabs");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to upload a screenshot.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (selectedCampaign == null || campaignIdParam == null) {
      Alert.alert("Error", "Select a campaign from Dashboard and tap Submit Proof on a campaign.");
      return;
    }
    if (submittedToday) {
      Alert.alert("Already submitted", "You have already submitted for this campaign today.");
      return;
    }
    const vc = viewCount.trim();
    if (!vc) {
      Alert.alert("Missing field", "Enter view count.");
      return;
    }
    const numViews = parseInt(vc, 10);
    if (isNaN(numViews) || numViews < 0) {
      Alert.alert("Invalid view count", "Enter a number ≥ 0.");
      return;
    }
    if (!screenshotUri) {
      Alert.alert("Missing screenshot", "Upload a screenshot proof.");
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission(campaignIdParam, numViews, screenshotUri);
      Alert.alert("Submitted!", "Your proof is under review.");
      setViewCount("");
      setScreenshotUri(null);
      loadSubmissions(selectedCampaign.id);
    } catch (e) {
      Alert.alert(
        "Submission failed",
        e instanceof Error ? e.message : "Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    selectedCampaign != null &&
    campaignIdParam != null &&
    !campaignNotFound &&
    !submittedToday &&
    !submitting;

  return (
    <AppLayout title="Submit Status">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex1}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Button variant="ghost" size="sm" style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={16} color="#333" />
            <Text style={styles.backText}>Back</Text>
          </Button>

          {/* Form card */}
          <Card>
            <CardContent style={styles.cardContent}>
              {loadingCampaigns ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#ea580c" />
                  <Text style={styles.mutedText}>Loading campaigns…</Text>
                </View>
              ) : (
                <>
                  <View style={styles.fieldBlock}>
                    <Label>Campaign</Label>
                    {selectedCampaign ? (
                      <View style={styles.campaignBox}>
                        <Text style={styles.campaignTitle} numberOfLines={2}>
                          {campaignTitle}
                        </Text>
                      </View>
                    ) : campaignNotFound ? (
                      <View style={styles.errorBox}>
                        <AlertCircle size={18} color="#dc2626" />
                        <Text style={styles.errorText}>
                          This campaign is not available or has ended. Choose a campaign from the Dashboard.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.mutedBox}>
                        <Text style={styles.mutedText}>
                          No campaign selected — go to Dashboard and tap Submit Proof on a campaign.
                        </Text>
                      </View>
                    )}
                  </View>

                  {selectedCampaign && (
                    <View style={styles.fieldBlock}>
                      <Label>
                        <View style={styles.labelRow}>
                          <CalendarDays size={16} color="#64748b" />
                          <Text>Today&apos;s submission</Text>
                        </View>
                      </Label>
                      {submittedToday ? (
                        <View style={styles.successRow}>
                          <CheckCircle size={20} color="#16a34a" />
                          <Text style={styles.successText}>
                            You have already submitted for this campaign today. Only one submission per day is allowed.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.mutedBox}>
                          <Text style={styles.mutedText}>Date will be set to today automatically</Text>
                          <Lock size={14} color="#94a3b8" />
                        </View>
                      )}
                    </View>
                  )}

                  {canSubmit && (
                    <>
                      <View style={styles.fieldBlock}>
                        <Label>View count</Label>
                        <Input
                          placeholder="Enter view count"
                          value={viewCount}
                          onChangeText={setViewCount}
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={styles.fieldBlock}>
                        <Label>Screenshot proof</Label>
                        <TouchableOpacity onPress={pickImage} style={styles.uploadArea}>
                          {screenshotUri ? (
                            <Image
                              source={{ uri: screenshotUri }}
                              style={styles.uploadImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <>
                              <Upload size={32} color="#94a3b8" />
                              <Text style={styles.mutedText}>Tap to upload screenshot</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                      <Button onPress={handleSubmit} disabled={!canSubmit} style={styles.submitBtn}>
                        <View style={styles.submitBtnContent}>
                          {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : null}
                          <Text style={styles.submitBtnText}>
                            {submitting ? "Submitting…" : "Submit proof"}
                          </Text>
                        </View>
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Submissions list section */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {selectedCampaign ? `${campaignTitle} — Submissions` : "Submissions"}
            </Text>
            {hasFiltersApplied && (
              <Pressable onPress={clearFilters} style={styles.clearBtn}>
                <X size={16} color="#64748b" />
                <Text style={styles.clearText}>Clear filters</Text>
              </Pressable>
            )}
          </View>

          <Input
            placeholder="Search by status or date…"
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setPage(0);
            }}
            style={styles.searchInput}
          />

          {loadingSubmissions ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#ea580c" />
              <Text style={styles.mutedText}>Loading submissions…</Text>
            </View>
          ) : (
            <>
              <View style={styles.list}>
                {paginated.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {selectedCampaign
                      ? "No submissions yet for this campaign."
                      : "No submissions found."}
                  </Text>
                ) : (
                  paginated.map((s) => <SubmissionRow key={s.id} s={s} />)
                )}
              </View>

              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onPress={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <Text style={styles.paginationText}>Previous</Text>
                  </Button>
                  <Text style={styles.pageInfo}>
                    {currentPage + 1} / {totalPages}
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages - 1}
                    onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    <Text style={styles.paginationText}>Next</Text>
                  </Button>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 14, color: "#333" },
  cardContent: { padding: 16, gap: 16 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 16 },
  fieldBlock: { gap: 6 },
  campaignBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  campaignTitle: { fontSize: 14, fontWeight: "500", flex: 1 },
  mutedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mutedText: { fontSize: 14, color: "#64748b" },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.3)",
    backgroundColor: "rgba(220,38,38,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { fontSize: 14, color: "#dc2626", flex: 1 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  successText: { fontSize: 14, color: "#16a34a", fontWeight: "500", flex: 1 },
  uploadArea: {
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  uploadImage: { width: "100%", height: 160, borderRadius: 6 },
  submitBtn: { width: "100%" },
  submitBtnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitBtnText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  listTitle: { fontSize: 14, fontWeight: "600" },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  clearText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  searchInput: { marginBottom: 12 },
  list: { gap: 8 },
  emptyText: { textAlign: "center", fontSize: 14, color: "#64748b", paddingVertical: 32 },
  submissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  submissionDate: { fontSize: 14, fontWeight: "600" },
  submissionViews: { fontSize: 12, color: "#64748b", marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  payoutText: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  paginationText: { fontSize: 14, color: "#333" },
  pageInfo: { fontSize: 14, color: "#64748b" },
});
