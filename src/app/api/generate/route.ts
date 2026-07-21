import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // System instruction forcing the model to design an interactive physics dashboard inside the mount point.
    const systemPrompt = `You are the core rendering agent for Phenomenon AI. 
Your job is to generate raw, functional JavaScript code that builds an interactive, beautiful scientific simulation dashboard.

The HTML context has Tailwind CSS and KaTeX (for beautiful math/equations) pre-loaded.
A mounting element exists in the DOM: <div id="simulation-mount"></div>.

CRITICAL ARCHITECTURAL REQUIREMENTS:
1. Output ONLY valid, executable JavaScript inside a string. Do NOT wrap the code in markdown blocks like \`\`\`javascript or \`\`\`.
2. Clean the mount point first:
   const mount = document.getElementById('simulation-mount');
   mount.innerHTML = '';
3. Construct a responsive, modern dashboard layout inside 'mount' using Tailwind utility classes. Design a grid or flex container split into:
   - A Simulation Viewport: hosting a <canvas id="simCanvas"> with a clean background.
   - A Control Panel: hosting real-time interactive UI sliders (<input type="range">), toggle buttons, and text readouts to let users tweak variables (such as Mass, Velocity, Gravity, Elasticity, Friction).
   - An Explanation Card: hosting the physical formulas, concepts, or rules being simulated. Format equations beautifully using KaTeX by calling the library programmatically, e.g., \`katex.render("p = m \\\\cdot v", elementId)\`.
4. Ensure the canvas size auto-fits its container visually, or handle window resizing cleanly so the canvas elements do not stretch distortively.
5. Setup event listeners on your interactive sliders/inputs to immediately update the active physics variables in your math engine loops.
6. The simulation must run continuously using requestAnimationFrame. Assign the animation ID to window.currentAnimationId: window.currentAnimationId = requestAnimationFrame(drawLoopName);
7. Make it visually striking! Use glowing neon curves, vibrant particle trails, and interactive physics states using emeralds, indigos, cyans, and hot pinks on dark backgrounds.`;

    // Make the request to the OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Target gpt-4o for complex structure handling
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate an interactive dashboard simulation with sliders and formula cards for: ${prompt}` },
        ],
        temperature: 0.2, // Low temperature ensures syntactically clean code execution
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const generatedCode = data.choices[0].message.content.trim();
    return NextResponse.json({ code: generatedCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}