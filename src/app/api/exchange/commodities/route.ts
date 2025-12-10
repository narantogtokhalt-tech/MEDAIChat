import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_CHAT_API_BASE;

export async function GET() {
  if (!backend) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_BASE_URL is not set" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${backend}/dashboard/exchange/timeline`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const commodities = (data.commodities ?? []) as any[];

    // total_ton → 1000-д хувааж "мян. тн" болгоно
    const items = commodities.map((c) => {
      const ton = Number(c.total_ton ?? 0);
      const value = Number.isFinite(ton) ? Math.round(ton / 1000) : 0; // мян. тн

      return {
        key: String(c.key),
        name: String(c.name),
        value,                   // chart & indicator дээр ашиглах
        unit: "мян. тн",         // нэгж
      };
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("exchange/commodities API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch exchange commodities" },
      { status: 500 },
    );
  }
}