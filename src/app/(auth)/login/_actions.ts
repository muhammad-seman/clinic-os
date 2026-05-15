"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/config";

export async function signInAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof AuthError) {
      const msg =
        e.type === "CredentialsSignin" ? "Email atau kata sandi salah" : "Login gagal";
      return { ok: false, error: msg };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Login gagal" };
  }
}
