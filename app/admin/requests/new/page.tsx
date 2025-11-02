// app/admin/requests/new/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadNewRequestData } from "../actions";
import NewRequestForm from "./NewRequestForm";

export const revalidate = 0;

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; deviceId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/unauthorized");

  const sp = await searchParams;
  const { clientList, deviceList, techList } = await loadNewRequestData();

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-semibold">Create Service Request</h1>
      <NewRequestForm
        clientList={clientList}
        deviceList={deviceList}
        techList={techList}
        initialClientId={sp.clientId ?? ""}
        initialDeviceId={sp.deviceId ?? ""}
      />
    </div>
  );
}
