import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "client", // "admin" | "technician" | "client"
        input: false,
      },
    },
    // omogućimo jednostavan e-mail+password tok
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(), // automatsko setovanje cookie-ja iz Server Actions
  ],
  // (opciono) session/cookie podešavanja možeš naknadno dotjerati
});
