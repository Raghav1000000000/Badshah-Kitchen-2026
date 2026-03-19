import { NextResponse } from "next/server";

export function GET(request: Request) {
  // Serve an explicit favicon endpoint to avoid browser 404 noise.
  return NextResponse.redirect(new URL("/icon.svg", request.url), 307);
}
