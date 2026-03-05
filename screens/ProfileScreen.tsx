import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Linking,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import { Button } from "../components/ui/Button";
import { Separator } from "../components/ui/Separator";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import {
  User,
  LogOut,
  Pencil,
  Save,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Instagram,
  Facebook,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { getPromoterMe } from "../services/api";
import type { PromoterMe } from "../services/api";
import { colors } from "../utils/theme";
import {
  KERALA_DISTRICTS,
  TOWNS_BY_DISTRICT,
  LOCAL_BODIES_BY_DISTRICT,
} from "../utils/keralaOptions";

const CONTACT_PHONE = "+919048784003";
const CONTACT_EMAIL = "infozervmail@gmail.com";
const CONTACT_WEBSITE = "https://www.infozerv.com";
const WHATSAPP_URL = "https://wa.me/919048784003";

// Match promoter Profile data and Kerala options
interface ProfileData {
  name: string;
  phone: string;
  houseName: string;
  place: string;
  post: string;
  pin: string;
  district: string;
  nearestTown: string;
  panchayath: string;
  aadharNumber: string;
}

const INITIAL_PROFILE: ProfileData = {
  name: "",
  phone: "",
  houseName: "",
  place: "",
  post: "",
  pin: "",
  district: "",
  nearestTown: "",
  panchayath: "",
  aadharNumber: "",
};

const PROFILE_FIELDS: { key: keyof ProfileData; label: string; required: boolean; placeholder: string; viewLabel?: string }[] = [
  { key: "name", label: "Name", required: true, placeholder: "Full name" },
  { key: "phone", label: "Phone Number", required: true, placeholder: "10-digit phone number" },
  { key: "houseName", label: "House Name / Number", required: false, placeholder: "House name or number" },
  { key: "place", label: "Place", required: false, placeholder: "Place" },
  { key: "post", label: "Post", required: false, placeholder: "Post office" },
  { key: "pin", label: "PIN", required: false, placeholder: "6-digit PIN" },
  { key: "district", label: "District", required: true, placeholder: "Select district" },
  { key: "nearestTown", label: "Nearest Town", required: true, placeholder: "Select town" },
  { key: "panchayath", label: "Panchayath / Municipality / Corp.", required: true, placeholder: "Select local body", viewLabel: "Local Body" },
  { key: "aadharNumber", label: "Aadhar Number", required: false, placeholder: "12-digit Aadhar number" },
];

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [me, setMe] = useState<PromoterMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [form, setForm] = useState<ProfileData>(INITIAL_PROFILE);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getPromoterMe()
        .then((data) => {
          if (cancelled) return;
          const next: ProfileData = {
            name: data.name || "",
            phone: data.whatsapp || "",
            houseName: "",
            place: "",
            post: "",
            pin: "",
            district: data.district?.name ?? "",
            nearestTown: "",
            panchayath: "",
            aadharNumber: "",
          };
          setProfile(next);
          setForm(next);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  const handleEdit = () => {
    setForm(profile);
    setEditing(true);
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    if (field === "district") {
      setForm((prev) => ({ ...prev, district: value, nearestTown: "", panchayath: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    if (!form.district.trim() || !form.nearestTown.trim() || !form.panchayath.trim()) {
      Alert.alert("Required fields", "Please fill District, Nearest Town and Local Body.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setProfile(form);
      setEditing(false);
      setSaving(false);
      Alert.alert("Success", "Profile updated successfully.");
    }, 600);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getViewLabel = (key: keyof ProfileData): string => {
    const f = PROFILE_FIELDS.find((x) => x.key === key);
    return f?.viewLabel ?? f?.label ?? key;
  };

  return (
    <AppLayout title="Profile">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading profile…</Text>
        ) : !editing ? (
          <View style={styles.content}>
            <Card>
              <CardContent className="p-4">
                <View style={styles.profileRow}>
                  <View style={styles.avatarWrap}>
                    <User size={28} color={colors.primary} />
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{profile.name || "—"}</Text>
                    <Text style={styles.profilePhone}>{profile.phone || "—"}</Text>
                  </View>
                </View>
                <Separator className="mb-4" />
                <View style={styles.fieldsGrid}>
                  {PROFILE_FIELDS.map((f) => (
                    <View key={f.key} style={f.key === "aadharNumber" ? styles.fieldFull : styles.fieldHalf}>
                      <Text style={styles.fieldLabel}>{getViewLabel(f.key)}{f.required ? " *" : ""}</Text>
                      <Text style={styles.fieldValue}>{profile[f.key] || "—"}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>

            <View style={styles.buttonRow}>
              <Button className="flex-1" onPress={handleEdit}>
                <Pencil size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>Edit Profile</Text>
              </Button>
              <Button variant="destructive" onPress={handleLogout}>
                <LogOut size={16} color="#fff" />
                <Text style={styles.btnDestructiveText}>Logout</Text>
              </Button>
            </View>
          </View>
        ) : (
          <Card>
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle style={styles.editTitle}>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.formScroll}>
                  {PROFILE_FIELDS.map((f) => (
                    <View key={f.key} style={styles.formField}>
                      <Label>
                        <Text style={styles.labelText}>{f.label}{f.required ? " *" : ""}</Text>
                      </Label>
                      {f.key === "district" || f.key === "nearestTown" || f.key === "panchayath" ? (
                        <SearchableSelect
                          options={
                            f.key === "district"
                              ? KERALA_DISTRICTS
                              : f.key === "nearestTown"
                                ? (form.district ? (TOWNS_BY_DISTRICT[form.district] ?? []) : [])
                                : form.district
                                  ? (LOCAL_BODIES_BY_DISTRICT[form.district] ?? [])
                                  : []
                          }
                          value={form[f.key]}
                          onValueChange={(v) => updateField(f.key, v)}
                          placeholder={
                            f.key !== "district" && !form.district
                              ? "Select district first"
                              : f.placeholder
                          }
                          searchPlaceholder="Search..."
                          disabled={f.key !== "district" && !form.district}
                          allowAdd
                        />
                      ) : (
                        <Input
                          placeholder={f.placeholder}
                          value={form[f.key]}
                          onChangeText={(v) => updateField(f.key, v)}
                          keyboardType={f.key === "phone" || f.key === "pin" || f.key === "aadharNumber" ? "numeric" : "default"}
                        />
                      )}
                    </View>
                  ))}
                  <View style={styles.formActions}>
                    <Button onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                      {saving ? <ActivityIndicator size="small" color="#fff" /> : <Save size={16} color="#fff" />}
                      <Text style={styles.btnPrimaryText}> Save</Text>
                    </Button>
                    <Button variant="outline" onPress={() => setEditing(false)} disabled={saving}>
                      <Text style={styles.btnOutlineText}>Cancel</Text>
                    </Button>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </CardContent>
          </Card>
        )}

        {!loading && (
          <View style={styles.contactSection}>
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle style={styles.sectionTitle}>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <View style={styles.contactRow}>
                  <Phone size={16} color={colors.primary} />
                  <Text style={styles.contactText}>{CONTACT_PHONE}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Mail size={16} color={colors.primary} />
                  <Text style={styles.contactText}>{CONTACT_EMAIL}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Globe size={16} color={colors.primary} />
                  <Text style={styles.contactText}>www.infozerv.com</Text>
                </View>
                <Separator className="my-3" />
                <View style={styles.contactButtonsRow}>
                  <Button size="sm" className="flex-1" onPress={() => Linking.openURL(`tel:${CONTACT_PHONE.replace(/\s/g, "")}`)}>
                    <Phone size={16} color="#fff" />
                    <Text style={styles.btnSmallText}>Call</Text>
                  </Button>
                  <Button size="sm" className="flex-1" style={styles.whatsappBtn} onPress={() => Linking.openURL(WHATSAPP_URL)}>
                    <MessageCircle size={16} color="#fff" />
                    <Text style={styles.btnSmallText}>WhatsApp</Text>
                  </Button>
                </View>
                <View style={styles.contactButtonsRow}>
                  <Button variant="outline" size="sm" className="flex-1" onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
                    <Mail size={16} color={colors.foreground} />
                    <Text style={styles.btnOutlineText}>Email</Text>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onPress={() => Linking.openURL(CONTACT_WEBSITE)}>
                    <Globe size={16} color={colors.foreground} />
                    <Text style={styles.btnOutlineText}>Website</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle style={styles.sectionTitle}>Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 gap-2">
                <Button variant="outline" size="sm" className="w-full" onPress={() => Linking.openURL("https://www.instagram.com/infozerv")}>
                  <Instagram size={16} color={colors.foreground} />
                  <Text style={styles.btnOutlineText}> Instagram</Text>
                  <Text style={styles.handle}>@infozerv</Text>
                </Button>
                <Button variant="outline" size="sm" className="w-full" onPress={() => Linking.openURL("https://www.facebook.com/infozerv")}>
                  <Facebook size={16} color={colors.foreground} />
                  <Text style={styles.btnOutlineText}> Facebook</Text>
                  <Text style={styles.handle}>/infozerv</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 16 },
  content: { gap: 16 },
  loadingText: { textAlign: "center", color: colors.mutedForeground, paddingVertical: 24 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(30, 58, 95, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  profilePhone: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  fieldsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  fieldHalf: { width: "47%", minWidth: 140 },
  fieldFull: { width: "100%" },
  fieldLabel: { fontSize: 12, color: colors.mutedForeground, marginBottom: 2 },
  fieldValue: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  buttonRow: { flexDirection: "row", gap: 12 },
  btnPrimaryText: { color: colors.primaryForeground, fontSize: 14 },
  btnDestructiveText: { color: colors.destructiveForeground, fontSize: 14 },
  editTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  formScroll: {},
  formField: { marginBottom: 16 },
  labelText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  formActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  saveBtn: { flex: 1 },
  contactSection: { gap: 16, marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground, letterSpacing: 0.5 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.muted,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  contactText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  contactButtonsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  whatsappBtn: { backgroundColor: colors.success },
  btnSmallText: { color: "#fff", fontSize: 12 },
  btnOutlineText: { color: colors.foreground, fontSize: 14 },
  handle: { marginLeft: "auto", fontSize: 12, color: colors.mutedForeground },
});
