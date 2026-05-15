import "server-only";
import { listBookings as repoList, getBookingCounts } from "@/server/repositories/booking.repo";
import { bookingFilterSchema, type BookingFilter } from "@/lib/validation/booking";

export async function listBookings(input: Partial<BookingFilter>) {
  const f = bookingFilterSchema.parse(input);
  const [list, counts] = await Promise.all([
    repoList(f),
    // Only return counts on the first page; tabs are filter-agnostic by search only.
    f.cursor ? Promise.resolve(null) : getBookingCounts(f.q),
  ]);
  return { ...list, counts };
}

export type BookingListResult = Awaited<ReturnType<typeof listBookings>>;
export type BookingListItem = BookingListResult["items"][number];
