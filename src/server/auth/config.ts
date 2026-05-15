import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { edgeAuthConfig } from "./edge-config";
import { verifyCredentials } from "./credentials";

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...edgeAuthConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credSchema.safeParse(raw);
        if (!parsed.success) return null;
        return await verifyCredentials(parsed.data.email, parsed.data.password);
      },
    }),
  ],
});
