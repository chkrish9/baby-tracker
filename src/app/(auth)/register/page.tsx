"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const signInRes = await signIn("credentials", { email, password, rememberMe: "false", redirect: false });
    setLoading(false);
    if (!signInRes?.ok) { router.push("/login"); return; }
    sessionStorage.setItem("rm", "1");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Baby Tracker" width={72} height={72} className="mx-auto mb-2 rounded-2xl" />
          <h1 className="text-2xl font-bold text-foreground">Baby Tracker</h1>
          <p className="text-sm text-pink-500 mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <div>
            <Label htmlFor="name">Name (optional)</Label>
            <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="Min 8 characters" minLength={8} />
          </div>
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>
        <p className="text-center text-sm text-pink-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-pink-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
