import { NextResponse } from "next/server";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Please choose a PDF file." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Setu currently accepts PDF documents." }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Please upload a PDF smaller than 50 MB." }, { status: 400 });

    // Text extraction does not draw pages, but PDF.js expects these browser names
    // to exist while loading in Node. Lightweight shims avoid a native canvas dependency.
    const runtime = globalThis as unknown as Record<string, unknown>;
    if (!runtime.DOMMatrix) runtime.DOMMatrix = class DOMMatrix {};
    if (!runtime.ImageData) runtime.ImageData = class ImageData {};
    if (!runtime.Path2D) runtime.Path2D = class Path2D {};
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs")).toString();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useSystemFonts: true }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item: { str?: string }) => item.str || "").join(" ").replace(/\s+/g, " ").trim();
      if (text) pages.push(`Page ${pageNumber}: ${text}`);
    }
    return NextResponse.json({ text: pages.join("\n\n"), pages: pdf.numPages });
  } catch (error) {
    console.error("PDF parsing error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Setu could not read this PDF." }, { status: 422 });
  }
}
