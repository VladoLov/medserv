import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient();
export const { signIn, signUp, useSession, signOut } = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
