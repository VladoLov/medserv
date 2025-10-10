"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../lib/auth-client";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setErr("Sva polja su obavezna");
      return;
    }
    if (form.password.length < 8) {
      setErr("Lozinka mora imati najmanje 8 znakova");
      return;
    }

    const { error } = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
    });

    if (error) {
      setErr(error.message ?? "Sign up failed");
      return;
    }
    setOk("Korisnik kreiran. Preusmjeravanje…");
    router.push("/login");
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Registracija</h1>
          <p className="text-sm text-muted-foreground">Kreirajte svoj nalog</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Ime i prezime</Label>
            <Input
              placeholder="npr. Marko Marković"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@hospital.com"
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {ok && <p className="text-sm text-green-600">{ok}</p>}
          <Button type="submit" className="w-full">
            Kreiraj nalog
          </Button>
        </form>
      </Card>
    </div>
  );
}
