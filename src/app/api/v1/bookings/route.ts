import { listBookings } from "@/server/services/booking/list";
import { assert } from "@/server/auth/rbac";

export async function GET(req: Request) {
  await assert("bookings.view");
  const url = new URL(req.url);
  const data = await listBookings({
    q: url.searchParams.get("q") ?? undefined,
    status: (url.searchParams.get("status") ?? undefined) as never,
    cursor: url.searchParams.get("cursor"),
    limit: Number(url.searchParams.get("limit") ?? 30),
  });
  return Response.json(data, {
    headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
  });
}
