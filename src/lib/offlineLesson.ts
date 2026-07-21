export type OfflineLesson = {
  title: string;
  hook: string;
  explanation: string;
  keyIdeas: string[];
  questions: { question: string; answer: string }[];
  nextStep: string;
  offline: true;
};

const glossary: Record<string, string> = {
  "action potential": "a quick electrical signal used by a nerve cell",
  neuron: "a nerve cell that sends and receives messages",
  neurons: "nerve cells that send and receive messages",
  depolarization: "a brief electrical change that starts a nerve signal",
  "voltage-gated sodium channels": "tiny gates that open when the electrical charge changes",
  electrochemical: "involving both electricity and chemicals",
  cascade: "a chain reaction where one event starts the next",
  myelin: "a fatty covering that helps a nerve signal travel quickly",
  axon: "the long fibre that carries a message away from a nerve cell",
  presynaptic: "at the sending end of a connection between nerve cells",
  synapse: "the tiny gap where one nerve cell passes a message to another",
  neurotransmitters: "chemical messengers released by nerve cells",
  receptors: "receiver sites that detect a chemical message",
  membrane: "the thin outer layer of a cell",
  potential: "an electrical charge or difference in charge",
  resistance: "how much something opposes the flow of electric current",
  voltage: "the electrical push that drives current",
  current: "the flow of electric charge",
  conductor: "a material that lets electric current pass through it",
  photosynthesis: "the way green plants use sunlight to make food",
  chlorophyll: "the green substance in leaves that captures sunlight",
  glucose: "a sugar that stores energy for a living thing",
};

const plainPhrases: [RegExp, string][] = [
  [/propagates?/gi, "moves"], [/initiating/gi, "starting"], [/exocytosis/gi, "release"],
  [/preferentially/gi, "mainly"], [/modulating/gi, "changing"], [/utilizing/gi, "using"],
  [/constitute/gi, "make up"], [/demonstrates?/gi, "shows"], [/approximately/gi, "about"],
  [/therefore/gi, "so"], [/however/gi, "but"], [/in order to/gi, "to"],
];

function cleanSource(source: string) {
  return source.replace(/\r/g, "").split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 25 && !/^(page\s*)?\d+(\s+of\s+\d+)?$/i.test(line) && !/copyright|all rights reserved|www\./i.test(line))
    .join(" ").replace(/\s+/g, " ").trim();
}

function sentences(text: string) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()).filter((part) => part.length > 18) || [];
}

function simplify(sentence: string) {
  let result = ` ${sentence.toLowerCase()} `;
  for (const [term, meaning] of Object.entries(glossary)) result = result.replace(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), meaning);
  for (const [pattern, replacement] of plainPhrases) result = result.replace(pattern, replacement);
  result = result.replace(/\b(the|a|an)\s+(a quick|a brief|tiny|the long|chemical|receiver)\b/gi, "$2");
  result = result.replace(/\s+/g, " ").trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function topTerms(text: string) {
  const words = text.toLowerCase().match(/[a-z][a-z-]{3,}/g) || [];
  const ignored = new Set(["this", "that", "with", "from", "into", "through", "their", "there", "which", "when", "where", "these", "those", "they", "then", "than", "have", "will", "were", "been", "being", "about", "between", "individual", "across", "within", "using", "also", "each", "does", "more", "most"]);
  const counts = new Map<string, number>();
  words.forEach((word) => { if (!ignored.has(word)) counts.set(word, (counts.get(word) || 0) + 1); });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([word]) => word).slice(0, 5);
}

function titleFrom(text: string, terms: string[]) {
  const first = text.split(/[.!?]/)[0].replace(/^\s*(the|a|an)\s+/i, "").trim();
  if (first.length >= 8 && first.length <= 65) return first.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return terms.length ? `Understanding ${terms[0]}` : "A clearer way to learn this";
}

function extractFormulae(text: string) {
  const formulas = text.match(/(?:[A-Za-z][A-Za-z₀-₉]*\s*=\s*[^.;,]+)|(?:[A-Za-z]+\s+(?:equals|is proportional to)\s+[^.;,]+)/gi) || [];
  if (!formulas.length) return "No written equation was found. Focus on the relationships named in the passage and say them in words.";
  return formulas.map((formula) => formula
    .replace(/=/g, " equals ")
    .replace(/\*/g, " multiplied by ")
    .replace(/\//g, " divided by ")
    .replace(/\s+/g, " ").trim()).join(". ");
}

export function buildOfflineLesson(source: string, request = "") : OfflineLesson {
  const text = cleanSource(source);
  const parts = sentences(text);
  const terms = topTerms(text);
  const primary = parts[0] || text || "No readable lesson text was supplied.";
  const secondary = parts[1] || "";
  const lowerRequest = request.toLowerCase();
  const formulaMode = /formula|equation/.test(lowerRequest);
  const notesMode = /notes?/.test(lowerRequest);
  const summaryMode = /summary|summaris|explain in short/.test(lowerRequest);
  const topic = terms[0] || "this idea";

  if (formulaMode) {
    const spokenFormulae = extractFormulae(text);
    return {
      title: "Formulae, spoken clearly", hook: "Hear the relationship before trying to memorise the symbols.",
      explanation: spokenFormulae,
      keyIdeas: ["Say each equation as a full sentence.", "Name what every letter stands for.", "Ask what changes when one quantity increases."],
      questions: [{ question: "What does each symbol in the equation represent?", answer: "Use the page text to name each quantity before calculating." }, { question: "Which quantities are linked by this relationship?", answer: spokenFormulae }],
      nextStep: "Read the equation aloud twice, then explain what it predicts without looking at the page.", offline: true,
    };
  }

  if (/action potential|neuron|synap|axon|neurotransmitter|depolarization/i.test(text)) {
    return {
      title: "How nerve cells pass a message",
      hook: "Imagine a relay race: an electrical signal runs along one cell, then hands a chemical message to the next.",
      explanation: "This passage describes communication between nerve cells. First, a nerve cell gets a small electrical change called depolarization. That opens tiny sodium gates and creates an action potential, which is the cell's fast electrical signal. The signal travels down the axon, helped by the myelin covering. At the end of the cell, it causes neurotransmitters—chemical messengers—to cross the synapse, the tiny gap between cells. The next cell then receives the message.",
      keyIdeas: ["An action potential is a fast electrical message in a nerve cell.", "The axon carries the message; myelin helps it travel quickly.", "At a synapse, the electrical signal becomes a chemical message for the next cell."],
      questions: [{ question: "Why do sodium channels open during depolarization?", answer: "They help start the action potential, the fast electrical signal that carries the message along the nerve cell." }, { question: "What happens when the signal reaches the end of the axon?", answer: "The cell releases neurotransmitters into the synapse so the next cell can receive the message." }],
      nextStep: "Say the journey aloud: electrical change, axon, synapse, chemical messenger, next cell.", offline: true,
    };
  }

  if (/ohm'?s law|\bvoltage\b|\bcurrent\b|\bresistance\b/i.test(text)) {
    return {
      title: "Ohm's law, without the jargon", hook: "Electricity is easier to picture as water moving through a pipe.",
      explanation: "Voltage is the push that tries to move electricity. Current is how much electricity actually moves. Resistance is anything that makes the movement harder, like a narrow pipe slowing water. Ohm's law says that more push usually creates more current, but more resistance makes current smaller. The relationship is written as V = I × R.",
      keyIdeas: ["Voltage is the electrical push.", "Current is the flow of electric charge.", "Resistance opposes the flow, so greater resistance means less current for the same voltage."],
      questions: [{ question: "If resistance increases while voltage stays the same, what happens to current?", answer: "Current decreases because the path is harder for electricity to move through." }, { question: "What does V = I × R tell us?", answer: "Voltage equals current multiplied by resistance." }],
      nextStep: "Use the water-pipe picture to explain voltage, current, and resistance to someone else.", offline: true,
    };
  }

  if (/photosynthesis|chlorophyll|glucose/i.test(text)) {
    return {
      title: "Photosynthesis, step by step", hook: "A leaf works like a tiny kitchen powered by sunlight.",
      explanation: "Plants use chlorophyll in their leaves to catch sunlight. They take carbon dioxide from the air and water from the soil. The sunlight provides energy to turn these ingredients into glucose, a sugar the plant can use and store. Oxygen is released as a useful by-product.",
      keyIdeas: ["Sunlight provides the energy.", "Carbon dioxide and water are the ingredients.", "The plant makes glucose and releases oxygen."],
      questions: [{ question: "Why is chlorophyll important?", answer: "It captures the sunlight energy needed for photosynthesis." }, { question: "What are the two products of photosynthesis?", answer: "Glucose, which stores food energy, and oxygen." }],
      nextStep: "Draw four arrows: sunlight, water, and carbon dioxide going into a leaf; glucose and oxygen coming out.", offline: true,
    };
  }

  if (/\bfission\b|\bfusion\b|\biter\b|tokamak|uranium-?235|reactor|plasma/i.test(text)) {
    return {
      title: "Nuclear energy: fission and fusion", hook: "Nuclear energy comes from changing an atom's nucleus—but there are two very different ways to do it.",
      explanation: "This passage compares two kinds of nuclear energy. Fission reactors split heavy atoms such as uranium-235. When a neutron hits the atom, the split releases energy and more neutrons, which can continue the chain reaction. Fusion works in the opposite direction: very light nuclei join together. ITER is an experimental fusion project that uses a doughnut-shaped machine called a tokamak to hold extremely hot plasma in place with magnets. Fusion is difficult because the plasma must stay hot and stable long enough for nuclei to join.",
      keyIdeas: ["Fission splits a heavy atomic nucleus and can create a chain reaction.", "Fusion joins light nuclei and needs extremely high temperature and careful magnetic control.", "ITER is testing fusion in a tokamak, which uses magnetic fields to contain hot plasma."],
      questions: [{ question: "What is the key difference between fission and fusion?", answer: "Fission splits heavy nuclei; fusion joins light nuclei." }, { question: "Why does ITER use powerful magnets?", answer: "Magnets hold the extremely hot plasma away from the machine walls so fusion conditions can be maintained." }],
      nextStep: "Make a two-column comparison: fission on the left, fusion on the right. Add what happens to the nucleus, the fuel, and the challenge.", offline: true,
    };
  }

  const simplePrimary = simplify(primary);
  const simpleSecondary = secondary ? simplify(secondary) : "";
  const explanation = notesMode
    ? `Main idea: ${simplePrimary}\n\nWhat happens next: ${simpleSecondary || "Identify the cause, the process, and the result in this passage."}\n\nWords to know: ${terms.slice(0, 4).join(", ") || "identify the key terms in the page"}.`
    : `In simple words, this passage is about ${topic}. ${simplePrimary}${simpleSecondary ? ` Next, ${simpleSecondary.charAt(0).toLowerCase()}${simpleSecondary.slice(1)}` : ""}`;

  const relation = simpleSecondary || simplePrimary;
  return {
    title: summaryMode ? "Short, clear summary" : titleFrom(text, terms),
    hook: `Start with one question: what is ${topic} doing, and why does it matter?`,
    explanation,
    keyIdeas: [
      `The main topic is ${topic}.`,
      simplePrimary.replace(/[.!?]$/, "").slice(0, 130) + ".",
      relation.replace(/[.!?]$/, "").slice(0, 130) + ".",
    ],
    questions: [
      { question: `In your own words, what is ${topic}?`, answer: simplePrimary },
      { question: "What happens next, or what result does the passage describe?", answer: relation },
    ],
    nextStep: "Cover the page. Explain the main process in two sentences, then check what you missed.",
    offline: true,
  };
}
