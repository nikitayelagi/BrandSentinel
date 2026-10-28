
import { NextResponse } from "next/server";
import { db, ORG } from "@/lib/db";

export async function GET() {
  const orgId = ORG();

  const { data, error } = await db()
    .from("drafts")
    .select("id, text, status, version, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Drafts API error:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  console.log("Drafts API:", {
    orgId,
    count: data?.length ?? 0,
  });

  return NextResponse.json(data ?? []);
}
