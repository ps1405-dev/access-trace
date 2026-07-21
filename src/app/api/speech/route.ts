import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) return Response.json({ error: "Text is required." }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return Response.json({ error: "OpenAI API key is not configured." }, { status: 503 });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audio = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text.slice(0, 4000),
      response_format: "mp3",
    });
    return new Response(await audio.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Content-Disposition": "attachment; filename=setu-lesson.mp3" } });
  } catch (error) {
    console.error("Setu speech generation error:", error);
    return Response.json({ error: "Setu could not save the audio right now." }, { status: 500 });
  }
}
