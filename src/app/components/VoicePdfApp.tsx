"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  FileText, 
  BookOpen, 
  UploadCloud, 
  CheckCircle, 
  X, 
  Volume2, 
  Loader2 
} from "lucide-react";

// Types representing files in our document library
interface LibraryFile {
  id: string;
  name: string;
  size: string;
  content: string;
}

export default function VoicePdfApp() {
  // Speech Recognition & TTS States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // PDF Library & File Upload States
  const [pdfLibrary, setPdfLibrary] = useState<LibraryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LibraryFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true; // Keeps listening continuous!
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          const currentResultIndex = event.resultIndex;
          const speechToText = event.results[currentResultIndex][0].transcript;
          setTranscript(speechToText);
          handleVoiceCommand(speechToText);
        };

        rec.onerror = (err: any) => {
          console.error("Speech Recognition Error:", err);
        };

        rec.onend = () => {
          // If state is still listening, auto-restart (avoids native timeouts)
          if (isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Auto-restart failed, web speech API busy.");
            }
          }
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, pdfLibrary]); // depend on library to allow access to current list in commands

  // Speak AI Response Out Loud
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Voice Capture (Left-side Touch Action)
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      speakText("Stopped listening.");
    } else {
      setIsListening(true);
      recognitionRef.current.start();
      speakText("Continuous listening turned on. Go ahead, speak.");
    }
  };

  // Process Voice Commands (Including Library Selection)
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase().trim();
    setAiResponse(`Heard: "${command}"`);

    // Check for explicit "select/open/read" commands
    const selectKeywords = ["select", "open", "read", "load", "show me"];
    const isSelectCommand = selectKeywords.some(keyword => lowerCommand.startsWith(keyword));

    if (isSelectCommand) {
      // Extract target file name phrase
      let targetPhrase = lowerCommand;
      selectKeywords.forEach(keyword => {
        if (targetPhrase.startsWith(keyword)) {
          targetPhrase = targetPhrase.replace(keyword, "").trim();
        }
      });

      // Find closest matching file in library
      if (pdfLibrary.length === 0) {
        const reply = "Your library is empty. Please upload some PDF files first.";
        setAiResponse(reply);
        speakText(reply);
        return;
      }

      let bestMatch: LibraryFile | null = null;
      let highestScore = 0;

      pdfLibrary.forEach(file => {
        const fileNameLower = file.name.toLowerCase();
        // Check exact match, inclusion or word overlap
        if (fileNameLower.includes(targetPhrase) || targetPhrase.includes(fileNameLower)) {
          bestMatch = file;
          highestScore = 100;
        }
      });

      if (bestMatch) {
        setSelectedFile(bestMatch);
        const reply = `Successfully opened the PDF: ${(bestMatch as LibraryFile).name}. What would you like to know about it?`;
        setAiResponse(reply);
        speakText(reply);
      } else {
        const reply = `I couldn't find a PDF matching "${targetPhrase}" in your library. Please try again.`;
        setAiResponse(reply);
        speakText(reply);
      }
    } else {
      // General Q&A with context of the currently selected PDF
      if (selectedFile) {
        // Here you would hook into your API to ask queries against selectedFile.content
        const reply = `Analyzing "${selectedFile.name}" for: "${command}". (Backend logic goes here!)`;
        setAiResponse(reply);
        speakText(reply);
      } else {
        const reply = "Please select a PDF first by saying: select, followed by the file name.";
        setAiResponse(reply);
        speakText(reply);
      }
    }
  };

  // Parse PDF File via Server Action API
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported!");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text from PDF.");
      }

      const result = await response.json();

      const newLibraryFile: LibraryFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        content: result.text,
      };

      setPdfLibrary(prev => [...prev, newLibraryFile]);
      // Auto-select newly uploaded file
      setSelectedFile(newLibraryFile);
      speakText(`Successfully parsed and added ${file.name} to your library.`);
    } catch (err: any) {
      setUploadError(err.message || "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      
      {/* LEFT SIDE: Active Voice Control Panel & System State */}
      <div 
        onClick={toggleListening}
        className={`w-full md:w-1/3 flex flex-col justify-between p-8 border-b md:border-b-0 md:border-r border-neutral-800 transition-all duration-300 cursor-pointer ${
          isListening 
            ? "bg-emerald-950/40 hover:bg-emerald-950/50 border-emerald-800" 
            : "bg-neutral-950 hover:bg-neutral-900/80"
        }`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isListening ? "bg-emerald-500 animate-pulse" : "bg-neutral-800"}`}>
              {isListening ? <Mic className="w-6 h-6 text-neutral-950" /> : <MicOff className="w-6 h-6 text-neutral-400" />}
            </div>
            <h2 className="text-xl font-bold tracking-tight">Voice Action Toggle</h2>
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            {isListening 
              ? "Listening continuously... Click anywhere in this box to shut it off manually." 
              : "Click anywhere on this panel to toggle voice capture ON."}
          </p>
        </div>

        <div className="my-8 flex flex-col gap-4">
          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 min-h-[100px] flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Live Speech Input</span>
            <p className="text-sm italic text-neutral-300 mt-2">
              {transcript || "Speak to control or ask questions..."}
            </p>
          </div>

          <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 min-h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">AI Assistant System</span>
              {isSpeaking && <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />}
            </div>
            <p className="text-sm text-neutral-200 mt-2 leading-relaxed">
              {aiResponse || "System is idle. Enable voice or request a library file."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Voice Engine Operational
        </div>
      </div>

      {/* RIGHT SIDE: Dedicated Document Library & Upload Manager */}
      <div className="flex-1 flex flex-col bg-neutral-950 overflow-y-auto">
        
        {/* Header Block with Integrated PDF Uploader */}
        <div className="p-8 border-b border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Document Library</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Command via voice: say <span className="text-emerald-400 font-mono">"select [filename]"</span> to read from any item
            </p>
          </div>

          {/* Hidden standard input wrapped in styling container */}
          <label className="relative flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl cursor-pointer text-sm font-semibold transition-all">
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <UploadCloud className="w-4 h-4 text-emerald-400" />
            )}
            <span>{isUploading ? "Uploading & Parsing PDF..." : "Upload PDF"}</span>
            <input 
              type="file" 
              accept=".pdf,application/pdf" 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={isUploading}
            />
          </label>
        </div>

        {uploadError && (
          <div className="mx-8 mt-6 p-4 bg-rose-950/40 border border-rose-900/60 text-rose-200 rounded-xl text-xs flex justify-between items-center">
            <span>{uploadError}</span>
            <button onClick={() => setUploadError("")}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Visual Content Display */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List of Library PDFs */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">Uploaded PDF Repositories ({pdfLibrary.length})</h3>
            
            {pdfLibrary.length === 0 ? (
              <div className="border border-dashed border-neutral-800 rounded-2xl p-12 text-center text-neutral-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-neutral-700" />
                <p className="text-sm">No PDF directories available. Upload files to assemble your library.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pdfLibrary.map((file) => {
                  const isActive = selectedFile?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        setSelectedFile(file);
                        speakText(`Switched to active document: ${file.name}`);
                      }}
                      className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                        isActive 
                          ? "bg-neutral-900 border-emerald-500 shadow-md shadow-emerald-950/10" 
                          : "bg-neutral-900/50 border-neutral-800/80 hover:bg-neutral-900"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <FileText className={`w-8 h-8 ${isActive ? "text-emerald-400" : "text-neutral-500"}`} />
                        {isActive && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">Active <CheckCircle className="w-3 h-3" /></span>}
                      </div>
                      <h4 className="font-bold text-sm mt-4 text-neutral-100 truncate">{file.name}</h4>
                      <p className="text-xs text-neutral-500 mt-1">{file.size}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Context Explorer */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-1">Active File Viewer</h3>
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
              {selectedFile ? (
                <div>
                  <div className="border-b border-neutral-800 pb-4 mb-4">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Selected Context</span>
                    <h3 className="text-md font-bold text-neutral-200 mt-1 truncate">{selectedFile.name}</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto text-xs text-neutral-400 leading-relaxed scrollbar-thin">
                    {selectedFile.content || "Empty content parsed."}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-neutral-600">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-xs">No active document selected.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}