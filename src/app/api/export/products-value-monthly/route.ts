// src/app/api/export/products-value-monthly/route.ts
import { NextResponse } from "next/server";

const backend = process.env.BACKEND_URL;

export async function GET() {
  if (!backend) {
    return NextResponse.json(
      { error: "BACKEND_URL is not set" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `${backend}/dashboard/export/products-value-monthly`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    // FastAPI: { products: [...], monthly: [...] }
    return NextResponse.json(data);
  } catch (err) {
    console.error("export/products-value-monthly API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch export products value" },
      { status: 500 },
    );
  }
}