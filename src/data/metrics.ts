// D:\Projects\visactor-nextjs-template\src\data\metrics.ts

export type Metric = {
  title: string;
  value: string;
  change: number; // 0.05 == +5%, -0.05 == -5%
};

export async function getMetrics(): Promise<Metric[]> {
  const backend = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!backend) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set in environment variables");
  }

  // FastAPI backend-ээс экспорт / импорт / ханшийн толгой үзүүлэлтүүдийг татна
  const [exportRes, importRes, fxRes] = await Promise.all([
    fetch(`${backend}/dashboard/export/total`, { cache: "no-store" }),
    fetch(`${backend}/dashboard/import/total`, { cache: "no-store" }),
    fetch(`${backend}/dashboard/sxcoal/fx-latest`, { cache: "no-store" }),
  ]);

  if (!exportRes.ok) {
    throw new Error(`Export endpoint error: ${exportRes.status}`);
  }
  if (!importRes.ok) {
    throw new Error(`Import endpoint error: ${importRes.status}`);
  }
  if (!fxRes.ok) {
    throw new Error(`Sxcoal FX endpoint error: ${fxRes.status}`);
  }

  const exportData = await exportRes.json();
  const importData = await importRes.json();
  const fxData = await fxRes.json();

  // Нийт экспорт / импорт
  const exportValue: number = exportData.export_this_year ?? 0;
  const exportYoy: number = exportData.yoy_pct ?? 0;

  const importValue: number = importData.import_this_year ?? 0;
  const importYoy: number = importData.yoy_pct ?? 0;

  // Sxcoal ханш (ам.доллар / юань)
  const usdRate: number = fxData.usd?.latest ?? 0;
  const usdYoy: number = fxData.usd?.yoy_pct ?? 0;

  const cnyRate: number = fxData.cny?.latest ?? 0;
  const cnyYoy: number = fxData.cny?.yoy_pct ?? 0;

  const metrics: Metric[] = [
    {
      title: "Нийт экспорт",
      value: exportValue.toLocaleString("en-US", {
        maximumFractionDigits: 1,
      }),
      // metric-card.tsx дээр Math.round(change * 100) хийдэг → 0.x байхад 5% гэх мэт болно
      change: Number(exportYoy) / 100,
    },
    {
      title: "Нийт импорт",
      value: importValue.toLocaleString("en-US", {
        maximumFractionDigits: 1,
      }),
      change: Number(importYoy) / 100,
    },
    {
      title: "Ам.долларын ханш (Sxcoal)",
      value: usdRate.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }),
      change: Number(usdYoy) / 100, // жишээ нь 2.5 → 0.025 → +3% гэж харагдана
    },
    {
      title: "Юанийн ханш (Sxcoal)",
      value: cnyRate.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      }),
      change: Number(cnyYoy) / 100,
    },
  ];

  return metrics;
}