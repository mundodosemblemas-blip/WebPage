import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

// Lets the admin UI ask "am I still logged in?" on mount, so an expired or
// missing session shows the password form instead of a wall of failed requests.
export async function GET() {
  return NextResponse.json({ ok: await isAdmin() });
}
