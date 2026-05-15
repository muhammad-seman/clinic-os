import type { NextAuthConfig } from "next-auth";

export const edgeAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sid = (user as { sid?: string }).sid;
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      (session as { sid?: string | undefined }).sid = (token.sid as string | undefined) ?? undefined;
      if (session.user && token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
};
