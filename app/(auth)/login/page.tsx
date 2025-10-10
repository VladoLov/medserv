// app/(auth)/login/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // if already signed in, send to the right dashboard (optional)
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const role = session.user.role;
    redirect(
      role === "admin"
        ? "/admin/dashboard"
        : role === "technician"
        ? "/technician/dashboard"
        : "/client/dashboard"
    );
  }

  const sp = await searchParams; // ✅ Next 15 async API
  return <LoginForm nextParam={sp.next ?? ""} />;
}
