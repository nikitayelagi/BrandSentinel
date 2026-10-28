import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { db, ORG } from "@/lib/db";
import { runReview, KB } from "@/lib/review";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const fd = await req.formData(); let text = String(fd.get("text") || ""); const intent = String(fd.get("intent") || "");
  const fileValue = fd.get("file");
const file = fileValue instanceof File ? fileValue : null;
    if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer()); let ex = "";
    try {
      if (file.name.endsWith(".docx")) ex = (await mammoth.extractRawText({ buffer: buf })).value;
      else if (file.name.endsWith(".pdf")) { const pdf = (await import("pdf-parse/lib/pdf-parse.js" as any)).default; ex = (await pdf(buf)).text; }
      else return NextResponse.json({ error: "Unsupported file. Upload DOCX or text-based PDF, or paste text." }, { status: 400 });
    } catch { return NextResponse.json({ error: "Could not read that file. Please paste the text." }, { status: 400 }); }
    if (ex.trim()) text = ex;
    else if (!text.trim()) return NextResponse.json({ error: "No readable text in that file (it may be a scanned PDF). Paste the text instead." }, { status: 400 });
  }
  if (!text.trim()) return NextResponse.json({ error: "No text provided." }, { status: 400 });
  const s = db();
  const { data: kb } = await s.from("kb_items").select("*").eq("org_id", ORG()).eq("status", "active");
  const { findings, aiUsed } = await runReview(text, (kb || []) as KB[], intent);
  const { data: d } = await s.from("drafts").insert({ org_id: ORG(), text, intent }).select().single();
  await s.from("findings").insert(findings.map(({ start, ...f }) => ({ ...f, draft_id: d!.id, org_id: ORG() })));
  await s.from("audit_log").insert({ org_id: ORG(), draft_id: d!.id, role: "Creator", action: "Run review", detail: `${findings.length} findings, AI ${aiUsed ? "on" : "off"}` });
  const { data: saved } = await s.from("findings").select("*").eq("draft_id", d!.id);
  return NextResponse.json({ draftId: d!.id, text, findings: saved, aiUsed });
}
