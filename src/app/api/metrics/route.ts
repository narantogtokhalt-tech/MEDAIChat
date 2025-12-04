// src/app/api/metrics/route.ts
import { NextResponse } from "next/server";

const backend = process.env.BACKEND_URL!;

// Backend талаас авсан structure:
//  - /dashboard/export/total  -> { export_this_year, yoy_pct, ... }
//  - /dashboard/import/total  -> { import_this_year, yoy_pct, ... }

// Энэ API front-д metrics.ts-д хэрэгтэй structure-ийг буцаана
export async function GET() {
  try {
    const [exportRes, importRes] = await Promise.all([
      fetch(`${backend}/dashboard/export/total`, { cache: "no-store" }),
      fetch(`${backend}/dashboard/import/total`, { cache: "no-store" }),
    ]);

    if (!exportRes.ok || !importRes.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: 500 },
      );
    }

    const exportData = await exportRes.json();
    const importData = await importRes.json();

    const exportValue = exportData.export_this_year ?? 0;
    const exportYoy = exportData.yoy_pct ?? 0;

    const importValue = importData.import_this_year ?? 0;
    const importYoy = importData.yoy_pct ?? 0;

    // metrics.ts-ийн structure-ийг дагаж байна:
    // [{ title, value, change }]
    const metrics = [
      {
        title: "Нийт экспорт",
        // тоог чамд таалагдахаар форматлаад байна, хүсвэл өөрчилж болно
        value: exportValue.toLocaleString("en-US", {
          maximumFractionDigits: 1,
        }),
        // change нь demo template дээр 0.05 (5%) шиг явж байсан → %/100 гэсэн ойлголтоор өгөх
        change: Number(exportYoy) / 100, // жишээ: -4.42% -> -0.0442
      },
      {
        title: "Нийт импорт",
        value: importValue.toLocaleString("en-US", {
          maximumFractionDigits: 1,
        }),
        change: Number(importYoy) / 100,
      },
      // Доорх 2-г одоохондоо static орхиё — хэрэгтэй бол дараа өөр endpoint-ээс холбоорой
      {
        title: "Экспортын өсөлт (2 жилтэй харьцуулсан)",
        value: "",
        change: 0,
      },
      {
        title: "Импортын өсөлт (2 жилтэй харьцуулсан)",
        value: "",
        change: 0,
      },
    ];

    return NextResponse.json(metrics);
  } catch (err) {
    console.error("Error in /api/metrics:", err);
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 500 },
    );
  }
}
