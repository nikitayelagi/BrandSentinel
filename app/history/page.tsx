"use client";
import { useEffect, useState } from "react";
// word-level LCS diff between two draft versions
function diff(a: string, b: string) {
  const x = a.split(/(\s+)/), y = b.split(/(\s+)/), n = x.length, m = y.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: { t: string; k: "same" | "del" | "add" }[] = []; let i = 0, j = 0;
  while (i < n && j < m) { if (x[i] === y[j]) { out.push({ t: x[i], k: "same" }); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push({ t: x[i++], k: "del" }); else out.push({ t: y[j++], k: "add" }); }
  while (i < n) out.push({ t: x[i++], k: "del" }); while (j < m) out.push({ t: y[j++], k: "add" }); return out;
}
export default function History() {
  const [d, setD] = useState<any[]>([]), [a, setA] = useState(""), [b, setB] = useState("");
  useEffect(() => { fetch("/api/drafts").then(r => r.json()).then(setD); }, []);
  const A = d.find(x => x.id === a), B = d.find(x => x.id === b);
  const opts = d.map(x => <option key={x.id} value={x.id}>{new Date(x.created_at).toLocaleString()} · {x.status} · {x.text.slice(0, 30)}</option>);
  return <div><h1>History &amp; Diff</h1>
    <p>Older: <select onChange={e => setA(e.target.value)}><option value="">choose</option>{opts}</select></p>
    <p>Newer: <select onChange={e => setB(e.target.value)}><option value="">choose</option>{opts}</select></p>
    {A && B && <div style={{ whiteSpace: "pre-wrap", border: "1px solid #8886", padding: 8 }}>{diff(A.text, B.text).map((p, i) =>
      <span key={i} style={p.k === "del" ? { background: "#f663", textDecoration: "line-through" } : p.k === "add" ? { background: "#3c63" } : {}}>{p.t}</span>)}</div>}
  </div>;
}
