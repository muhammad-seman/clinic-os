import "server-only";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { attendance, roles, rolePermissions, users } from "@/server/db/schema";
import { log as audit } from "@/server/auth/audit";
import { getClinicConfig, type ClinicConfig } from "@/server/services/system-config";

export type AttendanceRow = {
  id: string;
  userId: string;
  userName: string;
  roleSlug: string | null;
  roleLabel: string | null;
  recordedAt: string;
  lat: number;
  lng: number;
  distance: number;
  inRange: boolean;
};

export type UserRow = {
  id: string;
  name: string;
  roleSlug: string;
  roleLabel: string;
  status: string;
};

export type AttendanceOverview = {
  clinic: ClinicConfig;
  history: AttendanceRow[];
  today: AttendanceRow[];
  users: UserRow[];
  meId: string | null;
  meName: string | null;
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

export async function fetchAttendanceOverview(meId: string | null): Promise<AttendanceOverview> {
  const clinic = await getClinicConfig();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // Hanya user dengan permission attendance.create yang dianggap "wajib absen".
  // Ambil semua user aktif yang role-nya punya izin tsb.
  const attendanceUsers = await db
    .selectDistinct({
      id: users.id,
      name: users.name,
      status: users.status,
      roleSlug: roles.slug,
      roleLabel: roles.label,
    })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .where(
      and(
        eq(rolePermissions.permissionKey, "attendance.create"),
        eq(users.status, "active"),
      ),
    )
    .orderBy(asc(users.name));

  const rows = await db
    .select({
      id: attendance.id,
      userId: attendance.userId,
      userName: users.name,
      roleSlug: roles.slug,
      roleLabel: roles.label,
      recordedAt: attendance.recordedAt,
      lat: attendance.lat,
      lng: attendance.lng,
      distance: attendance.distanceM,
      inRange: attendance.inRange,
    })
    .from(attendance)
    .innerJoin(users, eq(users.id, attendance.userId))
    .leftJoin(roles, eq(roles.id, users.roleId))
    .orderBy(desc(attendance.recordedAt))
    .limit(100);

  const history = rows.map((r) => ({
    ...r,
    recordedAt: r.recordedAt.toISOString(),
  }));
  const today = history.filter((r) => {
    const d = new Date(r.recordedAt);
    return d >= startOfDay && d < startOfTomorrow;
  });

  // Resolve current user info for header convenience.
  let meName: string | null = null;
  if (meId) {
    const [me] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, meId))
      .limit(1);
    meName = me?.name ?? null;
  }

  return {
    clinic,
    history,
    today,
    users: attendanceUsers,
    meId,
    meName,
  };
}

export async function recordAttendance(
  actorId: string,
  input: { lat: number; lng: number; targetUserId?: string | undefined },
) {
  const targetId = input.targetUserId ?? actorId;
  const isProxy = targetId !== actorId;

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
        eq(attendance.userId, targetId),
        gte(attendance.recordedAt, startOfDay),
        lt(attendance.recordedAt, startOfTomorrow),
      ),
    )
    .limit(1);

  if (existing.length) {
    await audit({
      actorId,
      action: "attendance.duplicate",
      target: targetId,
      result: "fail",
      meta: { proxy: isProxy },
    });
    throw new Error(isProxy ? "Karyawan ini sudah absen hari ini" : "Anda sudah absen hari ini");
  }
  if (!inRange) {
    await audit({
      actorId,
      action: "attendance.out_of_range",
      target: targetId,
      result: "denied",
      meta: { distance: dist, radius: clinic.radius, proxy: isProxy },
    });
    throw new Error("Di luar radius klinik");
  }

  const [row] = await db
    .insert(attendance)
    .values({
      userId: targetId,
      lat: input.lat,
      lng: input.lng,
      distanceM: dist,
      inRange,
    })
    .returning();

  await audit({
    actorId,
    action: isProxy ? "attendance.proxy_record" : "attendance.record",
    target: targetId,
    result: "ok",
    meta: { distance: dist, proxy: isProxy },
  });
  return row;
}
