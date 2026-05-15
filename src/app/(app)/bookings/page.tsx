import { assert } from "@/server/auth/rbac";
import { listBookings } from "@/server/services/booking/list";
import { getOperatingHours } from "@/server/services/system-config";
import { Topbar } from "@/components/shell/topbar";
import { PAGE_META } from "@/components/shell/nav";
import { BookingsList } from "./_list.client";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await assert("bookings.view");
  const sp = await searchParams;
  const [initial, hours] = await Promise.all([
    listBookings({
      q: sp.q,
      status: sp.status as never,
      cursor: null,
      limit: 30,
    }),
    getOperatingHours(),
  ]);
  const meta = PAGE_META.bookings ?? { title: "Booking", crumb: "Operasional" };
  return (
    <>
      <Topbar title={meta.title} crumb={meta.crumb} />
      <BookingsList
        initialData={initial}
        q={sp.q ?? ""}
        status={sp.status ?? ""}
        hours={hours}
      />
    </>
  );
}
