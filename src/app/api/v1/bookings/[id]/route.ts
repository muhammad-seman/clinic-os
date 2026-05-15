import { getBooking } from "@/server/repositories/booking.repo";
import { assert } from "@/server/auth/rbac";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await assert("bookings.view");
  const { id } = await params;
  const row = await getBooking(id);
  if (!row) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(row, {
    headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
  });
}
