import Anthropic from "@anthropic-ai/sdk";
export type KB = { code: string; type: string; title: string; pattern: string; preferred?: string; approved?: boolean; alt?: string; ref?: string; expiry?: string; status?: string };
export type Finding = { span: string; kind: "Verified"|"Outdated"|"Unsupported"|"Conflict"|"Inconsistency"; reason: string; source_code: string|null; evidence: "strong"|"partial"|"none"; suggestion: string|null; route: boolean; origin: "rule"|"ai"; start: number };
export const mask=(t:string)=>t.replace(/\[\[confidential\]\][\s\S]*?\[\[\/confidential\]\]/gi,"[REDACTED]");
const TRIGGERS = /number one|#1|\bbest\b|guaranteed|100% (safe|natural)|\bleading\b|\bproven\b/gi;

export function deterministic(txt: string, kb: KB[]): Finding[] {
  const out: Finding[] = [], used: [number, number][] = [];
  const push = (m: RegExpExecArray, f: Omit<Finding, "span"|"start"|"origin">) => { used.push([m.index, m.index + m[0].length]); out.push({ ...f, span: m[0], start: m.index, origin: "rule" }); };
  for (const it of kb.filter(k => k.status !== "inactive")) {
    const m = new RegExp(it.pattern, "i").exec(txt); if (!m) continue;
    if (it.type === "term") push(m, { kind: "Inconsistency", reason: `Conflicts with terminology ${it.code}.`, source_code: it.code, evidence: "strong", suggestion: it.preferred ?? null, route: false });
    else if (it.type === "claim") push(m, it.approved
      ? { kind: "Verified", reason: `Supported by approved claim ${it.code}.`, source_code: it.code, evidence: "strong", suggestion: null, route: false }
      : { kind: "Conflict", reason: `Differs from approved wording (${it.ref}). Not marked false; needs a reviewer.`, source_code: it.code, evidence: "partial", suggestion: it.alt ?? null, route: true });
    else { const old = it.expiry && new Date(it.expiry + "T23:59:59") < new Date();
      push(m, old ? { kind: "Outdated", reason: `${it.code} expired on ${it.expiry}.`, source_code: it.code, evidence: "strong", suggestion: null, route: false }
                  : { kind: "Verified", reason: `Active approved fact ${it.code}.`, source_code: it.code, evidence: "strong", suggestion: null, route: false }); }
  }
  let m: RegExpExecArray | null; const re = new RegExp(TRIGGERS);
  while ((m = re.exec(txt))) { const s = m.index, e = s + m[0].length; if (used.some(u => s < u[1] && e > u[0])) continue;
    out.push({ span: m[0], start: s, kind: "Unsupported", reason: "No approved evidence found. This does not mean the claim is false.", source_code: null, evidence: "none", suggestion: null, route: true, origin: "rule" }); }
  return out;
}

// AI-assisted step: structured JSON, then verified by code (spans and sources must exist).
async function ai(txt: string, kb: KB[], intent: string): Promise<Finding[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("no key");
  const client = new Anthropic();
  const prompt = `You review marketing drafts against an organisation's approved brand knowledge. Never say a claim is false; use "Unsupported" when no approved source covers it.
Approved knowledge:\n${kb.map(k => `${k.code} [${k.type}] ${k.title}`).join("\n")}
Creator intent: ${intent}\nDraft:\n"""${mask(txt)}"""
Find only tone/messaging issues and unsupported or conflicting claims that simple term matching would miss. Return ONLY a JSON array of {"span":exact text from draft,"kind":"Unsupported"|"Conflict"|"Inconsistency","reason":string,"source":knowledge code or null,"suggestion":string or null}.`;
  const r = await client.messages.create({ model: process.env.AI_MODEL || "claude-sonnet-5-5", max_tokens: 1500, messages: [{ role: "user", content: prompt }] });
  const raw = r.content.map(c => (c.type === "text" ? c.text : "")).join("").replace(/```json|```/g, "").trim();
  const arr = JSON.parse(raw) as any[];
  return arr.filter(a => typeof a.span === "string" && txt.includes(a.span) && (!a.source || kb.some(k => k.code === a.source)))
    .map(a => ({ span: a.span, start: txt.indexOf(a.span), kind: a.kind, reason: String(a.reason), source_code: a.source ?? null,
      evidence: a.source ? "partial" : "none", suggestion: a.suggestion ?? null, route: a.kind !== "Inconsistency", origin: "ai" as const }));
}

export async function runReview(txt: string, kb: KB[], intent: string) {
  const base = deterministic(txt, kb); let aiUsed = false, extra: Finding[] = [];
  try { extra = await ai(txt, kb, intent); aiUsed = true; } catch { /* fallback: deterministic only; UI shows banner */ }
  const merged = [...base, ...extra.filter(a => !base.some(b => a.start < b.start + b.span.length && b.start < a.start + a.span.length))];
  return { findings: merged.sort((a, b) => a.start - b.start), aiUsed };
}
