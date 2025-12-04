"use client";

import { VChart } from "@visactor/react-vchart";
import type { ICirclePackingChartSpec } from "@visactor/vchart";
import type { Conversion } from "@/data/convertions";
import { addThousandsSeparator } from "@/lib/utils";

const buildSpec = (values: Conversion[]): ICirclePackingChartSpec => ({
  data: [
    {
      id: "data",
      values,
    },
  ],
  type: "circlePacking",
  categoryField: "name",
  valueField: "value",
  drill: false,
  padding: 0,
  layoutPadding: 5,

  /** ---------------------------
   *  LABEL: БUBBLE ДООР ТОО ГАРГАНА
   * --------------------------- */
  label: {
    visible: true,
    style: {
      fill: "white",
      fontWeight: 400,
      textAlign: "center",
      textBaseline: "middle",
      /**
       * Багтахгүй жижиг бол текстийг нуух
       */
      visible: (d: any) => d.radius > 30,

      /**
       * Текст → зөвхөн value-г мян. тн хэлбэрээр
       * Хэрвээ нэртэй харагдуулмаар бол:
       * `${d.name}\n${value}`
       */
      text: (d: any) => {
        if (!d.value) return "";
        const v = addThousandsSeparator(Math.round(d.value));
        return `${v}`;
      },

      /**
       * Bubble-ийн radius-оос хамаарч font томруулах
       */
      fontSize: (d: any) => Math.max(10, d.radius / 3),
    },
  },

  legends: [{ visible: false }],

  tooltip: {
    trigger: ["click", "hover"],
    mark: {
      content: {
        value: (d: any) =>
          `${d?.name}: ${addThousandsSeparator(
            Math.round(d?.value ?? 0),
          )} мян. тн`,
      },
    },
  },

  animationEnter: { easing: "cubicInOut" },
  animationExit: { easing: "cubicInOut" },
  animationUpdate: { easing: "cubicInOut" },
});

export default function Chart({ data }: { data: Conversion[] }) {
  const spec = buildSpec(data);
  return <VChart spec={spec} />;
}