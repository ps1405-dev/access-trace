import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildOfflineLesson } from "@/lib/offlineLesson";

export const runtime = "nodejs";
let useOfflineEngine = false;

type LearningResponse = {
  title: string;
  hook: string;
  explanation: string;
  keyIdeas: string[];
  questions: { question: string; answer: string }[];
  nextStep: string;
};

export async function POST(request: Request) {
  let source = "";
  let topic = "";
  try {
    const body = await request.json();
    topic = body.topic || "";
    const dialect = body.dialect || "English";
    source = body.activeFileContent || "";
    if (!source.trim()) return NextResponse.json({ error: "Lesson text is required." }, { status: 400 });
    if (!process.env.OPENAI_API_KEY || useOfflineEngine) return NextResponse.json(buildOfflineLesson(source, topic));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `You are Setu, an expert learning designer for students including blind and low-vision learners. Return valid JSON only with exactly these fields: title (string), hook (string), explanation (string), keyIdeas (array of exactly 3 strings), questions (array of exactly 2 objects with question and answer strings), nextStep (string).
Explain the supplied material; never repeat it verbatim, never include a heading/footer from it, and never invent facts. Write in clear, warm, audio-ready ${dialect}. The request is: ${topic || "create a simple explanation"}.`,
        },
        { role: "user", content: source.slice(0, 18000) },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No lesson returned by the model.");
    const lesson = JSON.parse(content) as LearningResponse;
    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Setu lesson generation error:", error);
    if (error instanceof Error && error.message.includes("429")) useOfflineEngine = true;
    return NextResponse.json(buildOfflineLesson(source, topic));
  }
}
