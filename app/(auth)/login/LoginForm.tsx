// app/(auth)/login/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm({ nextParam = "" }: { nextParam?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await authClient.signIn.email({ email, password });
    if (error) return setErr(error.message ?? "Login failed");

    const s = await authClient.getSession();
    if (!s.error) {
      const role = s.data?.user.role ?? "client";
      if (nextParam) router.push(nextParam);
      else if (role === "admin") router.push("/admin/dashboard");
      else if (role === "technician") router.push("/technician/dashboard");
      else router.push("/client/dashboard");
    }
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Access your account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@hospital.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Don’t have an account?{" "}
          <button
            className="underline"
            onClick={() => router.push("/register")}
          >
            Register
          </button>
        </p>
      </Card>
    </div>
  );
}
