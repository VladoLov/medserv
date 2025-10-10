"use client";

import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../components/ui/dropdown-menu";

type Props = {
  isAuth: boolean;
  role?: "admin" | "technician" | "client";
  name?: string | null;
  email?: string | null;
};

export default function ClientUserMenu({ isAuth, role, name, email }: Props) {
  const router = useRouter();

  if (!isAuth) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push("/login")}>
          Sign in
        </Button>
        <Button onClick={() => router.push("/register")}>Register</Button>
      </div>
    );
  }

  const gotoDashboard = () => {
    if (role === "admin") router.push("/admin/dashboard");
    else if (role === "technician") router.push("/technician/dashboard");
    else router.push("/client/dashboard");
  };

  const signOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  const initials = (
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("") ||
    email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm">{name || email}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{name || "User"}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {role}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={gotoDashboard}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-red-600">
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
