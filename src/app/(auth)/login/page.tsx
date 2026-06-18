"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, rememberMe: String(rememberMe), redirect: false });
    setLoading(false);
    if (!res?.ok) { setError("Invalid email or password"); return; }
    if (rememberMe) localStorage.setItem("rm", "1");
    else sessionStorage.setItem("rm", "1");
    router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Baby Tracker" width={72} height={72} className="mx-auto mb-2 rounded-2xl" />
          <h1 className="text-2xl font-bold text-foreground">Baby Tracker</h1>
          <p className="text-sm text-pink-500 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
          </div>
          <div className="flex items-center gap-2">
            <input id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-pink-300 text-pink-400 focus:ring-pink-200" />
            <label htmlFor="remember" className="text-sm text-foreground">Remember me</label>
          </div>
          <Button type="submit" loading={loading} className="w-full">Sign in</Button>
        </form>
        <p className="text-center text-sm text-pink-500 mt-4">
          No account?{" "}
          <Link href="/register" className="font-medium text-pink-600 hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
