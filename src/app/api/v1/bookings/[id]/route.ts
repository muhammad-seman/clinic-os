import {
  getBookingDetail,
  listAllRoles,
  listEmployeesForAssign,
  listBookingPayments,
} from "@/server/repositories/booking.repo";
import { assert } from "@/server/auth/rbac";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await assert("bookings.view");
  const { id } = await params;
  const row = await getBookingDetail(id);
  if (!row) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const [refRoles, refEmployees, payments] = await Promise.all([
    listAllRoles(),
    listEmployeesForAssign(),
    listBookingPayments(id),
  ]);
  return Response.json(
    { booking: row, refRoles, refEmployees, payments },
    { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } },
  );
}
