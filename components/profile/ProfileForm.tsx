"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  updateAccount,
  updateClientProfileAction,
  updateTechnicianProfileAction,
} from "@/app/profile/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type BaseUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "technician" | "client";
};

export default function ProfileForm({
  user,
  clientInfo,
  techInfo,
}: {
  user: BaseUser;
  clientInfo?: {
    clientId: string;
    clientName: string;
    org?: string | null;
    address?: string | null;
    contactEmail?: string | null;
  } | null;
  techInfo?: { phone?: string | null; region?: string | null } | null;
}) {
  /* ——— Account ——— */
  const AccountSchema = z.object({ name: z.string().min(2) });
  const accountForm = useForm<z.infer<typeof AccountSchema>>({
    resolver: zodResolver(AccountSchema),
    defaultValues: { name: user.name ?? "" },
  });
  const [accountMsg, setAccountMsg] = useState<string>("");

  async function onSaveAccount(values: z.infer<typeof AccountSchema>) {
    await updateAccount(values);
    setAccountMsg("Saved.");
    setTimeout(() => setAccountMsg(""), 1500);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Role</div>
          <Badge variant="secondary" className="capitalize">
            {user.role}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">{user.email}</div>
      </div>

      <Separator />

      {/* Account section */}
      <section className="space-y-3">
        <h2 className="text-base font-medium">Account</h2>
        <form
          className="grid gap-3 max-w-md"
          onSubmit={accountForm.handleSubmit(onSaveAccount)}
        >
          <div className="space-y-1">
            <Label>Name</Label>
            <Input {...accountForm.register("name")} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user.email} readOnly />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
            >
              Save
            </Button>
            {accountMsg && (
              <span className="text-sm text-green-600">{accountMsg}</span>
            )}
          </div>
        </form>
      </section>

      {/* Client section */}
      {user.role === "client" && (
        <>
          <Separator />
          <ClientSection clientInfo={clientInfo ?? null} />
        </>
      )}

      {/* Technician section */}
      {user.role === "technician" && (
        <>
          <Separator />
          <TechSection techInfo={techInfo ?? null} />
        </>
      )}
    </div>
  );
}

/* ——— Client Profile subform ——— */
function ClientSection({
  clientInfo,
}: {
  clientInfo: {
    clientId: string;
    clientName: string;
    org?: string | null;
    address?: string | null;
    contactEmail?: string | null;
  } | null;
}) {
  const Schema = z.object({
    organizationName: z.string().min(2, "Organization is required"),
    address: z.string().optional(),
    contactEmail: z
      .string()
      .email("Invalid email")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  });
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      organizationName: clientInfo?.org ?? clientInfo?.clientName ?? "",
      address: clientInfo?.address ?? "",
      contactEmail: clientInfo?.contactEmail ?? "",
    },
  });
  const [msg, setMsg] = useState("");

  if (!clientInfo) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-medium">Client</h2>
        <p className="text-sm text-muted-foreground">
          Your account is not linked to a client yet.
        </p>
      </section>
    );
  }

  async function onSubmit(values: z.infer<typeof Schema>) {
    await updateClientProfileAction(values);
    setMsg("Saved.");
    setTimeout(() => setMsg(""), 1500);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Client</h2>
      <div className="text-sm text-muted-foreground">
        Linked to: <b>{clientInfo.clientName}</b>
      </div>
      <form
        className="grid gap-3 max-w-lg"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-1">
          <Label>Organization name</Label>
          <Input {...form.register("organizationName")} />
          {form.formState.errors.organizationName && (
            <p className="text-xs text-red-600">
              {String(form.formState.errors.organizationName.message)}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Address</Label>
          <Input {...form.register("address")} />
        </div>
        <div className="space-y-1">
          <Label>Contact email</Label>
          <Input type="email" {...form.register("contactEmail")} />
          {form.formState.errors.contactEmail && (
            <p className="text-xs text-red-600">
              {String(form.formState.errors.contactEmail.message)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-primary text-primary-foreground">
            Save
          </Button>
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
      </form>
    </section>
  );
}

/* ——— Technician Profile subform ——— */
function TechSection({
  techInfo,
}: {
  techInfo: { phone?: string | null; region?: string | null } | null;
}) {
  const Schema = z.object({
    phone: z.string().optional(),
    region: z.string().optional(),
  });
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      phone: techInfo?.phone ?? "",
      region: techInfo?.region ?? "",
    },
  });
  const [msg, setMsg] = useState("");

  async function onSubmit(values: z.infer<typeof Schema>) {
    await updateTechnicianProfileAction(values);
    setMsg("Saved.");
    setTimeout(() => setMsg(""), 1500);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Technician</h2>
      <form
        className="grid gap-3 max-w-lg"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input {...form.register("phone")} />
        </div>
        <div className="space-y-1">
          <Label>Region</Label>
          <Input {...form.register("region")} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="bg-primary text-primary-foreground">
            Save
          </Button>
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
      </form>
    </section>
  );
}
