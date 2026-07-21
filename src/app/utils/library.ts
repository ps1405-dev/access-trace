// src/app/utils/library.ts

export interface PageContent {
  pageNumber: number;
  topic: string;
  rawText: string;
}

export interface Book {
  id: string;
  title: string;
  subject: string;
  grade: string;
  pages: PageContent[];
}

export const localLibrary: Book[] = [
  {
    id: "class-10-science",
    title: "Class 10 Science (NCERT)",
    subject: "Science",
    grade: "Grade 10",
    pages: [
      {
        pageNumber: 1,
        topic: "Ohm's Law",
        rawText: "Ohm's law states that the current through a conductor between two points is directly proportional to the voltage across the two points. Introducing the constant of proportionality, the resistance, we get the mathematical equation: V = I * R. Where V is the voltage, I is the electric current, and R is the resistance of the conductor."
      },
      {
        pageNumber: 2,
        topic: "Resistors in Series",
        rawText: "When several resistors are joined in series, the equivalent resistance of the combination is equal to the sum of their individual resistances. Thus, the total resistance Rs is given by: Rs = R1 + R2 + R3. The current through each resistor remains the same, while the total potential difference is distributed."
      }
    ]
  },
  {
    id: "class-10-geography",
    title: "Class 10 Geography",
    subject: "Geography",
    grade: "Grade 10",
    pages: [
      {
        pageNumber: 42,
        topic: "Black Soil",
        rawText: "Black soil is typical of the Deccan trap (Basalt) region spread over northwest Deccan plateau and is made up of lava flows. They are clayey, deep, and impermeable. They swell and become sticky when wet and shrink when dried. It is highly retentive of moisture and is ideal for growing cotton, often referred to as black cotton soil."
      }
    ]
  }
];

// Helper to clean conversational prefixes and extract raw topics
export function cleanSpeechQuery(query: string): { topic: string; page: number | null } {
  const clean = query.toLowerCase()
    .replace(/open science/g, "")
    .replace(/open geography/g, "")
    .replace(/explain/g, "")
    .replace(/read/g, "")
    .replace(/show/g, "")
    .replace(/tell me about/g, "")
    .replace(/please/g, "")
    .trim();

  // Extract page numbers if spoken (e.g., "page forty two" or "page 42")
  const pageMatch = clean.match(/page\s*(\d+)/i);
  let pageNumber: number | null = null;
  if (pageMatch) {
    pageNumber = parseInt(pageMatch[1], 10);
  }

  // Strip page strings from the query topic
  const finalTopic = clean.replace(/page\s*\d+/gi, "").trim();

  return { topic: finalTopic, page: pageNumber };
}