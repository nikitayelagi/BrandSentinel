"use client";
import { useEffect, useState } from "react";
export default function KB() {
  const [kb, setKb] = useState<any[]>([]), [ins, setIns] = useState<any>(null), [msg, setMsg] = useState(""), [role, setRole] = useState("Manager");
  const [f, setF] = useState({ code: "", type: "term", title: "", pattern: "", preferred: "", expiry: "", approved: true });
  const load = () => { fetch("/api/kb").then(r => r.json()).then(setKb); fetch("/api/insights").then(r => r.json()).then(setIns); };
  useEffect(load, []);
  const add = async () => { const r = await fetch("/api/kb", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, role }) }); const j = await r.json(); setMsg(r.ok ? "Added." : j.error); load(); };
  const toggle = async (i: any) => { await fetch("/api/kb", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: i.id, role, status: i.status === "active" ? "inactive" : "active" }) }); load(); };
  return <div><h1>Knowledge Base</h1>
    <label>Role (demo): <select value={role} onChange={e => setRole(e.target.value)}><option>Manager</option><option>Reviewer</option><option>Creator</option></select></label>
    <table border={1} cellPadding={4} style={{ borderCollapse: "collapse", width: "100%", marginTop: 8 }}><tbody>
      {kb.map(i => <tr key={i.id} style={{ opacity: i.status === "active" ? 1 : .5 }}><td>{i.code}</td><td>{i.type}</td><td>{i.title}</td><td>{i.expiry || "–"}</td><td><button onClick={() => toggle(i)}>{i.status === "active" ? "Retire" : "Reactivate"}</button></td></tr>)}</tbody></table>
    <h3>Add item</h3>
    <input placeholder="Code (e.g. T-20)" onChange={e => setF({ ...f, code: e.target.value })} /> <select onChange={e => setF({ ...f, type: e.target.value })}><option>term</option><option>claim</option><option>fact</option></select>
    <input placeholder="Title" onChange={e => setF({ ...f, title: e.target.value })} /> <input placeholder="Regex pattern" onChange={e => setF({ ...f, pattern: e.target.value })} />
    <input placeholder="Preferred (terms)" onChange={e => setF({ ...f, preferred: e.target.value })} /> <input placeholder="Expiry YYYY-MM-DD" onChange={e => setF({ ...f, expiry: e.target.value })} />
    <label><input type="checkbox" checked={f.approved} onChange={e => setF({ ...f, approved: e.target.checked })} /> approved</label> <button onClick={add}>Add</button> {msg}
    <h2>Governance insights</h2><p><small>Rules with a high dispute rate may need clearer wording.</small></p>
    {ins && <><p>{Object.entries(ins.kinds).map(([k, v]) => `${k}: ${v}`).join(" · ") || "No findings yet."}</p>
      {ins.rules.map((r: any) => <div key={r.rule} style={{ margin: "4px 0" }}>{r.rule}: {r.disputed}/{r.total} disputed
        <div style={{ background: "#8883", height: 8 }}><div style={{ width: `${r.rate * 100}%`, height: 8, background: "crimson" }} /></div></div>)}</>}
  </div>;
}
