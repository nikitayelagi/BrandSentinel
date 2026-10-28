// Evaluation harness: labelled synthetic drafts vs the rule engine. Run: npm run eval
import { deterministic, KB } from "../lib/review";
const kb: KB[] = [
 { code: "T-09", type: "term", title: "", pattern: "(super )?cheap", preferred: "affordable" },
 { code: "F-07", type: "claim", title: "", pattern: "dermatologist[- ]tested", approved: true },
 { code: "C-03", type: "claim", title: "", pattern: "clinically proven", approved: false, alt: "dermatologist-tested", ref: "F-07" },
 { code: "F-21", type: "fact", title: "", pattern: "50% off", expiry: "2026-09-30" },
 { code: "F-22", type: "fact", title: "", pattern: "free shipping", expiry: "2099-12-31" }];
const set: [string, string[]][] = [
 ["Our best serum ever.", ["Unsupported"]], ["Guaranteed results in 7 days", ["Unsupported"]], ["Get 50% off today", ["Outdated"]],
 ["Enjoy free shipping this month", ["Verified"]], ["Dermatologist-tested and gentle", ["Verified"]], ["Clinically proven to hydrate", ["Conflict"]],
 ["Cheap prices for everyone", ["Inconsistency"]], ["Meet our new moisturiser", []], ["Super cheap, 50% off and best in class", ["Inconsistency", "Outdated", "Unsupported"]],
 ["Number one choice, clinically proven", ["Unsupported", "Conflict"]], ["Our leading brand, dermatologist-tested", ["Unsupported", "Verified"]], ["Thank you for shopping with us", []],
 ["#1 pick, 100% natural", ["Unsupported"]], ["Proven results, free shipping", ["Unsupported", "Verified"]]];
const kinds = ["Verified", "Outdated", "Unsupported", "Conflict", "Inconsistency"]; const c: any = {}; kinds.forEach(k => c[k] = { tp: 0, fp: 0, fn: 0 }); let cleanFP = 0, clean = 0;
for (const [t, exp] of set) { const got = new Set(deterministic(t, kb).map(f => f.kind));
  for (const k of kinds) { const g = got.has(k as any), e = exp.includes(k); if (g && e) c[k].tp++; else if (g) c[k].fp++; else if (e) c[k].fn++; }
  if (!exp.length) { clean++; if ([...got].some(k => k !== "Verified")) cleanFP++; } }
console.log(`Drafts: ${set.length} (synthetic, draft-level labels, indicative only)`);
for (const k of kinds) { const { tp, fp, fn } = c[k]; console.log(k.padEnd(14), "precision", tp + fp ? (tp / (tp + fp)).toFixed(2) : "n/a", "recall", tp + fn ? (tp / (tp + fn)).toFixed(2) : "n/a", `(tp ${tp}, fp ${fp}, fn ${fn})`); }
console.log(`False flags on clean drafts: ${cleanFP}/${clean}`);
