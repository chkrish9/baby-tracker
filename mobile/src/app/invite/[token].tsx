import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { apiFetch } from "@/lib/apiClient";
import { Section, SECTIONS } from "@/lib/sections";
import { useTheme } from "@/theme/ThemeContext";

interface InviteInfo {
  babies: { id: string; name: string; sections: Section[] }[];
  invitedBy: { name?: string; email: string };
  email: string;
  hasAccount: boolean;
}

function sectionLabels(sections: Section[]) {
  return SECTIONS.filter((s) => sections.includes(s.key))
    .map((s) => s.label)
    .join(", ");
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { colors } = useTheme();
  const { user: session, isLoading } = useCurrentUser();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    apiFetch(`/invites/${token}`)
      .then((r) => {
        if (!r.ok) throw r;
        return r.json();
      })
      .then(setInfo)
      .catch(async (r) => {
        const d = await r.json?.().catch(() => ({})) ?? {};
        setError(d.error ?? "Invalid invite");
      })
      .finally(() => setFetching(false));
  }, [token]);

  function handleUnauthenticated() {
    if (!info) return;
    const callbackUrl = `/invite/${token}`;
    const email = info.email;
    const dest = info.hasAccount ? "/(auth)/login" : "/(auth)/register";
    router.push({ pathname: dest, params: { callbackUrl, email } } as never);
  }

  async function handleAccept() {
    if (!session) {
      handleUnauthenticated();
      return;
    }
    setLoading(true);
    const res = await apiFetch(`/invites/${token}`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      const d = await res.json();
      router.replace(`/(app)/babies/${d.babyIds[0]}` as never);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to accept invite");
    }
  }

  if (fetching || isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Spinner />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🍼</Text>

        {error ? (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Invalid invite</Text>
            <Text style={[styles.errorText, { color: colors.pink[400] }]}>{error}</Text>
            <Button onPress={() => router.replace("/(app)/dashboard")}>Go to dashboard</Button>
          </>
        ) : info ? (
          <View style={[styles.card, { borderColor: colors.pink[100] }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>You&apos;re invited!</Text>
            <Text style={[styles.body, { color: colors.foreground }]}>
              <Text style={styles.bold}>{info.invitedBy.name ?? info.invitedBy.email}</Text> invited you to track{" "}
              <Text style={[styles.bold, { color: colors.pink[600] }]}>{joinNames(info.babies.map((b) => b.name))}</Text>.
            </Text>
            <View style={[styles.babyList, { backgroundColor: colors.pink[50] + "80" }]}>
              {info.babies.map((baby) => (
                <Text key={baby.id} style={[styles.babyLine, { color: colors.foreground + "99" }]}>
                  <Text style={[styles.bold, { color: colors.foreground + "CC" }]}>{baby.name}:</Text> {sectionLabels(baby.sections)}
                </Text>
              ))}
            </View>
            {!session && (
              <Text style={[styles.hint, { color: colors.pink[400] }]}>
                {info.hasAccount
                  ? "You'll need to sign in first, then you'll land back here."
                  : "You'll need to create an account first, then you'll land back here."}
              </Text>
            )}
            <Button loading={loading} onPress={handleAccept} style={styles.acceptButton}>
              {session ? "Accept invite" : info.hasAccount ? "Sign in to accept" : "Sign up to accept"}
            </Button>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  emoji: { fontSize: 40, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  errorText: { fontSize: 14, marginBottom: 24, textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    width: "100%",
    maxWidth: 384,
  },
  body: { fontSize: 14, textAlign: "center" },
  bold: { fontWeight: "500" },
  babyList: { borderRadius: 16, padding: 12, gap: 4 },
  babyLine: { fontSize: 12 },
  hint: { fontSize: 12, textAlign: "center" },
  acceptButton: { width: "100%" },
});
