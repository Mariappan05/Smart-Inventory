import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get("data");

  if (!data) {
    return NextResponse.json({ error: "Missing data param" }, { status: 400 });
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;

  const res = await fetch(qrUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch QR" }, { status: 502 });
  }

  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="bill-qr-${data}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
