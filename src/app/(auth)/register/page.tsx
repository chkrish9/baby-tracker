"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", { email, password, rememberMe: String(rememberMe), redirect: false });
    setLoading(false);
    if (!signInRes?.ok) { router.push("/login"); return; }
    localStorage.removeItem("rm");
    sessionStorage.removeItem("rm");
    (rememberMe ? localStorage : sessionStorage).setItem("rm", "1");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Little Notes" width={80} height={80} className="mx-auto mb-4 rounded-3xl" />
          <h1 className="text-3xl font-bold text-foreground font-serif">Little Notes</h1>
          <p className="text-sm text-foreground/50 mt-1.5">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-pink-100/60 p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Name (optional)</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="Min 8 characters" minLength={8} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/70 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-pink-500"
            />
            Remember me
          </label>
          <Button type="submit" loading={loading} className="w-full !py-3 !text-base">Create account</Button>
        </form>

        <p className="text-center text-sm text-foreground/50 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
