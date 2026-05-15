import "server-only";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { attendance, employees } from "@/server/db/schema";
import { log as audit } from "@/server/auth/audit";
import { getClinicConfig, type ClinicConfig } from "@/server/services/system-config";

export type AttendanceRow = {
  id: string;
  empId: string;
  empName: string;
  empType: string;
  recordedAt: string;
  lat: number;
  lng: number;
  distance: number;
  inRange: boolean;
};

export type EmployeeRow = {
  id: string;
  name: string;
  type: string;
  active: boolean;
};

export type AttendanceOverview = {
  clinic: ClinicConfig;
  history: AttendanceRow[];
  today: AttendanceRow[];
  employees: EmployeeRow[];
};

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

export async function fetchAttendanceOverview(): Promise<AttendanceOverview> {
  const clinic = await getClinicConfig();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const emps = await db
    .select({
      id: employees.id,
      name: employees.name,
      type: employees.type,
      active: employees.active,
    })
    .from(employees)
    .orderBy(asc(employees.name));

  const rows = await db
    .select({
      id: attendance.id,
      empId: attendance.employeeId,
      empName: employees.name,
      empType: employees.type,
      recordedAt: attendance.recordedAt,
      lat: attendance.lat,
      lng: attendance.lng,
      distance: attendance.distanceM,
      inRange: attendance.inRange,
    })
    .from(attendance)
    .innerJoin(employees, eq(employees.id, attendance.employeeId))
    .orderBy(desc(attendance.recordedAt))
    .limit(50);

  const history = rows.map((r) => ({ ...r, recordedAt: r.recordedAt.toISOString() }));
  const today = history.filter((r) => {
    const d = new Date(r.recordedAt);
    return d >= startOfDay && d < startOfTomorrow;
  });

  return { clinic, history, today, employees: emps };
}

export async function recordAttendance(
  actorId: string,
  input: { employeeId: string; lat: number; lng: number },
) {
  const clinic = await getClinicConfig();
  const dist = haversine(clinic.lat, clinic.lng, input.lat, input.lng);
  const inRange = dist <= clinic.radius;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const existing = await db
    .select({ id: attendance.id })
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, input.employeeId),
        gte(attendance.recordedAt, startOfDay),
        lt(attendance.recordedAt, startOfTomorrow),
      ),
    )
    .limit(1);

  if (existing.length) {
    await audit({
      actorId,
      action: "attendance.duplicate",
      target: input.employeeId,
      result: "fail",
    });
    throw new Error("Karyawan ini sudah absen hari ini");
  }
  if (!inRange) {
    await audit({
      actorId,
      action: "attendance.out_of_range",
      target: input.employeeId,
      result: "denied",
      meta: { distance: dist, radius: clinic.radius },
    });
    throw new Error("Di luar radius klinik");
  }

  const [row] = await db
    .insert(attendance)
    .values({
      employeeId: input.employeeId,
      lat: input.lat,
      lng: input.lng,
      distanceM: dist,
      inRange,
    })
    .returning();

  await audit({
    actorId,
    action: "attendance.record",
    target: input.employeeId,
    result: "ok",
    meta: { distance: dist },
  });
  return row;
}
