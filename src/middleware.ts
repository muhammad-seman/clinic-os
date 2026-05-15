import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/server/auth/edge-config";

const { auth } = NextAuth(edgeAuthConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/auth")) return;
  if (path === "/login" || path === "/2fa" || path === "/forgot") return;
  if (!req.auth) return Response.redirect(new URL("/login", req.url));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
