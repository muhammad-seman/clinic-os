import { assert } from "@/server/auth/rbac";
import { listServiceOptions, listDoctorOptions } from "@/server/repositories/options.repo";

export async function GET() {
  await assert("bookings.view");
  const [serviceList, doctorList] = await Promise.all([listServiceOptions(), listDoctorOptions()]);
  return Response.json({ services: serviceList, doctors: doctorList });
}
