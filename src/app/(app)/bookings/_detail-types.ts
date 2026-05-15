export type BookingStatus = "scheduled" | "in_progress" | "done" | "cancelled" | "no_show";
export type Payment = "unpaid" | "dp" | "termin" | "paid";

export type Assignment = {
  roleId: string;
  roleLabel: string;
  roleSlug: string;
  employeeId: string;
  employeeName: string;
  employeeType: string;
  feeCents: string;
};

export type BookingDetail = {
  id: string;
  code: string;
  clientName: string;
  clientPhone: string | null;
  scheduledAt: string;
  status: BookingStatus;
  payment: Payment;
  paidCents: string;
  remainingCents: string;
  notes: string | null;
  serviceId: string | null;
  packageId: string | null;
  doctorId: string | null;
  serviceName: string | null;
  packageName: string | null;
  doctorName: string | null;
  priceCents: string;
  assignments: Assignment[];
};

export type RefRole = { id: string; slug: string; label: string; forType: "doctor" | "staff" };
export type RefEmployee = { id: string; name: string; type: string; active: boolean };
export type PaymentRow = {
  id: string;
  amountCents: string;
  method: "cash" | "transfer" | "qris" | "lainnya";
  note: string | null;
  paidAt: string;
};
export type ApiResponse = {
  booking: BookingDetail;
  refRoles: RefRole[];
  refEmployees: RefEmployee[];
  payments: PaymentRow[];
};

export type DetailTab = "ringkasan" | "eksekusi" | "pembayaran";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  scheduled: "Terjadwal",
  in_progress: "Berlangsung",
  done: "Selesai",
  cancelled: "Batal",
  no_show: "Tidak Hadir",
};

export const fmtDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Makassar",
});

export function statusPill(s: BookingStatus): string {
  return s === "done"
    ? "lunas"
    : s === "in_progress"
      ? "in-progress"
      : s === "cancelled"
        ? "dp"
        : s === "no_show"
          ? "outline"
          : "scheduled";
}

export const detailFetcher = async (url: string): Promise<ApiResponse> => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};
