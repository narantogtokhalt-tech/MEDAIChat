// src/app/api/coal-cny/latest/route.ts
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
    const res = await fetch(`${backend}/dashboard/coal-cny/latest`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("coal-cny/latest API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch coal cny latest" },
      { status: 500 },
    );
  }
}