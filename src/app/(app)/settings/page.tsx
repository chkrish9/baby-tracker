"use client";
import { useRef, useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useToast } from "@/components/ui/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data: user } = useSWR("/api/user/settings", fetcher);
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    const res = await fetch("/api/user/photo", { method: "POST", body: formData });
    if (res.ok) { await mutate("/api/user/settings"); toast("Profile photo updated!", "success"); }
    else { const d = await res.json().catch(() => ({})); toast(d.error ?? "Upload failed", "error"); }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await fetch("/api/user/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSavingProfile(false);
    if (res.ok) { await mutate("/api/user/settings"); toast("Profile saved!", "success"); }
    else toast("Failed to save profile", "error");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast("Passwords do not match", "error"); return; }
    setSavingPassword(true);
    const res = await fetch("/api/user/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    setSavingPassword(false);
    if (res.ok) {
      toast("Password changed!", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      const d = await res.json().catch(() => ({}));
      toast(d.error ?? "Failed to change password", "error");
    }
  }

  const photoSrc = user?.profilePhoto ? `/api/files/${user.profilePhoto}` : undefined;

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Settings" />
      <div className="px-4 space-y-4 pb-8">

        {/* Profile photo */}
        <Card>
          <CardTitle className="mb-4">Profile photo</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => photoInputRef.current?.click()}>
              <Avatar src={photoSrc} name={user?.name ?? user?.email} size={72} />
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-lg">📷</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">Click to upload</p>
              <p className="text-xs text-foreground/50 mt-0.5">JPG, PNG, WEBP · max 5 MB</p>
            </div>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
        </Card>

        {/* Appearance */}
        <Card>
          <CardTitle className="mb-4">Appearance</CardTitle>
          <ThemeSwitcher showLabels />
        </Card>

        {/* Profile */}
        <Card>
          <CardTitle className="mb-4">Profile</CardTitle>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
            </div>
            <Button type="submit" loading={savingProfile} size="sm">Save profile</Button>
          </form>
        </Card>

        {/* Security */}
        <Card>
          <CardTitle className="mb-4">Change password</CardTitle>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <Label htmlFor="cur-pw">Current password</Label>
              <Input id="cur-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <div>
              <Label htmlFor="new-pw">New password</Label>
              <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div>
              <Label htmlFor="conf-pw">Confirm new password</Label>
              <Input id="conf-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <Button type="submit" loading={savingPassword} size="sm">Change password</Button>
          </form>
        </Card>

      </div>
    </div>
  );
}
