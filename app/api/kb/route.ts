import { NextRequest, NextResponse } from "next/server";
import { db, ORG } from "@/lib/db";
export async function GET() { const { data } = await db().from("kb_items").select("*").eq("org_id", ORG()).order("code"); return NextResponse.json(data || []); }
export async function POST(req: NextRequest) {   // Manager only once auth is wired; role check is client-sent in this demo
  const b = await req.json(); if (b.role !== "Manager") return NextResponse.json({ error: "Managers only." }, { status: 403 });
  try { new RegExp(b.pattern); } catch { return NextResponse.json({ error: "Pattern is not a valid regex." }, { status: 400 }); }
  const { error } = await db().from("kb_items").insert({ org_id: ORG(), code: b.code, type: b.type, title: b.title, pattern: b.pattern, preferred: b.preferred || null, approved: b.approved !== false, alt: b.alt || null, ref: b.ref || null, expiry: b.expiry || null });
  await db().from("audit_log").insert({ org_id: ORG(), role: b.role, action: "KB add", detail: b.code });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
export async function PATCH(req: NextRequest) {   // retire / reactivate an item
  const b = await req.json(); if (b.role !== "Manager") return NextResponse.json({ error: "Managers only." }, { status: 403 });
  await db().from("kb_items").update({ status: b.status }).eq("id", b.id); return NextResponse.json({ ok: true });
}
