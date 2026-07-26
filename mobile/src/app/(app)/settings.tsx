import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSWRConfig } from "swr";
import { EyeIcon, EyeOffIcon, SignOutIcon } from "@/components/icons";
import { SectionPermissionsPicker } from "@/components/invite/SectionPermissionsPicker";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useToast } from "@/components/ui/Toast";
import { useBabies } from "@/hooks/useBaby";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { apiFetch } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
import { useAuthHeaders, filesUrl } from "@/lib/files";
import { Section, SECTIONS } from "@/lib/sections";
import { useTheme } from "@/theme/ThemeContext";
import { fixedColors } from "@/theme/tokens";
import { textStyles } from "@/theme/typography";

interface ParentLink {
  id: string;
  userId: string;
  role: "OWNER" | "PARENT";
  sections: Section[];
  user: { id: string; name: string | null; email: string };
}
interface BabyWithParents {
  id: string;
  name: string;
  parents: ParentLink[];
}

function sectionLabels(sections: Section[]) {
  return SECTIONS.filter((s) => sections.includes(s.key)).map((s) => s.label).join(", ") || "No pages shared";
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const { signOut } = useAuth();
  const authHeaders = useAuthHeaders();
  const { user } = useCurrentUser();
  const { data: babies } = useBabies();

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedBabySections, setSelectedBabySections] = useState<Map<string, Set<Section>>>(new Map());
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [editingParent, setEditingParent] = useState<{ babyId: string; link: ParentLink } | null>(null);
  const [editSections, setEditSections] = useState<Set<Section>>(new Set());
  const [savingPermissions, setSavingPermissions] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  async function handlePhotoUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("file", {
      uri: asset.uri,
      name: asset.fileName ?? "photo.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as Blob);
    const res = await apiFetch("/user/photo", { method: "POST", body: formData });
    if (res.ok) {
      await mutate("/user/settings");
      toast("Photo updated!", "success");
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Upload failed", "error");
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    const res = await apiFetch("/user/settings", { method: "PATCH", body: JSON.stringify({ name }) });
    setSavingProfile(false);
    if (res.ok) {
      await mutate("/user/settings");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } else {
      toast("Failed to save profile", "error");
    }
  }

  function toggleBabyIncluded(id: string) {
    setSelectedBabySections((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, new Set());
      return next;
    });
  }

  function toggleBabySection(babyId: string, sections: Set<Section>) {
    setSelectedBabySections((prev) => new Map(prev).set(babyId, sections));
  }

  const ownedBabies = (babies as BabyWithParents[] | undefined)?.filter((baby) =>
    baby.parents.some((p) => p.userId === user?.id && p.role === "OWNER")
  ) ?? [];

  async function handleInvite() {
    if (selectedBabySections.size === 0) {
      toast("Select at least one baby to share", "error");
      return;
    }
    const babiesPayload = Array.from(selectedBabySections, ([babyId, sections]) => ({
      babyId,
      sections: Array.from(sections),
    }));
    if (babiesPayload.some((b) => b.sections.length === 0)) {
      toast("Choose at least one page to share for each selected baby", "error");
      return;
    }
    setInviteLoading(true);
    const res = await apiFetch("/invites", {
      method: "POST",
      body: JSON.stringify({ email: inviteEmail, babies: babiesPayload }),
    });
    setInviteLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Failed to send invite", "error");
      return;
    }
    toast(`Invite sent to ${inviteEmail}`, "success");
    setInviteEmail("");
    setSelectedBabySections(new Map());
  }

  function openEditPermissions(babyId: string, link: ParentLink) {
    setEditingParent({ babyId, link });
    setEditSections(new Set(link.sections));
  }

  async function handleSavePermissions() {
    if (!editingParent) return;
    if (editSections.size === 0) {
      toast("Choose at least one page to share", "error");
      return;
    }
    setSavingPermissions(true);
    const res = await apiFetch(`/babies/${editingParent.babyId}/parents/${editingParent.link.id}`, {
      method: "PATCH",
      body: JSON.stringify({ sections: Array.from(editSections) }),
    });
    setSavingPermissions(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Failed to update access", "error");
      return;
    }
    await mutate("/babies");
    toast("Access updated", "success");
    setEditingParent(null);
  }

  function handleRemoveParent(babyId: string, link: ParentLink) {
    const isSelf = link.userId === user?.id;
    Alert.alert(
      isSelf ? "Leave this baby?" : `Remove ${link.user.name ?? link.user.email}?`,
      isSelf ? "You'll lose access unless re-invited." : "They will lose access to this baby.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isSelf ? "Leave" : "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingId(link.id);
            const res = await apiFetch(`/babies/${babyId}/parents/${link.id}`, { method: "DELETE" });
            setRemovingId(null);
            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              toast(d.error ?? "Failed to remove", "error");
              return;
            }
            await mutate("/babies");
            toast(isSelf ? "You left this baby" : "Co-parent removed", "success");
          },
        },
      ]
    );
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    setSavingPassword(true);
    const res = await apiFetch("/user/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSavingPassword(false);
    if (res.ok) {
      toast("Password changed!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Failed to change password", "error");
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <Text style={[textStyles.pageTitle, { color: colors.foreground }]}>Settings</Text>

      {/* Theme */}
      <Card>
        <CardLabel>Theme</CardLabel>
        <ThemeSwitcher showLabels />
      </Card>

      {/* Profile */}
      <Card>
        <CardLabel>Profile</CardLabel>
        <View style={styles.profileRow}>
          <Pressable onPress={handlePhotoUpload}>
            <Avatar
              src={user?.profilePhoto ? filesUrl(user.profilePhoto) : undefined}
              headers={authHeaders}
              name={user?.name ?? user?.email}
              size={48}
            />
          </Pressable>
          <View style={styles.flex1}>
            <Label>Name</Label>
            <Input value={name} onChangeText={setName} placeholder="Your name" />
          </View>
        </View>
        <View style={styles.field}>
          <Label>Email</Label>
          <Input value={user?.email ?? ""} editable={false} style={styles.disabledInput} />
        </View>
        <View style={styles.profileActions}>
          <Button size="sm" loading={savingProfile} onPress={handleSaveProfile}>
            {profileSaved ? "Saved" : "Save profile"}
          </Button>
          <Pressable onPress={handlePhotoUpload}>
            <Text style={[styles.linkText, { color: colors.foreground + "66" }]}>Change photo</Text>
          </Pressable>
        </View>
      </Card>

      {/* Parents & invites */}
      <Card>
        <CardLabel>Parents & invites</CardLabel>
        {(babies as BabyWithParents[] | undefined)?.map((baby) => {
          if (!baby.parents.length) return null;
          const myLink = baby.parents.find((p) => p.userId === user?.id);
          const isOwner = myLink?.role === "OWNER";
          return (
            <View key={baby.id} style={styles.babyGroup}>
              <Text style={[styles.babyGroupName, { color: colors.foreground }]}>{baby.name}</Text>
              <View style={styles.parentList}>
                {baby.parents.map((link) => {
                  const canRemove = link.role !== "OWNER" && (isOwner || link.userId === user?.id);
                  const canEdit = link.role !== "OWNER" && isOwner;
                  return (
                    <View key={link.id} style={styles.parentRow}>
                      <Avatar name={link.user.name ?? link.user.email} size={32} />
                      <View style={styles.flex1}>
                        <Text style={[styles.parentName, { color: colors.foreground }]} numberOfLines={1}>
                          {link.user.name ?? link.user.email}
                        </Text>
                        {!!link.user.name && (
                          <Text style={[styles.parentEmail, { color: colors.foreground + "80" }]} numberOfLines={1}>
                            {link.user.email}
                          </Text>
                        )}
                        {link.role !== "OWNER" && (
                          <Text style={[styles.parentSections, { color: colors.foreground + "66" }]} numberOfLines={1}>
                            {sectionLabels(link.sections)}
                          </Text>
                        )}
                      </View>
                      {link.role === "OWNER" && <Badge variant="pink">Owner</Badge>}
                      {canEdit && (
                        <Button size="sm" variant="secondary" onPress={() => openEditPermissions(baby.id, link)}>
                          Edit access
                        </Button>
                      )}
                      {canRemove && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={removingId === link.id}
                          onPress={() => handleRemoveParent(baby.id, link)}
                        >
                          {link.userId === user?.id ? "Leave" : "Remove"}
                        </Button>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {ownedBabies.length > 0 ? (
          <View style={[styles.inviteForm, { borderColor: colors.pink[100] + "99" }]}>
            <View>
              <Label>Their email address</Label>
              <Input
                value={inviteEmail}
                onChangeText={setInviteEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="parent@example.com"
              />
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Share access to</Text>
              <View style={styles.inviteBabyList}>
                {ownedBabies.map((baby) => (
                  <View key={baby.id}>
                    <Pressable
                      onPress={() => toggleBabyIncluded(baby.id)}
                      style={[styles.inviteBabyRow, { backgroundColor: colors.pink[50] + "80" }]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: selectedBabySections.has(baby.id) ? colors.pink[500] : colors.pink[200],
                            backgroundColor: selectedBabySections.has(baby.id) ? colors.pink[500] : "transparent",
                          },
                        ]}
                      />
                      <Text style={[styles.inviteBabyName, { color: colors.foreground }]}>{baby.name}</Text>
                    </Pressable>
                    {selectedBabySections.has(baby.id) && (
                      <View style={styles.nestedPicker}>
                        <Text style={[styles.nestedPickerHint, { color: colors.foreground + "80" }]}>
                          Which pages can they see?
                        </Text>
                        <SectionPermissionsPicker
                          value={selectedBabySections.get(baby.id)!}
                          onChange={(sections) => toggleBabySection(baby.id, sections)}
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
            <Button size="sm" loading={inviteLoading} onPress={handleInvite}>
              Send invite email
            </Button>
          </View>
        ) : (
          babies &&
          babies.length > 0 && (
            <Text style={[styles.noOwnerText, { color: colors.foreground + "66", borderColor: colors.pink[100] + "99" }]}>
              Only a baby&apos;s owner can invite other parents to share access.
            </Text>
          )
        )}
      </Card>

      {/* Change password */}
      <Card>
        <CardLabel>Change password</CardLabel>
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          visible={showCurrentPw}
          onToggleVisible={() => setShowCurrentPw((v) => !v)}
          placeholder="Enter current password"
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          visible={showNewPw}
          onToggleVisible={() => setShowNewPw((v) => !v)}
          placeholder="Min 8 characters"
        />
        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          visible={showConfirmPw}
          onToggleVisible={() => setShowConfirmPw((v) => !v)}
          placeholder="Repeat new password"
        />
        {!!confirmPassword && newPassword !== confirmPassword && (
          <Text style={[styles.mismatchText, { color: fixedColors.red[500] }]}>Passwords do not match</Text>
        )}
        <Button size="sm" loading={savingPassword} onPress={handleChangePassword} style={styles.passwordSubmit}>
          Update password
        </Button>
      </Card>

      {/* Sign out */}
      <Card>
        <Pressable onPress={handleSignOut} style={styles.signOutRow}>
          <SignOutIcon color={fixedColors.red[500]} />
          <Text style={[styles.signOutText, { color: fixedColors.red[500] }]}>Sign out</Text>
        </Pressable>
      </Card>

      <Modal open={!!editingParent} onClose={() => setEditingParent(null)} title="Edit access">
        {editingParent && (
          <View style={styles.editAccessForm}>
            <Text style={[styles.editAccessHint, { color: colors.foreground + "99" }]}>
              Choose which pages {editingParent.link.user.name ?? editingParent.link.user.email} can see.
            </Text>
            <SectionPermissionsPicker value={editSections} onChange={setEditSections} />
            <Button loading={savingPermissions} onPress={handleSavePermissions} style={styles.editAccessSubmit}>
              Save
            </Button>
          </View>
        )}
      </Modal>
    </ScrollView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { borderColor: colors.pink[100] + "99" }]}>{children}</View>;
}

function CardLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.cardLabel, { color: colors.foreground + "66" }]}>{children}</Text>;
}

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisible,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <View style={styles.passwordWrap}>
        <Input
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder={placeholder}
          style={styles.passwordInput}
        />
        <Pressable onPress={onToggleVisible} style={styles.eyeButton} hitSlop={8}>
          {visible ? <EyeOffIcon color={colors.foreground + "4D"} /> : <EyeIcon color={colors.foreground + "4D"} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxWidth: 512, width: "100%", alignSelf: "center", padding: 16, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  flex1: { flex: 1 },
  field: {},
  fieldLabel: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  disabledInput: { opacity: 0.6 },
  profileActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  linkText: { fontSize: 14 },
  babyGroup: { gap: 8 },
  babyGroupName: { fontSize: 14, fontWeight: "500" },
  parentList: { gap: 10 },
  parentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  parentName: { fontSize: 14, fontWeight: "500" },
  parentEmail: { fontSize: 12 },
  parentSections: { fontSize: 12 },
  inviteForm: { gap: 12, paddingTop: 12, borderTopWidth: 1 },
  inviteBabyList: { gap: 12 },
  inviteBabyRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5 },
  inviteBabyName: { fontSize: 14, fontWeight: "500" },
  nestedPicker: { marginTop: 8, paddingLeft: 12, gap: 6 },
  nestedPickerHint: { fontSize: 12, marginBottom: 4 },
  noOwnerText: { fontSize: 14, paddingTop: 12, borderTopWidth: 1 },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 44 },
  eyeButton: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  mismatchText: { fontSize: 12, marginTop: -6 },
  passwordSubmit: { alignSelf: "flex-start" },
  signOutRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 4 },
  signOutText: { fontSize: 14, fontWeight: "500" },
  editAccessForm: { gap: 16, marginTop: 8 },
  editAccessHint: { fontSize: 14 },
  editAccessSubmit: { width: "100%" },
});
