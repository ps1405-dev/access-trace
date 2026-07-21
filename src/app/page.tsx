"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Code2,
  Eye,
  FileWarning,
  GitCompareArrows,
  Keyboard,
  Landmark,
  Play,
  ScanSearch,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import FixPreviewPanel from "./components/FixPreviewPanel";

type Finding = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  target: string;
};
type NodeInfo = { id: string; role: string; name: string; target: string };
type Scan = {
  focus: NodeInfo[];
  headings: NodeInfo[];
  landmarks: NodeInfo[];
  findings: Finding[];
};
type Scenario = {
  name: string;
  description: string;
  baseline: string;
  candidate: string;
};

const scenarios: Scenario[] = [
  {
    name: "Checkout regression",
    description:
      "A real release regression: the primary action loses its accessible name and the coupon input loses its label.",
    baseline: `<main>
  <header><a href="#content">Skip to checkout</a><h1>Checkout</h1></header>
  <section aria-labelledby="order-title"><h2 id="order-title">Your order</h2><p>Canvas backpack, 1 item, 48 dollars.</p></section>
  <form aria-label="Payment details"><label for="email">Email address</label><input id="email" type="email" />
    <label for="coupon">Coupon code</label><input id="coupon" type="text" />
    <button id="place-order" type="submit">Place order</button></form>
  <footer><a href="/help">Need help?</a></footer>
</main>`,
    candidate: `<main>
  <header><a href="#content">Skip to checkout</a><h1>Checkout</h1></header>
  <section aria-labelledby="order-title"><h2 id="order-title">Your order</h2><p>Canvas backpack, 1 item, 48 dollars.</p></section>
  <form aria-label="Payment details"><label for="email">Email address</label><input id="email" type="email" />
    <input id="coupon" type="text" placeholder="Coupon code" />
    <button id="place-order" type="submit"><svg aria-hidden="true"></svg></button></form>
  <footer><a href="/help">Need help?</a></footer>
</main>`,
  },
  {
    name: "Modal focus trap",
    description:
      "A release introduces a dialog with no name and a keyboard focus escape route.",
    baseline: `<main><h1>Settings</h1><button id="delete">Delete account</button><a href="/security">Security settings</a></main>`,
    candidate: `<main><h1>Settings</h1><button id="delete">Delete account</button><div role="dialog"><button>×</button><p>This action cannot be undone.</p><button>Delete</button></div><a href="/security">Security settings</a></main>`,
  },
];

function selector(el: Element, index: number) {
  const id = el.getAttribute("id");
  return id ? `#${id}` : `${el.tagName.toLowerCase()}[${index + 1}]`;
}
function nameOf(el: Element, doc: Document) {
  const labelled =
    el.getAttribute("aria-label") ||
    el.getAttribute("alt") ||
    el.getAttribute("title");
  if (labelled?.trim()) return labelled.trim();
  const id = el.getAttribute("id");
  if (id) {
    const label = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  return (el.textContent || el.getAttribute("placeholder") || "")
    .replace(/\s+/g, " ")
    .trim();
}
function roleOf(el: Element) {
  const role = el.getAttribute("role");
  if (role) return role;
  const tag = el.tagName.toLowerCase();
  if (tag === "a") return "link";
  if (tag === "button") return "button";
  if (tag === "input")
    return el.getAttribute("type") === "checkbox" ? "checkbox" : "textbox";
  if (/^h[1-6]$/.test(tag)) return "heading";
  return tag;
}
function scan(html: string): Scan {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const findings: Finding[] = [];
  const all = [...doc.body.querySelectorAll("*")];
  const info = (el: Element, index: number): NodeInfo => ({
    id: el.id || selector(el, index),
    role: roleOf(el),
    name: nameOf(el, doc) || "Unlabelled",
    target: selector(el, index),
  });
  const focusEls = all.filter((el) => {
    const tag = el.tagName.toLowerCase();
    const tabindex = el.getAttribute("tabindex");
    const ti = tabindex === null ? null : Number(tabindex);
    return (
      !el.hasAttribute("disabled") &&
      (tag === "button" ||
        (tag === "a" && el.hasAttribute("href")) ||
        ["input", "select", "textarea"].includes(tag) ||
        (ti !== null && ti >= 0))
    );
  });
  focusEls.forEach((el, index) => {
    const name = nameOf(el, doc);
    const target = selector(el, index);
    if (!name)
      findings.push({
        id: `name-${target}`,
        severity: "critical",
        title: "Interactive control has no accessible name",
        detail: `A screen reader will announce ${roleOf(el)} without telling the user what it does.`,
        target,
      });
    if (Number(el.getAttribute("tabindex")) > 0)
      findings.push({
        id: `tab-${target}`,
        severity: "warning",
        title: "Positive tabindex changes expected keyboard order",
        detail: "Use the natural document order or tabindex 0.",
        target,
      });
    if (
      el.tagName === "INPUT" &&
      !el.getAttribute("aria-label") &&
      !doc.querySelector(`label[for="${CSS.escape(el.id)}"]`)
    )
      findings.push({
        id: `label-${target}`,
        severity: "critical",
        title: "Form field has no programmatic label",
        detail:
          "Placeholder text disappears while typing and is not a replacement for a label.",
        target,
      });
  });
  [...doc.images].forEach((el, index) => {
    if (!el.hasAttribute("alt"))
      findings.push({
        id: `image-${index}`,
        severity: "warning",
        title: "Image has no alternative text",
        detail: "Provide alt text or an empty alt for decorative images.",
        target: selector(el, index),
      });
  });
  const headings = all.filter((el) => /^H[1-6]$/.test(el.tagName)).map(info);
  let previous = 0;
  headings.forEach((heading, index) => {
    const level =
      Number(heading.role.replace("heading", "")) ||
      Number(
        all.find((el) => selector(el, all.indexOf(el)) === heading.target)
          ?.tagName[1],
      );
    if (previous && level > previous + 1)
      findings.push({
        id: `heading-${index}`,
        severity: "warning",
        title: "Heading level is skipped",
        detail: `The reading outline jumps from H${previous} to H${level}.`,
        target: heading.target,
      });
    previous = level;
  });
  const landmarks = all
    .filter(
      (el) =>
        ["main", "header", "footer", "nav", "aside"].includes(
          el.tagName.toLowerCase(),
        ) ||
        ["main", "navigation", "banner", "contentinfo", "dialog"].includes(
          el.getAttribute("role") || "",
        ),
    )
    .map(info);
  all
    .filter((el) => el.getAttribute("role") === "dialog")
    .forEach((el, index) => {
      if (!nameOf(el, doc) && !el.getAttribute("aria-labelledby"))
        findings.push({
          id: `dialog-${index}`,
          severity: "critical",
          title: "Dialog has no accessible name",
          detail: "Give the dialog an aria-label or aria-labelledby target.",
          target: selector(el, index),
        });
    });
  return { focus: focusEls.map(info), headings, landmarks, findings };
}

export default function Home() {
  const [scenario, setScenario] = useState(0);
  const [baseline, setBaseline] = useState(scenarios[0].baseline);
  const [candidate, setCandidate] = useState(scenarios[0].candidate);
  const [ran, setRan] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const before = useMemo(
    () =>
      mounted
        ? scan(baseline)
        : { focus: [], headings: [], landmarks: [], findings: [] },
    [baseline, mounted],
  );
  const after = useMemo(
    () =>
      mounted
        ? scan(candidate)
        : { focus: [], headings: [], landmarks: [], findings: [] },
    [candidate, mounted],
  );
  const regressions = after.findings.filter(
    (f) => !before.findings.some((old) => old.id === f.id),
  );
  const choose = (index: number) => {
    setScenario(index);
    setBaseline(scenarios[index].baseline);
    setCandidate(scenarios[index].candidate);
    setRan(true);
  };
  return (
    <main className="trace">
      <nav>
        <a className="brand" href="#top">
          <span>◈</span>AccessTrace
        </a>
        <div>
          <a href="#workspace">Playground</a>
          <a href="#how">How it works</a>
        </div>
        <a className="header-action" href="/workspace">
          Browser Scan <ArrowRight size={15} />
        </a>
      </nav>
      <section id="top" className="hero">
        <div>
          <p className="tag">
            <ShieldCheck size={14} /> ACCESSIBILITY REGRESSION TESTING
          </p>
          <h1>
            See what a release <i>sounds like</i> before users do.
          </h1>
          <p>
            AccessTrace compares real HTML states and finds keyboard and
            screen-reader regressions that visual snapshots miss.
          </p>
          <button
            className="primary"
            onClick={() =>
              document
                .getElementById("workspace")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Try a live regression <ArrowRight size={17} />
          </button>
        </div>
        <div className="terminal">
          <div className="dots">
            <i />
            <i />
            <i />
            <span>access-trace / checkout</span>
          </div>
          <p>
            <b>✓</b> 14 keyboard stops traced
          </p>
          <p>
            <b>✓</b> 4 landmarks mapped
          </p>
          <p className="bad">
            <b>!</b> 2 regressions found
          </p>
          <div>
            <span>Previously</span>
            <strong>“Place order, button”</strong>
            <span>Now</span>
            <strong>“Button, unlabeled”</strong>
          </div>
        </div>
      </section>
      <section id="workspace" className="workspace">
        <div className="section-label">01 · LOCAL PLAYGROUND</div>
        <div className="title-row">
          <div>
            <h2>Find the regression, not just the rule.</h2>
            <p>
              Choose a scenario or edit the candidate markup. Everything runs
              locally in your browser.
            </p>
          </div>
          <span className="local">
            <Check size={14} /> No data leaves this device
          </span>
        </div>
        <div className="scenario-tabs">
          {scenarios.map((item, index) => (
            <button
              className={scenario === index ? "active" : ""}
              key={item.name}
              onClick={() => choose(index)}
            >
              {item.name}
              <small>{item.description}</small>
            </button>
          ))}
        </div>
        <div className="editors">
          <article>
            <header>
              <span>BASELINE · accessible release</span>
              <button
                type="button"
                onClick={() => {
                  setBaseline(candidate);
                  setRan(true);
                }}
                title="Treat the current Candidate markup as the known-good accessibility baseline"
                style={{
                  border: "1px solid #147553",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#147553",
                  padding: "5px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <Check size={13} /> Set Candidate as baseline
              </button>
            </header>
            <textarea
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              spellCheck={false}
            />
          </article>
          <article>
            <header>
              <span>CANDIDATE · current branch</span>
              <Code2 size={15} />
            </header>
            <textarea
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
              spellCheck={false}
            />
          </article>
        </div>
        <button className="scan-button" onClick={() => setRan(!ran)}>
          <Play size={16} fill="currentColor" />{" "}
          {ran ? "Re-run comparison" : "Run comparison"}
        </button>
        {ran && (
          <Results
            before={before}
            after={after}
            regressions={regressions}
            candidate={candidate}
            setCandidate={setCandidate}
          />
        )}
      </section>
      <section id="how" className="how">
        <div className="section-label">02 · HOW IT WORKS</div>
        <div className="steps">
          <article>
            <span>01</span>
            <Keyboard />
            <h3>Trace the keyboard journey</h3>
            <p>
              Maps every reachable control in the same order a keyboard user
              encounters it.
            </p>
          </article>
          <article>
            <span>02</span>
            <Volume2 />
            <h3>Build the screen-reader journey</h3>
            <p>
              Reads roles, names, headings, landmarks, labels, and dialog
              semantics.
            </p>
          </article>
          <article>
            <span>03</span>
            <GitCompareArrows />
            <h3>Compare change, not noise</h3>
            <p>
              Surfaces only new accessibility failures introduced by the
              candidate.
            </p>
          </article>
        </div>
      </section>
      <footer>
        <span className="brand">
          <span>◈</span>AccessTrace
        </span>
        <p>Accessibility regressions, made visible.</p>
        <span>OpenAI Build Week 2026</span>
      </footer>
    </main>
  );
}
function Results({
  before,
  after,
  regressions,
  candidate,
  setCandidate,
}: {
  before: Scan;
  after: Scan;
  regressions: Finding[];
  candidate: string;
  setCandidate: (value: string) => void;
}) {
  return (
    <div className="results">
      <div className="result-head">
        <div>
          <p>COMPARISON RESULT</p>
          <h3>
            {regressions.length
              ? `${regressions.length} regression${regressions.length > 1 ? "s" : ""} introduced`
              : "No new regressions found"}
          </h3>
        </div>
        <span className={regressions.length ? "risk" : "safe"}>
          {regressions.length ? (
            <>
              <AlertTriangle size={14} /> Needs attention
            </>
          ) : (
            <>
              <Check size={14} /> Safe to merge
            </>
          )}
        </span>
      </div>
      <div className="result-grid">
        <article>
          <p className="metric">KEYBOARD JOURNEY</p>
          <b>
            {before.focus.length} <ArrowRight size={15} /> {after.focus.length}
          </b>
          <span>focusable stops</span>
          <ol>
            {after.focus.map((item, index) => (
              <li key={item.id}>
                <em>{String(index + 1).padStart(2, "0")}</em>
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </li>
            ))}
          </ol>
        </article>
        <article>
          <p className="metric">SCREEN-READER REGRESSIONS</p>
          {regressions.length ? (
            regressions.map((item) => (
              <div className="finding" key={item.id}>
                <span className={item.severity}>{item.severity}</span>
                <div>
                  <b>{item.title}</b>
                  <p>{item.detail}</p>
                  <code>{item.target}</code>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">
              <ShieldCheck size={28} />
              <p>The candidate preserves the baseline accessibility journey.</p>
            </div>
          )}
        </article>
        <article>
          <p className="metric">SEMANTIC MAP</p>
          <div className="semantic">
            <span>
              <Landmark size={15} /> {after.landmarks.length} landmarks
            </span>
            <span>
              <Eye size={15} /> {after.headings.length} headings
            </span>
            <span>
              <FileWarning size={15} /> {after.findings.length} total findings
            </span>
          </div>
          <p className="reader">What a screen reader hears first:</p>
          <blockquote>
            {after.focus[0]
              ? `${after.focus[0].name}, ${after.focus[0].role}.`
              : "No focusable element found."}
          </blockquote>
        </article>
      </div>
      {regressions.length > 0 && (
        <FixPreviewPanel candidate={candidate} setCandidate={setCandidate} />
      )}
    </div>
  );
}
