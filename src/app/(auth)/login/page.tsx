"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, rememberMe: "true", redirect: false });
    setLoading(false);
    if (!res?.ok) { setError("Invalid email or password"); return; }
    localStorage.setItem("rm", "1");
    router.push(callbackUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-pink-100/60 p-6 space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Your password"
        />
      </div>

      <Button type="submit" loading={loading} className="w-full !py-3 !text-base !rounded-2xl">
        Sign in
      </Button>

    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Little Notes" width={80} height={80} className="mx-auto mb-4 rounded-3xl" />
          <h1 className="text-3xl font-bold text-foreground font-serif">Little Notes</h1>
          <p className="text-sm text-foreground/50 mt-1.5">Gentle tracking for your little one</p>
        </div>

        <Suspense fallback={<div className="bg-white rounded-3xl shadow-sm border border-pink-100/60 p-6 h-52" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-foreground/50 mt-5">
          New here?{" "}
          <Link href="/register" className="font-semibold text-foreground hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
