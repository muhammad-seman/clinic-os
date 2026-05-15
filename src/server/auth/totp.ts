import "server-only";
import { authenticator } from "otplib";

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTotp(secret: string, token: string): boolean {
  return authenticator.check(token, secret);
}

export function totpUri(label: string, issuer: string, secret: string): string {
  return authenticator.keyuri(label, issuer, secret);
}
