import "server-only";
import { listBookings as repoList } from "@/server/repositories/booking.repo";
import { bookingFilterSchema, type BookingFilter } from "@/lib/validation/booking";

export async function listBookings(input: Partial<BookingFilter>) {
  const f = bookingFilterSchema.parse(input);
  return repoList(f);
}

export type BookingListResult = Awaited<ReturnType<typeof listBookings>>;
export type BookingListItem = BookingListResult["items"][number];
