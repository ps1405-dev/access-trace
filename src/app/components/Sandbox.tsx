"use client";

import React, { useEffect, useRef } from "react";

interface SandboxProps {
  code: string;
}

export default function Sandbox({ code }: SandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const completeHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Adding KaTeX for beautiful math formulas in the UI -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #0b0f19;
            color: #ffffff;
            font-family: ui-sans-serif, system-ui, sans-serif;
            overflow-x: hidden;
            height: 100vh;
          }
          /* Custom scrollbar styling for iframe elements */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #0b0f19;
          }
          ::-webkit-scrollbar-thumb {
            background: #1e293b;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #334155;
          }
        </style>
      </head>
      <body>
        <!-- The generated code will mount its own canvases, sliders, and sidebars here -->
        <div id="simulation-mount" class="w-full h-full"></div>
        
        <script>
          try {
            if (window.currentAnimationId) {
              cancelAnimationFrame(window.currentAnimationId);
            }
            ${code}
          } catch (error) {
            document.body.innerHTML = \`
              <div class="p-6 max-w-md mx-auto my-12 bg-red-950/50 border border-red-500/30 rounded-lg text-red-200">
                <h3 class="font-bold text-lg mb-2 text-red-400">Execution Error</h3>
                <pre class="whitespace-pre-wrap text-xs bg-black/40 p-3 rounded font-mono text-red-300">\${error.message}</pre>
              </div>
            \`;
          }
        </script>
      </body>
      </html>
    `;

    iframeRef.current.srcdoc = completeHtml;
  }, [code]);

  return (
    <div className="w-full h-full min-h-[500px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950 relative shadow-2xl">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
          <span className="ml-2 font-medium text-slate-300">simulation_sandbox.html</span>
        </div>
        <div className="bg-slate-950/50 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/20">
          Live Runtime Active
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="Simulation Sandbox Engine"
        className="w-full h-[calc(100%-37px)] bg-[#0b0f19]"
        sandbox="allow-scripts"
      />
    </div>
  );
}