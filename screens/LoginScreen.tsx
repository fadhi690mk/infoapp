import React, { useState } from "react";
import { View, Image, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import { Eye, EyeOff } from "lucide-react-native";
import { colors } from "../utils/theme";
import { useAuth } from "../contexts/AuthContext";
import {
  KERALA_DISTRICTS,
  TOWNS_BY_DISTRICT,
  LOCAL_BODIES_BY_DISTRICT,
} from "../utils/keralaOptions";

const logo = require("../assets/infozerv-logo.png");

export function LoginScreen() {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Register form state (promoter-style)
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAadhar, setRegAadhar] = useState("");
  const [regDistrict, setRegDistrict] = useState("");
  const [regTown, setRegTown] = useState("");
  const [regPanchayath, setRegPanchayath] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string | undefined>>({});
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  const onRegDistrictChange = (value: string) => {
    setRegDistrict(value);
    setRegTown("");
    setRegPanchayath("");
    setRegErrors((p) => ({ ...p, district: undefined, nearestTown: undefined, panchayath: undefined }));
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!loginPhone.trim()) {
      setLoginError("Mobile number is required");
      return;
    }
    if (!/^\d{10}$/.test(loginPhone.trim())) {
      setLoginError("Enter a valid 10-digit mobile number");
      return;
    }
    if (!loginPassword) {
      setLoginError("Password is required");
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await login(loginPhone.trim(), loginPassword);
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const validateRegister = (): boolean => {
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = "Full name is required";
    if (!regPhone.trim()) {
      errors.phone = "Mobile number is required";
    } else if (!/^\d{10}$/.test(regPhone.trim())) {
      errors.phone = "Enter a valid 10-digit mobile number";
    }
    if (regAadhar.trim() && !/^\d{12}$/.test(regAadhar.trim())) {
      errors.aadhar = "Aadhar number must be 12 digits";
    }
    if (!regDistrict.trim()) errors.district = "District is required";
    if (!regTown.trim()) errors.nearestTown = "Nearest town is required";
    if (!regPanchayath.trim()) errors.panchayath = "Local body is required";
    if (!regPassword) {
      errors.password = "Password is required";
    } else if (regPassword.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!regConfirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = () => {
    setRegisterMessage(null);
    if (!validateRegister()) return;
    setRegSubmitting(true);
    setTimeout(() => {
      setRegSubmitting(false);
      setRegisterMessage("Registration is by invite only. Contact your admin to get an account.");
    }, 400);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Card className="w-full max-w-sm" style={styles.card}>
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg">Promoter Portal</CardTitle>
          </CardHeader>
          <CardContent>
          <View className="flex flex-row rounded-md bg-muted p-1 mb-4">
            <Pressable
              onPress={() => setActiveTab("login")}
              className={`flex-1 py-2 rounded-sm ${activeTab === "login" ? "bg-background shadow-sm" : ""}`}
            >
              <Text className={`text-center text-sm font-medium ${activeTab === "login" ? "text-foreground" : "text-muted-foreground"}`}>
                Login
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("register")}
              className={`flex-1 py-2 rounded-sm ${activeTab === "register" ? "bg-background shadow-sm" : ""}`}
            >
              <Text className={`text-center text-sm font-medium ${activeTab === "register" ? "text-foreground" : "text-muted-foreground"}`}>
                Register
              </Text>
            </Pressable>
          </View>

          {activeTab === "login" && (
            <View className="gap-4">
              <View className="gap-1.5">
                <Label>Mobile Number *</Label>
                <Input
                  placeholder="Enter 10-digit mobile number"
                  value={loginPhone}
                  onChangeText={(t) => { setLoginPhone(t.replace(/\D/g, "").slice(0, 10)); setLoginError(""); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View className="gap-1.5">
                <Label>Password *</Label>
                <View className="relative">
                  <Input
                    placeholder="Enter password"
                    value={loginPassword}
                    onChangeText={(t) => { setLoginPassword(t); setLoginError(""); }}
                    secureTextEntry={!showPassword}
                    className="pr-10"
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-0 bottom-0 justify-center"
                  >
                    {showPassword ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
                  </Pressable>
                </View>
              </View>
              {loginError ? <Text className="text-xs text-destructive">{loginError}</Text> : null}
              <Button onPress={handleLogin} disabled={submitting}>
                {submitting ? "Logging in…" : "Login"}
              </Button>
              <Text className="text-center text-xs text-muted-foreground">Use your registered mobile number and password.</Text>
            </View>
          )}

          {activeTab === "register" && (
            <View style={styles.registerForm}>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>Full Name <Text style={styles.required}>*</Text></Text></Label>
                <Input
                  placeholder="Enter full name"
                  value={regName}
                  onChangeText={(t) => { setRegName(t); setRegErrors((p) => ({ ...p, name: undefined })); }}
                />
                {regErrors.name ? <Text style={styles.fieldError}>{regErrors.name}</Text> : null}
              </View>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>Mobile Number <Text style={styles.required}>*</Text></Text></Label>
                <Input
                  placeholder="Enter 10-digit mobile number"
                  value={regPhone}
                  onChangeText={(t) => { setRegPhone(t.replace(/\D/g, "").slice(0, 10)); setRegErrors((p) => ({ ...p, phone: undefined })); }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {regErrors.phone ? <Text style={styles.fieldError}>{regErrors.phone}</Text> : null}
              </View>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>Aadhar Number</Text></Label>
                <Input
                  placeholder="12-digit Aadhar number (optional)"
                  value={regAadhar}
                  onChangeText={(t) => { setRegAadhar(t.replace(/\D/g, "").slice(0, 12)); setRegErrors((p) => ({ ...p, aadhar: undefined })); }}
                  keyboardType="numeric"
                  maxLength={12}
                />
                {regErrors.aadhar ? <Text style={styles.fieldError}>{regErrors.aadhar}</Text> : null}
              </View>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>District <Text style={styles.required}>*</Text></Text></Label>
                <SearchableSelect
                  options={KERALA_DISTRICTS}
                  value={regDistrict}
                  onValueChange={onRegDistrictChange}
                  placeholder="Search district..."
                  searchPlaceholder="Search district..."
                  allowAdd
                />
                {regErrors.district ? <Text style={styles.fieldError}>{regErrors.district}</Text> : null}
              </View>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>Nearest Town <Text style={styles.required}>*</Text></Text></Label>
                <SearchableSelect
                  options={regDistrict ? (TOWNS_BY_DISTRICT[regDistrict] ?? []) : []}
                  value={regTown}
                  onValueChange={(v) => { setRegTown(v); setRegErrors((p) => ({ ...p, nearestTown: undefined })); }}
                  placeholder={regDistrict ? "Search town..." : "Select district first"}
                  searchPlaceholder="Search town..."
                  disabled={!regDistrict}
                  allowAdd
                />
                {regErrors.nearestTown ? <Text style={styles.fieldError}>{regErrors.nearestTown}</Text> : null}
              </View>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>Panchayath / Municipality / Corp. <Text style={styles.required}>*</Text></Text></Label>
                <SearchableSelect
                  options={regDistrict ? (LOCAL_BODIES_BY_DISTRICT[regDistrict] ?? []) : []}
                  value={regPanchayath}
                  onValueChange={(v) => { setRegPanchayath(v); setRegErrors((p) => ({ ...p, panchayath: undefined })); }}
                  placeholder={regDistrict ? "Search local body..." : "Select district first"}
                  searchPlaceholder="Search local body..."
                  disabled={!regDistrict}
                  allowAdd
                />
                {regErrors.panchayath ? <Text style={styles.fieldError}>{regErrors.panchayath}</Text> : null}
              </View>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>Password <Text style={styles.required}>*</Text></Text></Label>
                <View style={styles.passwordWrap}>
                  <Input
                    placeholder="Create password (min. 6 chars)"
                    value={regPassword}
                    onChangeText={(t) => { setRegPassword(t); setRegErrors((p) => ({ ...p, password: undefined })); }}
                    secureTextEntry={!regShowPassword}
                    style={styles.passwordInput}
                  />
                  <Pressable
                    onPress={() => setRegShowPassword((s) => !s)}
                    style={styles.eyeBtn}
                  >
                    {regShowPassword ? <EyeOff size={16} color={colors.mutedForeground} /> : <Eye size={16} color={colors.mutedForeground} />}
                  </Pressable>
                </View>
                {regErrors.password ? <Text style={styles.fieldError}>{regErrors.password}</Text> : null}
              </View>
              <View style={styles.field}>
                <Label><Text style={styles.labelText}>Confirm Password <Text style={styles.required}>*</Text></Text></Label>
                <Input
                  placeholder="Re-enter your password"
                  value={regConfirmPassword}
                  onChangeText={(t) => { setRegConfirmPassword(t); setRegErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  secureTextEntry={!regShowPassword}
                />
                {regErrors.confirmPassword ? <Text style={styles.fieldError}>{regErrors.confirmPassword}</Text> : null}
              </View>
              {registerMessage ? (
                <Text style={styles.registerMessage}>{registerMessage}</Text>
              ) : null}
              <Button onPress={handleRegister} disabled={regSubmitting}>
                {regSubmitting ? "Submitting…" : "Register"}
              </Button>
              <Button variant="outline" onPress={() => setActiveTab("login")}>
                Go to Login
              </Button>
            </View>
          )}
        </CardContent>
      </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingVertical: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.background,
  },
  logo: {
    height: 64,
    width: 160,
    marginBottom: 24,
    alignSelf: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
  },
  registerForm: { gap: 12 },
  field: { gap: 4 },
  labelText: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  required: { color: colors.destructive },
  fieldError: { fontSize: 12, color: colors.destructive },
  registerMessage: {
    fontSize: 14,
    color: colors.mutedForeground,
    backgroundColor: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 40 },
  eyeBtn: { position: "absolute", right: 10, top: 0, bottom: 0, justifyContent: "center" },
});
