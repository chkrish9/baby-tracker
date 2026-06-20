"use client";
import { useRef, useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useToast } from "@/components/ui/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data: user } = useSWR("/api/user/settings", fetcher);
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

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
    const res = await fetch("/api/user/photo", { method: "POST", body: formData });
    if (res.ok) { await mutate("/api/user/settings"); toast("Photo updated!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await fetch("/api/user/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSavingProfile(false);
    if (res.ok) {
      await mutate("/api/user/settings");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } else {
      toast("Failed to save profile", "error");
    }
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
    const res = await fetch("/api/user/password", {
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
    localStorage.removeItem("rm");
    sessionStorage.removeItem("rm");
    await signOut({ redirect: false });
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
