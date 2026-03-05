import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Linking, Image, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Play } from "lucide-react-native";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent } from "../components/ui";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Wallet, Clock, CheckCircle, FileText, Share2, Upload, Download } from "lucide-react-native";
import { getPromoterMe, getPromoterCampaigns, resolveImageUrl } from "../services/api";
import { downloadAndShareVideo, downloadVideoToFile, shareVideoFile } from "../utils/videoShare";
import type { PromoterMe, PromoterCampaign } from "../services/api";

function formatRupee(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [me, setMe] = useState<PromoterMe | null>(null);
  const [campaigns, setCampaigns] = useState<PromoterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoActionCampaignId, setVideoActionCampaignId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const [meRes, campaignsRes] = await Promise.all([
            getPromoterMe(),
            getPromoterCampaigns(),
          ]);
          if (!cancelled) {
            setMe(meRes);
            setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
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
  const activeCampaigns = campaigns.filter((c) => c.status === "published" || c.status === "active");

  const stats = [
    { label: "Total Earnings", value: me ? formatRupee(total) : "—", icon: Wallet, color: "bg-secondary" },
    { label: "Pending", value: me ? formatRupee(pending) : "—", icon: Clock, color: "bg-warning" },
    { label: "Paid", value: me ? formatRupee(paid) : "—", icon: CheckCircle, color: "bg-success" },
    { label: "Approved Posts", value: me?.submission_count ?? "—", icon: FileText, color: "bg-primary" },
  ];

  const shareText = (c: PromoterCampaign) =>
    c.media_text || `Check out: ${c.title} from ${c.shop}!`;
  const openWhatsApp = (c: PromoterCampaign) => {
    const text = shareText(c);
    Linking.openURL(`https://api.whatsapp.com/send/?text=${encodeURIComponent(text)}`);
  };
  const playVideo = (c: PromoterCampaign) => {
    if (c.media_url) Linking.openURL(resolveImageUrl(c.media_url));
  };

  const handleShareVideoToWhatsApp = async (c: PromoterCampaign) => {
    if (!c.media_url) return;
    setVideoActionCampaignId(c.id);
    try {
      await downloadAndShareVideo(resolveImageUrl(c.media_url), {
        dialogTitle: "Share video to WhatsApp",
      });
    } catch (e) {
      Alert.alert(
        "Share failed",
        e instanceof Error ? e.message : "Could not download or share the video."
      );
    } finally {
      setVideoActionCampaignId(null);
    }
  };

  const handleDownloadVideo = async (c: PromoterCampaign) => {
    if (!c.media_url) return;
    setVideoActionCampaignId(c.id);
    try {
      const localUri = await downloadVideoToFile(resolveImageUrl(c.media_url));
      await shareVideoFile(localUri, { dialogTitle: "Save or share video" });
    } catch (e) {
      Alert.alert(
        "Download failed",
        e instanceof Error ? e.message : "Could not download the video."
      );
    } finally {
      setVideoActionCampaignId(null);
    }
  };

  return (
    <AppLayout title="Dashboard">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Text className="mb-4 text-sm text-muted-foreground">
          {loading ? "Loading…" : me ? `Welcome back, ${me.name} 👋` : "Welcome back 👋"}
        </Text>

        {error ? (
          <Text className="mb-4 text-sm text-destructive">{error}</Text>
        ) : null}

        <View className="flex flex-row flex-wrap gap-3 mb-6 justify-center">
          {stats.map((s) => (
            <Card key={s.label} style={{ width: "47%", minWidth: 140 }}>
              <CardContent padding={6} className="flex flex-row items-center gap-3">
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

        <Text className="mb-3 text-sm font-semibold">Active Campaigns</Text>
        {loading ? (
          <Text className="text-sm text-muted-foreground py-2">Loading campaigns…</Text>
        ) : activeCampaigns.length === 0 ? (
          <Text className="text-sm text-muted-foreground py-4">No campaigns for your panchayath right now.</Text>
        ) : (
          <View className="gap-4">
            {activeCampaigns.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent noPadding>
                  {c.media_type === "image" && c.media_url ? (
                    <Image
                      source={{ uri: resolveImageUrl(c.media_url) }}
                      style={{ width: "100%", height: 160 }}
                      resizeMode="cover"
                    />
                  ) : c.media_type === "video" && c.media_url ? (
                    <View style={{ width: "100%", height: 160, backgroundColor: "#1e2936", justifyContent: "center", alignItems: "center" }}>
                      <Play size={48} color="#fff" fill="#fff" />
                      <Text style={{ color: "#fff", marginTop: 8, fontSize: 14 }}>Video campaign</Text>
                    </View>
                  ) : c.media_type === "text" && c.media_text ? (
                    <View className="bg-muted px-4 py-5">
                      <Text className="text-sm text-foreground">{c.media_text}</Text>
                    </View>
                  ) : null}
                  <View className="p-4">
                    <View className="flex flex-row items-start justify-between mb-3">
                      <View>
                        <Text className="font-semibold text-sm">{c.title}</Text>
                        <Text className="text-xs text-muted-foreground">{c.shop} · {c.category}</Text>
                      </View>
                      <Badge variant="success">Active</Badge>
                    </View>
                    <View className="gap-2">
                      {c.media_type === "video" && c.media_url ? (
                        <>
                          <Button size="sm" onPress={() => playVideo(c)} disabled={videoActionCampaignId !== null}>
                            <Play size={16} color="#fff" />
                            <Text className="text-primary-foreground text-sm">Play video</Text>
                          </Button>
                          <Button
                            size="sm"
                            onPress={() => handleDownloadVideo(c)}
                            disabled={videoActionCampaignId !== null}
                          >
                            {videoActionCampaignId === c.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Download size={16} color="#fff" />
                            )}
                            <Text className="text-primary-foreground text-sm">
                              {videoActionCampaignId === c.id ? "Downloading…" : "Download video"}
                            </Text>
                          </Button>
                          <Button
                            size="sm"
                            onPress={() => handleShareVideoToWhatsApp(c)}
                            disabled={videoActionCampaignId !== null}
                          >
                            {videoActionCampaignId === c.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Share2 size={16} color="#fff" />
                            )}
                            <Text className="text-primary-foreground text-sm">
                              {videoActionCampaignId === c.id ? "Preparing…" : "Share to WhatsApp"}
                            </Text>
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onPress={() => openWhatsApp(c)}>
                          <Share2 size={16} color="#fff" />
                          <Text className="text-primary-foreground text-sm">Share to WhatsApp</Text>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onPress={() =>
                          navigation.getParent()?.navigate("SubmitProof", {
                            campaignId: c.id,
                            campaignTitle: c.title,
                          })
                        }
                      >
                        <Upload size={16} color="#fff" />
                        <Text className="text-secondary-foreground text-sm">Submit Proof</Text>
                      </Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}
