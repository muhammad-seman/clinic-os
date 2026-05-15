import { searchClients } from "@/server/repositories/client.repo";
import { assert } from "@/server/auth/rbac";

export async function GET(req: Request) {
  await assert("bookings.view");
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const rows = await searchClients(q, limit);
  return Response.json({ items: rows });
}
