import { Gauge, type LucideIcon, MessagesSquare, Table } from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
};

export const siteConfig = {
  title: "Эдийн засаг, хөгжлийн яам",
  description: "Дотоод мэдээллийн сан",
};

export const navigations: Navigation[] = [
  {
    icon: Gauge,
    name: "Эхлэл",
    href: "/",
  },
  {
    icon: MessagesSquare,
    name: "Power BI",
    href: "/ticket",
  },
  {
    icon: Table,
    name: "Хүснэгтээр",
    href: "/table",
  },
];