"use client";
import { useRef, useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, logout } from "@/lib/api-client";
import { SECTIONS, type Section } from "@/lib/sections";
import { SectionPermissionsPicker } from "@/components/invite/SectionPermissionsPicker";

const fetcher = (url: string) => apiFetch(url).then((r) => r.json());

interface ParentLink { id: string; userId: string; role: "OWNER" | "PARENT"; sections: Section[]; user: { id: string; name: string | null; email: string }; }
interface BabyWithParents { id: string; name: string; parents: ParentLink[]; }

function sectionLabels(sections: Section[]) {
  return SECTIONS.filter((s) => sections.includes(s.key)).map((s) => s.label).join(", ") || "No pages shared";
}

export default function SettingsPage() {
  const { data: user } = useSWR("/api/user/settings", fetcher);
  const session = user ? { user } : null;
  const { data: babies } = useSWR<BabyWithParents[]>("/api/babies", fetcher);
  const { toast } = useToast();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    const res = await apiFetch("/api/user/photo", { method: "POST", body: formData });
    if (res.ok) { await mutate("/api/user/settings"); toast("Photo updated!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await apiFetch("/api/user/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSavingProfile(false);
    if (res.ok) {
      await mutate("/api/user/settings");
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

  const ownedBabies = babies?.filter((baby) => baby.parents.some((p) => p.userId === session?.user?.id && p.role === "OWNER")) ?? [];

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (selectedBabySections.size === 0) { toast("Select at least one baby to share", "error"); return; }
    const babiesPayload = Array.from(selectedBabySections, ([babyId, sections]) => ({ babyId, sections: Array.from(sections) }));
    if (babiesPayload.some((b) => b.sections.length === 0)) { toast("Choose at least one page to share for each selected baby", "error"); return; }
    setInviteLoading(true);
    const res = await apiFetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, babies: babiesPayload }),
    });
    setInviteLoading(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to send invite", "error"); return; }
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
    if (editSections.size === 0) { toast("Choose at least one page to share", "error"); return; }
    setSavingPermissions(true);
    const res = await apiFetch(`/api/babies/${editingParent.babyId}/parents/${editingParent.link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: Array.from(editSections) }),
    });
    setSavingPermissions(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to update access", "error"); return; }
    await mutate("/api/babies");
    toast("Access updated", "success");
    setEditingParent(null);
  }

  async function handleRemoveParent(babyId: string, link: ParentLink) {
    const isSelf = link.userId === session?.user?.id;
    const confirmed = window.confirm(
      isSelf ? "Leave this baby? You'll lose access unless re-invited." : `Remove ${link.user.name ?? link.user.email} from this baby?`
    );
    if (!confirmed) return;

    setRemovingId(link.id);
    const res = await apiFetch(`/api/babies/${babyId}/parents/${link.id}`, { method: "DELETE" });
    setRemovingId(null);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to remove", "error"); return; }
    await mutate("/api/babies");
    toast(isSelf ? "You left this baby" : "Co-parent removed", "success");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    setSavingPassword(true);
    const res = await apiFetch("/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    await logout();
    router.replace("/login");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-8">
      <h1 className="text-2xl font-bold text-foreground font-serif mb-5">Settings</h1>

      {/* Theme */}
      <div className="bg-white rounded-2xl border border-pink-100/60 p-4 mb-3">
        <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-4">Theme</p>
        <ThemeSwitcher showLabels />
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-pink-100/60 p-4 mb-3">
        <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-4">Profile</p>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <Input value={user?.email ?? session?.user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" loading={savingProfile} size="sm" className={profileSaved ? "!bg-green-600" : ""}>
              {profileSaved ? "Saved" : "Save profile"}
            </Button>
            <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors">
              Change photo
            </button>
          </div>
        </form>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
      </div>

      {/* Parents & invites */}
      <div className="bg-white rounded-2xl border border-pink-100/60 p-4 mb-3">
        <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-4">Parents & invites</p>

        {babies?.map((baby) => {
          if (!baby.parents.length) return null;
          const myLink = baby.parents.find((p) => p.userId === session?.user?.id);
          const isOwner = myLink?.role === "OWNER";
          return (
            <div key={baby.id} className="mb-4 last:mb-0">
              <p className="text-sm font-medium text-foreground mb-2">{baby.name}</p>
              <div className="space-y-2.5">
                {baby.parents.map((link) => {
                  const canRemove = link.role !== "OWNER" && (isOwner || link.userId === session?.user?.id);
                  const canEdit = link.role !== "OWNER" && isOwner;
                  return (
                    <div key={link.id} className="flex items-center gap-3">
                      <Avatar name={link.user.name ?? link.user.email} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{link.user.name ?? link.user.email}</p>
                        {link.user.name && <p className="text-xs text-foreground/50 truncate">{link.user.email}</p>}
                        {link.role !== "OWNER" && <p className="text-xs text-foreground/40 truncate">{sectionLabels(link.sections)}</p>}
                      </div>
                      {link.role === "OWNER" && <Badge variant="pink">Owner</Badge>}
                      {canEdit && (
                        <Button size="sm" variant="secondary" onClick={() => openEditPermissions(baby.id, link)}>
                          Edit access
                        </Button>
                      )}
                      {canRemove && (
                        <Button size="sm" variant="danger" loading={removingId === link.id} onClick={() => handleRemoveParent(baby.id, link)}>
                          {link.userId === session?.user?.id ? "Leave" : "Remove"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {ownedBabies.length > 0 ? (
          <form onSubmit={handleInvite} className="space-y-3 pt-1 border-t border-pink-100/60 mt-1">
            <div className="pt-3">
              <label className="text-sm font-medium text-foreground block mb-1.5">Their email address</label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="parent@example.com" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Share access to</p>
              <div className="space-y-3">
                {ownedBabies.map((baby) => (
                  <div key={baby.id}>
                    <label className="flex items-center gap-3 bg-pink-50/50 hover:bg-pink-50 rounded-2xl p-3 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedBabySections.has(baby.id)}
                        onChange={() => toggleBabyIncluded(baby.id)}
                        className="w-4 h-4 rounded accent-pink-500 flex-shrink-0"
                      />
                      <span className="text-sm font-medium text-foreground">{baby.name}</span>
                    </label>
                    {selectedBabySections.has(baby.id) && (
                      <div className="mt-2 pl-3">
                        <p className="text-xs text-foreground/50 mb-1.5">Which pages can they see?</p>
                        <SectionPermissionsPicker
                          value={selectedBabySections.get(baby.id)!}
                          onChange={(sections) => toggleBabySection(baby.id, sections)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" loading={inviteLoading} size="sm">Send invite email</Button>
          </form>
        ) : (
          babies && babies.length > 0 && (
            <p className="text-sm text-foreground/40 pt-3 border-t border-pink-100/60 mt-1">
              Only a baby&apos;s owner can invite other parents to share access.
            </p>
          )
        )}
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-pink-100/60 p-4 mb-3">
        <p className="text-xs font-semibold text-foreground/40 tracking-widest uppercase mb-4">Change password</p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Current password</label>
            <div className="relative">
              <Input
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter current password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
              >
                {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">New password</label>
            <div className="relative">
              <Input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min 8 characters"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
              >
                {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Confirm new password</label>
            <div className="relative">
              <Input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
              >
                {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
            )}
          </div>

          <div className="pt-1">
            <Button type="submit" loading={savingPassword} size="sm">
              Update password
            </Button>
          </div>
        </form>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-pink-100/60 p-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 font-medium text-sm transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 8H3M7 5l-3 3 3 3M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3" />
          </svg>
          Sign out
        </button>
      </div>

      <Modal open={!!editingParent} onClose={() => setEditingParent(null)} title="Edit access">
        {editingParent && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-foreground/60">
              Choose which pages {editingParent.link.user.name ?? editingParent.link.user.email} can see.
            </p>
            <SectionPermissionsPicker value={editSections} onChange={setEditSections} />
            <Button loading={savingPermissions} onClick={handleSavePermissions} className="w-full">
              Save
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2l12 12M6.7 6.7A2 2 0 0010 10M9.4 9.4A2 2 0 016 8c0-.4.1-.8.3-1.1M4.2 4.2C2.4 5.3 1 8 1 8s2.5 5 7 5c1.5 0 2.9-.5 4-1.2M12.5 12.5C14 11.4 15 8 15 8s-2.5-5-7-5c-.9 0-1.8.2-2.6.5" />
    </svg>
  );
}
