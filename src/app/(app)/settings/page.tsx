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

  async function handleSignOut() {
    localStorage.removeItem("rm");
    sessionStorage.removeItem("rm");
    await signOut({ redirect: false });
    router.replace("/login");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
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
          <div className="flex items-center gap-3">
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
