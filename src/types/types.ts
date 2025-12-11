import type { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type TicketMetric = {
  date: string;
  type: string;      // энд string болгож өргөтгөж байна
  count: number;
};
