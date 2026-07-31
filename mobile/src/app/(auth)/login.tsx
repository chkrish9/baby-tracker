import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/theme/ThemeContext";
import { fixedColors } from "@/theme/tokens";
import { textStyles } from "@/theme/typography";

const logo = require("../../../assets/images/icon.png");

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ callbackUrl?: string; email?: string }>();

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    const result = await signIn(email, password, rememberMe);
    if ("error" in result) {
      setLoading(false);
      setError(result.error);
      return;
    }

    if (params.callbackUrl) {
      setLoading(false);
      router.replace(params.callbackUrl as never);
      return;
    }

    const babies = await apiFetch("/babies")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);
    setLoading(false);
    if (babies.length > 0) {
      const activeBabyId = await AsyncStorage.getItem("activeBabyId");
      const target = babies.find((b: { id: string }) => b.id === activeBabyId) ?? babies[0];
      router.replace(`/(app)/babies/${target.id}` as never);
    } else {
      router.replace("/(app)/dashboard");
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
            <Text style={[textStyles.wordmark, { color: colors.foreground }]}>Little Notes</Text>
            <Text style={[styles.subtitle, { color: colors.foreground + "80" }]}>
              Gentle tracking for your little one
            </Text>
          </View>

          <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>
            {!!error && (
              <Text style={[styles.error, { color: fixedColors.red[600], backgroundColor: fixedColors.red[50] }]}>
                {error}
              </Text>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                placeholder="Your password"
              />
            </View>

            <View style={styles.rememberRow}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ true: colors.pink[500] }}
              />
              <Text style={{ color: colors.foreground + "B3", fontSize: 14 }}>Remember me</Text>
            </View>

            <Button loading={loading} disabled={!email || !password} onPress={handleSubmit} size="lg" style={styles.submit}>
              Sign in
            </Button>
          </View>

          <Text style={[styles.footer, { color: colors.foreground + "80" }]}>
            New here?{" "}
            <Link href="/(auth)/register" style={[styles.footerLink, { color: colors.foreground }]}>
              Create one
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 16 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { width: 80, height: 80, borderRadius: 24, marginBottom: 16 },
  subtitle: { fontSize: 14, marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  error: { fontSize: 14, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submit: { width: "100%" },
  footer: { textAlign: "center", fontSize: 14, marginTop: 20 },
  footerLink: { fontWeight: "600" },
});
