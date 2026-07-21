import { NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    const { url } = await request.json();
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return NextResponse.json({ error: "Use an http or https URL." }, { status: 400 });
    browser = await chromium.launch({ channel: "chrome", headless: true, timeout: 15_000 });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    // Network-idle never settles on many modern apps because analytics and streaming
    // connections remain open. DOM content plus a short render window is deterministic.
    await page.goto(parsed.toString(), { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForTimeout(750);
    const challenge = await page.evaluate(() => {
      const title = document.title.toLowerCase();
      const text = document.body.innerText.slice(0, 3000).toLowerCase();
      return /cloudflare|attention required|just a moment|captcha|verify you are human/.test(`${title} ${text}`);
    });
    if (challenge) return NextResponse.json({ error: "This site served a bot-protection or CAPTCHA page instead of the requested content. AccessTrace cannot produce a trustworthy report for it." }, { status: 422 });
    const focus = [] as { name: string; role: string; selector: string }[];
    for (let index = 0; index < 300; index += 1) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        const text = (element.getAttribute("aria-label") || element.textContent || element.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim();
        let focusId = element.getAttribute("data-access-trace-focus-id");
        if (!focusId) {
          focusId = `focus-${document.querySelectorAll("[data-access-trace-focus-id]").length + 1}`;
          element.setAttribute("data-access-trace-focus-id", focusId);
        }
        const selector = element.id ? `#${element.id}` : `[data-access-trace-focus-id="${focusId}"]`;
        return { name: text || "Unlabelled", role: element.getAttribute("role") || element.tagName.toLowerCase(), selector };
      });
      if (!stop || focus.some((item) => item.selector === stop.selector && item.name === stop.name)) break;
      focus.push(stop);
    }
    const headings = await page.locator("h1,h2,h3,h4,h5,h6").count();
    const landmarks = await page.locator("main,header,footer,nav,aside,[role='main'],[role='navigation'],[role='banner'],[role='contentinfo']").count();
    const issues = focus.filter((stop) => stop.name === "Unlabelled").map((stop, index) => ({
      id: `runner-name-${index}-${stop.selector}`,
      severity: "critical",
      title: "Control has no accessible name",
      target: stop.selector,
      detail: "A real Tab traversal reached this control, but it had no readable name.",
    }));
    return NextResponse.json({ html: await page.content(), source: page.url(), focus, headings, landmarks, issues, rendered: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Browser scan failed." }, { status: 400 });
  } finally {
    await browser?.close();
  }
}
