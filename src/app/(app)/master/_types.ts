export type Service = {
  id: string;
  name: string;
  priceCents: string;
  durationMin: number;
  active: boolean;
  categoryName: string | null;
};
export type Category = { id: string; name: string; serviceCount: number };
export type Package = {
  id: string;
  name: string;
  priceCents: string;
  active: boolean;
  services: { id: string; name: string; priceCents: string }[];
};
export type TaskRole = {
  id: string;
  slug: string;
  label: string;
  forType: "doctor" | "staff";
  active: boolean;
  usage: number;
};
export type Employee = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  active: boolean;
  joinedAt: string;
};
export type Tab = "services" | "packages" | "roles" | "employees";

export type TabCounts = {
  services: number;
  packages: number;
  roles: number;
  employees: number;
};

export type Data = {
  services?: Service[];
  categories?: Category[];
  packages?: Package[];
  roles?: TaskRole[];
  employees?: Employee[];
};
