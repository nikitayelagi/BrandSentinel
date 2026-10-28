"use client";
import { useState } from "react";
const LABEL: Record<string, string> = { Verified: "Verified", Outdated: "Potentially outdated", Unsupported: "Unsupported – needs review", Conflict: "Potential conflict", Inconsistency: "Brand inconsistency" };
const SAMPLE = "Meet GlowCo, India’s number one skincare brand.\nOur serum is clinically proven to work.\nGet 50% off until Friday.\nOur tone is super cheap and fun!";
export default function Page() {
  const [text, setText] = useState(SAMPLE), [intent, setIntent] = useState("Announce the launch and drive sign-ups"), [role, setRole] = useState("Creator");
  const [note, setNote] = useState(""), [file, setFile] = useState<File | null>(null), [data, setData] = useState<any>(null), [msg, setMsg] = useState(""), [status, setStatus] = useState("Draft");
  const post = async (url: string, body: any) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); setMsg(r.ok ? "" : j.error); return r.ok; };
  async function run() {
    const fd = new FormData(); fd.append("text", text); fd.append("intent", intent); if (file) fd.append("file", file);
    const r = await fetch("/api/review", { method: "POST", body: fd }); const j = await r.json();
    if (!r.ok) return setMsg(j.error); setMsg(""); setData(j); setText(j.text); setStatus("Findings ready");
  }
  async function resolve(f: any, resolution: string) {
    if (resolution === "disputed" && !note) return setMsg("Type a reason in the note field first.");
    if (resolution === "edited" && !note) return setMsg("Type replacement text in the note field.");
    if (resolution === "edited") setText(t => t.replace(f.span, note));
    if (resolution === "accepted" && f.suggestion) setText(t => t.replace(f.span, f.suggestion));
    if (await post("/api/decision", { draftId: data.draftId, role, findingId: f.id, resolution, note })) { f.resolution = resolution; setData({ ...data }); setNote(""); }
  }
  async function act(action: string) { if (await post("/api/decision", { draftId: data.draftId, role, action, note })) { setStatus(action === "submit" ? "Pending review" : action === "approve" ? "Approved" : "Changes requested"); setNote(""); } }
  const open = (data?.findings || []).filter((f: any) => f.kind !== "Verified" && f.resolution === "open").length;
  return <main>
    <h1>BrandSentinel</h1>
    <label>Role (demo): <select value={role} onChange={e => setRole(e.target.value)}><option>Creator</option><option>Reviewer</option><option>Manager</option></select></label>
    <p><b>Status:</b> {status}</p>
    <textarea rows={8} style={{ width: "100%" }} value={text} onChange={e => setText(e.target.value)} />
    <input style={{ width: "100%" }} value={intent} onChange={e => setIntent(e.target.value)} placeholder="Creator intent" />
    <p><input type="file" accept=".docx,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} /> <button onClick={run}>Run review</button> <button disabled={!data || open > 0 || status !== "Findings ready"} onClick={() => act("submit")}>Submit for approval</button></p>
    <input style={{ width: "100%" }} value={note} onChange={e => setNote(e.target.value)} placeholder="Note: replacement text / dispute reason / override reason / comment" />
    {msg && <p style={{ color: "crimson" }}>{msg}</p>}
    {data && !data.aiUsed && <p>⚠ AI analysis was not performed (no API key or model error). Deterministic checks only.</p>}
    {data?.findings.map((f: any) => <div key={f.id} style={{ borderLeft: "4px solid #888", padding: 8, margin: "8px 0", background: "#8881" }}>
      <b>{LABEL[f.kind]}</b> {f.route && <i>(routed to reviewer)</i>} <small>[{f.origin}]</small>
      <div>“{f.span}”</div><small>{f.reason} Evidence: {f.evidence}{f.source_code ? ` · Source ${f.source_code}` : ""}</small>
      {f.suggestion && <div><small>Suggested: <b>{f.suggestion}</b></small></div>}
      {f.kind !== "Verified" && (f.resolution === "open" ? <div>
        <button disabled={!f.suggestion} onClick={() => resolve(f, "accepted")}>Accept</button> <button onClick={() => resolve(f, "edited")}>Edit</button> <button onClick={() => resolve(f, "disputed")}>Dispute</button></div> : <small>Resolved: {f.resolution}</small>)}
    </div>)}
    {status === "Pending review" && <p><button onClick={() => act("approve")}>Approve</button> <button onClick={() => act("changes")}>Request changes</button></p>}
    <p><small>AI findings are recommendations. Not legal advice. Nothing is auto-published.</small></p>
  </main>;
}
