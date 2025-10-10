"use client";

import { authClient } from "../../lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import type { ButtonProps } from "../../components/ui/button";

export default function ClientSignOutBtn({ children, ...props }: ButtonProps) {
  const router = useRouter();

  return (
    <Button
      {...props}
      onClick={async (e) => {
        // omogući da vanjski onClick i dalje radi, ako ga neko proslijedi
        props.onClick?.(e);
        await authClient.signOut();
        router.refresh();
      }}
    >
      {children}
    </Button>
  );
}
