"use client";

import { useState } from "react";
import {
  Check,
  Download,
  Globe2,
  Loader2,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import "./workspace.css";
import "./runner.css";

type Issue = {
  id: string;
  severity: "critical" | "warning";
  title: string;
  target: string;
  detail: string;
};
type BrowserReport = {
  stops: { name: string; role: string; selector: string }[];
  issues: Issue[];
  headings: number;
  landmarks: number;
  html: string;
  source: string;
};

export default function Workspace() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<BrowserReport | null>(null);
  const [baseline, setBaseline] = useState<BrowserReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scan = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/import-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReport({
        stops: data.focus,
        issues: data.issues,
        headings: data.headings,
        landmarks: data.landmarks,
        html: data.html,
        source: data.source,
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Browser scan failed.",
      );
    } finally {
      setLoading(false);
    }
  };
  const regressions =
    report && baseline
      ? report.issues.filter(
          (issue) => !baseline.issues.some((old) => old.id === issue.id),
        )
      : report?.issues || [];
  const safe = Boolean(baseline && regressions.length === 0);
  const exportReport = () => {
    if (!report) return;
    const content = JSON.stringify(
      {
        tool: "AccessTrace",
        engine: "Playwright Chromium",
        source: report.source,
        baseline,
        candidate: report,
        newRegressions: regressions,
      },
      null,
      2,
    );
    const objectUrl = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "access-trace-browser-report.json";
    link.click();
    URL.revokeObjectURL(objectUrl);
  };
  return (
    <main className="studio">
      <nav>
        <a href="/" className="brand">
          <span>◈</span>AccessTrace
        </a>
        <div className="nav-links" aria-label="Product navigation">
          <a href="/">Playground</a>
          <a href="/workspace" aria-current="page">Browser Scan</a>
        </div>
        <button onClick={exportReport} disabled={!report}>
          <Download size={15} /> Export report
        </button>
      </nav>
      <section className="intro">
        <p>02 · RENDERED BROWSER SCAN</p>
        <h1>Test the page users actually receive.</h1>
        <span>
          AccessTrace opens the URL in Chromium, waits for rendering, and
          follows real Tab focus.
        </span>
      </section>
      <section className="studio-grid">
        <aside>
          <div className="project">
            <p>ACCESS TRACE</p>
            <h3>Live URL scanning</h3>
            <small>Rendered Chromium journey</small>
          </div>
          <p className="aside-label">SCAN FLOW</p>
          <div className="step">
            <span>
              <b>1. Scan live URL</b>
              <small>Render, wait, then follow Tab</small>
            </span>
          </div>
          <div className="step">
            <span>
              <b>2. Set baseline</b>
              <small>Save the known-good journey</small>
            </span>
          </div>
          <div className="step">
            <span>
              <b>3. Compare scans</b>
              <small>Review only new regressions</small>
            </span>
          </div>
        </aside>
        <div className="canvas">
          <div className="urlbar">
            <Globe2 size={17} />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com or http://localhost:3000"
            />
            <button onClick={scan} disabled={loading || !url}>
              {loading ? (
                <Loader2 className="spin" size={15} />
              ) : (
                <ScanSearch size={15} />
              )}{" "}
              Run browser scan
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          {!report ? (
            <div className="report loading-report">
              <ScanSearch size={21} />
              <div>
                <b>Ready for a real browser scan</b>
                <p>
                  Enter a URL. Static HTML is never used for keyboard-stop
                  counts.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="workhead">
                <div>
                  <p>LIVE BROWSER RESULT</p>
                  <h2>{new URL(report.source).hostname}</h2>
                </div>
                <div>
                  <button
                    onClick={() => setBaseline(report)}
                    className="outline"
                  >
                    <Check size={15} /> Save baseline
                  </button>
                  <button onClick={exportReport}>
                    <Download size={15} /> Export CI report
                  </button>
                </div>
              </div>
              <div className="report">
                <div className="score">
                  <div>
                    <p>
                      {baseline ? "BASELINE COMPARISON" : "FIRST BROWSER SCAN"}
                    </p>
                    <h2>
                      {baseline
                        ? safe
                          ? "No new regressions"
                          : `${regressions.length} new issue${regressions.length > 1 ? "s" : ""}`
                        : `${regressions.length} issue${regressions.length !== 1 ? "s" : ""} found`}
                    </h2>
                  </div>
                  <span className={safe ? "good" : "warn"}>
                    {safe ? (
                      <>
                        <ShieldCheck size={15} /> Safe to merge
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={15} /> Review required
                      </>
                    )}
                  </span>
                </div>
                <div className="stats">
                  <span>
                    <b>{report.stops.length}</b> real keyboard stops
                  </span>
                  <span>
                    <b>{report.headings}</b> rendered headings
                  </span>
                  <span>
                    <b>{report.landmarks}</b> landmarks
                  </span>
                </div>
                <div className="issues">
                  {regressions.length ? (
                    regressions.map((issue) => (
                      <article key={issue.id}>
                        <i className={issue.severity} />
                        <div>
                          <b>{issue.title}</b>
                          <p>{issue.detail}</p>
                          <code>{issue.target}</code>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="clean">
                      <ShieldCheck size={21} /> No accessibility issues were
                      found by this browser scan.
                    </p>
                  )}
                </div>
              </div>
              <div className="journey">
                <p>ACTUAL TAB JOURNEY</p>
                {report.stops.map((stop, index) => (
                  <div key={`${stop.selector}-${index}`}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span>{stop.name}</span>
                    <small>
                      {stop.role} · {stop.selector}
                    </small>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <footer>
        <span className="brand">
          <span>◈</span>AccessTrace
        </span>
        <p>Rendered accessibility journeys, made visible.</p>
        <span>Browser Scan</span>
      </footer>
    </main>
  );
}
