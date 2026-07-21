"use client";

import { Check, WandSparkles } from "lucide-react";

type Fix = { key: string; title: string; explanation: string; patch: string; apply: (document: Document) => void };

const titleCase = (value: string) => value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\s+/g, " ").trim();

function findSafeFixes(markup: string): Fix[] {
  const document = new DOMParser().parseFromString(markup, "text/html");
  const fixes: Fix[] = [];
  [...document.querySelectorAll("input, select, textarea")].forEach((field, index) => {
    const id = field.id;
    const labelled = field.getAttribute("aria-label") || field.getAttribute("aria-labelledby") || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
    if (labelled || !id) return;
    const text = titleCase(field.getAttribute("placeholder") || id);
    fixes.push({ key: `label:${id}:${index}`, title: `Add a persistent label to “${text}”`, explanation: "A placeholder disappears while someone is typing. This patch adds the programmatic label a screen reader needs.", patch: `<label for="${id}">${text}</label>\n<input id="${id}" … />`, apply: (next) => { const target = next.getElementById(id); if (!target || next.querySelector(`label[for="${CSS.escape(id)}"]`)) return; const label = next.createElement("label"); label.htmlFor = id; label.textContent = text; target.parentNode?.insertBefore(label, target); } });
  });
  [...document.querySelectorAll("button")].forEach((button, index) => {
    const named = button.getAttribute("aria-label") || button.getAttribute("aria-labelledby") || button.textContent?.trim();
    if (named || !button.id) return;
    const text = titleCase(button.id);
    fixes.push({ key: `button:${button.id}:${index}`, title: `Name the “${text}” button`, explanation: "The control is reachable with Tab, but has no readable action. This patch adds visible button text.", patch: `<button id="${button.id}" …>${text}</button>`, apply: (next) => { const target = next.getElementById(button.id); if (target && !target.textContent?.trim()) target.textContent = text; } });
  });
  return fixes;
}

export default function FixPreviewPanel({ candidate, setCandidate }: { candidate: string; setCandidate: (value: string) => void }) {
  const fixes = findSafeFixes(candidate);
  const apply = (fix: Fix) => { const document = new DOMParser().parseFromString(candidate, "text/html"); fix.apply(document); setCandidate(document.body.innerHTML); };
  return <section className="fix-preview" aria-label="Safe remediation preview"><div className="fix-preview-heading"><div><p>SAFE REMEDIATION PREVIEW</p><h4>{fixes.length ? `${fixes.length} verified patch${fixes.length === 1 ? "" : "es"} available` : "Candidate clear of supported regressions"}</h4></div><span>{fixes.length ? <><WandSparkles size={14}/> Review then apply</> : <><Check size={14}/> Rechecked locally</>}</span></div>{fixes.length ? <div className="fix-list">{fixes.map((fix) => <article key={fix.key}><div><b>{fix.title}</b><p>{fix.explanation}</p><code>{fix.patch}</code></div><button onClick={() => apply(fix)}><WandSparkles size={14}/> Apply patch</button></article>)}</div> : <p className="fix-clean">No automatic patch is being suggested. AccessTrace only offers changes it can safely verify in this local comparison.</p>}<style>{`.fix-preview{margin-top:18px;border:1px solid #d7e2d8;border-radius:12px;background:#fbfdf9;overflow:hidden}.fix-preview-heading{padding:16px 18px;display:flex;justify-content:space-between;gap:16px;align-items:center;border-bottom:1px solid #e3ebe4}.fix-preview p{margin:0}.fix-preview-heading p{font-size:10px;letter-spacing:.12em;font-weight:800;color:#147553}.fix-preview-heading h4{margin:5px 0 0;font-size:18px}.fix-preview-heading>span{display:flex;gap:6px;align-items:center;color:#147553;font-size:12px;font-weight:750}.fix-list article{padding:16px 18px;display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:1px solid #e5ece6}.fix-list article:last-child{border-bottom:0}.fix-list b{font-size:14px}.fix-list p,.fix-clean{margin-top:5px!important;color:#537064;font-size:12px;line-height:1.5}.fix-list code{display:block;margin-top:10px;padding:8px 10px;border-radius:6px;background:#edf5ed;color:#18543d;font-size:11px;white-space:pre-wrap}.fix-list button{flex:none;border:0;border-radius:7px;padding:9px 11px;background:#147553;color:#fff;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:750;cursor:pointer}.fix-clean{padding:16px 18px;margin:0!important}@media(max-width:650px){.fix-preview-heading,.fix-list article{align-items:flex-start;flex-direction:column}.fix-list button{width:100%;justify-content:center}}`}</style></section>;
}
