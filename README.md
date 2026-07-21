# AccessTrace

AccessTrace is an accessibility regression guardrail for teams that ship web experiences.

It compares a known-good baseline with a changed candidate, traces the keyboard and screen-reader journey, identifies regressions introduced by the change, and offers safe, verifiable remediation for supported issues.

Built for OpenAI Build Week 2026.

## Why AccessTrace

Visual QA often misses accessibility regressions. A release can look perfect while a button loses its accessible name, a form field loses its label, or keyboard users can no longer complete a task.

AccessTrace makes those regressions visible before release.

## Features

### Playground

Paste a known-good HTML baseline and a changed Candidate version. AccessTrace compares:

- Keyboard-focusable controls and their order
- Accessible names for buttons, links, and fields
- Programmatic form labels
- Headings and landmarks
- New issues introduced by the Candidate

### Safe Fix Preview

For deterministic issues, AccessTrace shows an exact patch that can be applied directly to Candidate markup. The comparison then updates immediately so developers can verify the change is safe to merge.

Currently supported automatic fixes include:

- Adding persistent labels to identifiable form controls
- Restoring visible text to identifiable unnamed buttons

### Browser Scan

Scan a live URL using a rendered Chromium session. Browser Scan waits for page rendering and follows actual `Tab` focus, providing a real keyboard journey instead of a static HTML element count.

## Workflow

1. Start with a known-good page and save it as the baseline.
2. Paste or scan a changed version as the Candidate.
3. Review only the new accessibility regressions.
4. Apply a safe patch where available.
5. Re-run the comparison and verify the Candidate is safe to merge.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Playwright and Chromium
- Lucide React
- Vercel for deployment

## How we used Codex and GPT-5.6

AccessTrace was built through an iterative collaboration with Codex using GPT-5.6.

Codex accelerated the project from early product exploration through implementation. It helped us evaluate several directions, narrow the project to accessibility regression testing, build the Next.js interface, implement baseline and candidate comparison, add remediation patches, create the rendered Browser Scan flow, diagnose deployment issues, and prepare the README and submission materials.

The key product decisions remained human-led. We chose to focus on regressions rather than generic accessibility scores, to show the actual keyboard and screen-reader journey, and to limit automatic fixes to changes that can be verified safely.

GPT-5.6 was used throughout the Codex workflow for code generation, debugging, UI iteration, technical reasoning, test-case design, and documentation. It helped turn feedback from real browser tests into concrete improvements, including fixing misleading static keyboard-stop counts and improving the Playground workflow from detection to remediation and verification.

## Run locally

Prerequisites:

- Node.js 20 or later
- Google Chrome installed for Browser Scan

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use the Playground at `/` for local markup comparison and Browser Scan at `/workspace` for rendered URL testing.

## Test the Playground

1. Open the Playground.
2. Use the built-in Checkout regression scenario, or paste your own HTML.
3. Click `Set Candidate as baseline` when the Candidate represents a known-good version.
4. Change the Candidate markup, then run the comparison.
5. Apply available safe patches and confirm `Safe to merge`.

## Architecture

The Playground performs deterministic local analysis with `DOMParser`. It creates accessibility-focused maps of interactive controls, names, labels, headings, and landmarks for both baseline and candidate markup.

Browser Scan uses the server route at `src/app/api/import-page/route.ts`. It launches Chromium, waits for the URL to render, follows real Tab traversal, and returns the rendered accessibility journey to the interface.

## Important limitations

AccessTrace is designed to surface high-value accessibility regressions, not to replace a complete manual accessibility audit or testing with assistive-technology users.

Automatic fixes are intentionally limited to cases that can be applied and verified deterministically. Complex issues such as focus trapping, meaningful alternative text, and interaction design require developer review.

Browser Scan needs a Chromium-compatible browser runtime. For cloud deployment, configure a supported server-side browser runtime or browser automation provider.

## Future work

- Dialog naming and focus-trap checks
- Focus-visibility checks
- Image alternative-text review
- Pull-request and CI integration
- Saved projects and team baselines
- Cloud browser execution for scalable URL scanning

## License

This project was created for hackathon demonstration and evaluation.
