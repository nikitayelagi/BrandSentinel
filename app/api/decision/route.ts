import { NextRequest, NextResponse } from "next/server";
import { db, ORG } from "@/lib/db";
// NOTE: `role` comes from the client in this demo. Replace with the role from Supabase Auth (profiles table) before real use.
export async function POST(req: NextRequest) {
  const { draftId, role, action, note, findingId, resolution } = await req.json(); const s = db();
  if (findingId) {
    if (resolution === "disputed" && !note) return NextResponse.json({ error: "Reason required" }, { status: 400 });
    await s.from("findings").update({ resolution }).eq("id", findingId);
    await s.from("audit_log").insert({ org_id: ORG(), draft_id: draftId, role, action: resolution, detail: note || "" });
    return NextResponse.json({ ok: true });
  }
  if (action === "submit") await s.from("drafts").update({ status: "Pending review" }).eq("id", draftId);
  else {
    if (role === "Creator") return NextResponse.json({ error: "Only a Reviewer or Manager can decide." }, { status: 403 });
    const { count } = await s.from("findings").select("id", { count: "exact", head: true }).eq("draft_id", draftId).neq("kind", "Verified").in("resolution", ["open", "disputed"]);
    if (action === "approve" && count && !note) return NextResponse.json({ error: "Open items remain: an override reason is required." }, { status: 400 });
    if (action === "changes" && !note) return NextResponse.json({ error: "Comment required." }, { status: 400 });
    await s.from("drafts").update({ status: action === "approve" ? "Approved" : "Changes requested" }).eq("id", draftId);
  }
  await s.from("audit_log").insert({ org_id: ORG(), draft_id: draftId, role, action, detail: note || "" });
  return NextResponse.json({ ok: true });
}
