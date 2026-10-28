import { NextResponse } from "next/server";
import { db, ORG } from "@/lib/db";
// Governance analytics: which rules are disputed most (hint: guideline may be unclear)
export async function GET() {
  const { data } = await db().from("findings").select("kind,source_code,resolution").eq("org_id", ORG());
  const rules: Record<string, { total: number; disputed: number }> = {}, kinds: Record<string, number> = {};
  for (const f of data || []) { kinds[f.kind] = (kinds[f.kind] || 0) + 1; const k = f.source_code || "no source (unsupported claims)";
    rules[k] ??= { total: 0, disputed: 0 }; rules[k].total++; if (f.resolution === "disputed") rules[k].disputed++; }
  const list = Object.entries(rules).map(([rule, v]) => ({ rule, ...v, rate: v.total ? v.disputed / v.total : 0 })).sort((a, b) => b.rate - a.rate);
  return NextResponse.json({ kinds, rules: list });
}
