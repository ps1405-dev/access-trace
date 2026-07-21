"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { BookOpen, FileText, FolderOpen, Loader2, Mic, MicOff, Save, Sparkles, Upload, Volume2 } from "lucide-react";

type Book = { id: string; title: string; subject: string; text: string; pages?: number };
type StudyAction = "summary" | "notes" | "formulae";

const starterBooks: Book[] = [
  { id: "ohms-law", title: "NCERT Class 9 Science — Electricity", subject: "Physics", text: "Ohm's law states that the current through a conductor is directly proportional to the voltage across it, provided temperature remains constant. The relationship is V equals I multiplied by R, where V is voltage, I is current and R is resistance.", pages: 1 },
  { id: "black-soil", title: "Class 10 Geography — Black Soil", subject: "Geography", text: "Black soil occurs in the Deccan Trap region. It is clayey, holds moisture well, swells when wet and is especially suitable for cotton cultivation.", pages: 1 },
];

function fallback(action: StudyAction, text: string) {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  if (action === "formulae") {
    const formulas = text.match(/[A-Z][a-z]?\s*=\s*[^.,;]+/g) || [];
    return formulas.length ? `Formulae found: ${formulas.join(". ")}. Say each equation in words and define every symbol before using it.` : "No symbolic formula was found on this page. Setu recommends focusing on the quantities, relationships, and definitions in the lesson.";
  }
  if (action === "notes") return `Study notes. ${sentences.slice(0, 3).join(" ")} Key revision move: explain the relationship between the main terms without looking at the page.`;
  return `Page summary. ${sentences.slice(0, 2).join(" ")}`;
}

export default function AccessStudio() {
  const [books, setBooks] = useState<Book[]>(starterBooks);
  const [activeBook, setActiveBook] = useState<Book>(starterBooks[0]);
  const [answer, setAnswer] = useState("Ready. Choose an action, or touch the listening panel and say “summarise this page.”");
  const [isListening, setIsListening] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const recognition = useRef<any>(null);
  const listeningRef = useRef(false);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(text);
    message.lang = "en-IN";
    message.rate = 0.9;
    window.speechSynthesis.speak(message);
  };

  const runAction = async (action: StudyAction, shouldSpeak = true) => {
    setIsWorking(true);
    try {
      const request = action === "summary" ? "Summarise this page in 4 short, speakable sentences." : action === "notes" ? "Create concise study notes with definitions and relationships." : "Extract every formula and write each one in spoken plain English, defining each variable.";
      const response = await fetch("/api/translate-lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: request, dialect: "English", activeFileContent: activeBook.text }) });
      const data = await response.json();
      const result = response.ok && data.explanation ? `${data.title}. ${data.explanation} ${data.keyIdeas?.join(". ") || ""}` : fallback(action, activeBook.text);
      setAnswer(result);
      if (shouldSpeak) speak(result);
    } catch { const result = fallback(action, activeBook.text); setAnswer(result); if (shouldSpeak) speak(result); }
    finally { setIsWorking(false); }
  };

  const saveVoice = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: answer }) });
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `${activeBook.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-setu.mp3`; link.click(); URL.revokeObjectURL(url);
      speak("Your audio lesson has been saved.");
    } catch { speak("Setu could not save the audio right now. Please try again."); }
    finally { setIsSaving(false); }
  };

  const handleCommand = (spoken: string) => {
    const command = spoken.toLowerCase();
    if (command.includes("stop listening")) { recognition.current?.stop(); return; }
    if (command.includes("save") && command.includes("audio")) { saveVoice(); return; }
    if (command.includes("formula")) { runAction("formulae"); return; }
    if (command.includes("note")) { runAction("notes"); return; }
    if (command.includes("summary") || command.includes("summarise") || command.includes("summarize")) { runAction("summary"); return; }
    const match = books.find((book) => command.includes(book.title.toLowerCase().split("—").pop()?.trim().split(" ").slice(-1)[0] || ""));
    if (match) { setActiveBook(match); const reply = `Opened ${match.title}. What would you like to do with this page?`; setAnswer(reply); speak(reply); return; }
    const reply = "I heard your request, but I need one of these commands: summarise this page, make notes, extract formulae, open a book, or save audio."; setAnswer(reply); speak(reply);
  };

  useEffect(() => {
    const browserWindow = window as typeof window & { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const SpeechRecognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const engine = new SpeechRecognition(); engine.continuous = true; engine.interimResults = false; engine.lang = "en-IN";
    engine.onresult = (event: any) => handleCommand(event.results[event.resultIndex][0].transcript);
    engine.onend = () => { if (listeningRef.current) { try { engine.start(); } catch { /* speech engine already active */ } } };
    engine.onerror = () => { setIsListening(false); listeningRef.current = false; };
    recognition.current = engine;
    return () => engine.stop();
  }, [books, activeBook]);

  const toggleListening = () => {
    if (!recognition.current) { setAnswer("Speech recognition is not supported in this browser. You can still use every action button."); return; }
    if (isListening) { listeningRef.current = false; recognition.current.stop(); setIsListening(false); speak("Listening stopped."); }
    else { listeningRef.current = true; recognition.current.start(); setIsListening(true); speak("Listening started. Ask Setu to summarise, make notes, extract formulae, open a book, or save audio."); }
  };

  const uploadBook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setIsWorking(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/parse-pdf", { method: "POST", body: form }); const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const book = { id: crypto.randomUUID(), title: file.name.replace(/\.pdf$/i, ""), subject: "Your library", text: data.text, pages: data.pages };
      setBooks((current) => [...current, book]); setActiveBook(book); setAnswer(`${book.title} is ready. I found ${data.pages} pages. Ask Setu to summarise, make notes, or extract formulae.`); speak(`${book.title} has been added to your library.`);
    } catch (error) { const message = error instanceof Error ? error.message : "Setu could not read this PDF."; setAnswer(message); speak(message); }
    finally { setIsWorking(false); event.target.value = ""; }
  };

  return <section id="access" className="access-section">
    <div className="section-label"><span>02</span><p>SETU ACCESS MODE</p></div>
    <div className="access-heading"><div><h2>Touch. Speak. Learn.</h2><p>A dedicated voice-first workspace for blind and low-vision learners. Every requested action is answered aloud.</p></div><span className="access-badge"><Volume2 size={15} /> Voice-first learning</span></div>
    <div className="access-grid">
      <button className={`listen-panel ${isListening ? "listening" : ""}`} onClick={toggleListening} aria-pressed={isListening}><span className="touch-label">TOUCH ANYWHERE TO {isListening ? "STOP" : "START"}</span><div className="listen-icon">{isListening ? <Mic size={35} /> : <MicOff size={35} />}</div><h3>{isListening ? "Setu is listening" : "Setu is ready"}</h3><p>{isListening ? "Say: summarise this page, make notes, extract formulae, open a book, or save audio." : "Touch this entire panel to use voice commands."}</p><span className="status-dot"><i /> {isListening ? "Live voice control" : "Touch to speak"}</span></button>
      <div className="access-workspace"><div className="library-row"><div><span className="card-kicker">YOUR LIBRARY</span><h3><FolderOpen size={18} /> {activeBook.title}</h3><small>{activeBook.subject} · {activeBook.pages || 1} page{activeBook.pages === 1 ? "" : "s"}</small></div><label className="upload-button"><Upload size={16} /> Upload PDF<input type="file" accept="application/pdf" onChange={uploadBook} /></label></div><div className="book-picker">{books.map((book) => <button key={book.id} onClick={() => { setActiveBook(book); setAnswer(`${book.title} selected. Choose an action or ask by voice.`); }} className={activeBook.id === book.id ? "active" : ""}><BookOpen size={15} />{book.title}</button>)}</div><div className="action-row"><button onClick={() => runAction("summary")}><Sparkles size={16} /> Summarise page</button><button onClick={() => runAction("notes")}><FileText size={16} /> Make notes</button><button onClick={() => runAction("formulae")}><span className="formula-symbol">ƒx</span> Extract formulae</button></div><article className="voice-answer"><div><span className="card-kicker">SETU SAYS</span>{isWorking && <Loader2 className="spin" size={17} />}</div><p>{answer}</p><div className="answer-actions"><button onClick={() => speak(answer)}><Volume2 size={15} /> Read aloud</button><button onClick={saveVoice} disabled={isSaving}>{isSaving ? <Loader2 className="spin" size={15} /> : <Save size={15} />} Save audio MP3</button></div></article></div>
    </div>
  </section>;
}
