export interface Rank {
  threshold: number;
  name: string;
  blurb: string;
}

// Fun academic-themed progression. Ordered ascending by threshold.
export const RANKS: Rank[] = [
  { threshold: 0, name: "Freshman", blurb: "Just getting started" },
  { threshold: 50, name: "Sophomore", blurb: "Finding a rhythm" },
  { threshold: 150, name: "Junior", blurb: "Building real momentum" },
  { threshold: 300, name: "Senior", blurb: "Consistently showing up" },
  { threshold: 500, name: "Honor Roll", blurb: "Well above average" },
  { threshold: 800, name: "Dean's List", blurb: "Seriously dedicated" },
  { threshold: 1200, name: "Valedictorian", blurb: "Top of the class" },
  { threshold: 2000, name: "Scholar Emeritus", blurb: "Studying is basically a lifestyle" },
];

export function getRank(points: number): { current: Rank; next: Rank | null; progress: number } {
  let current = RANKS[0];
  let next: Rank | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i].threshold) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  const progress = next
    ? Math.min(
        100,
        Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100)
      )
    : 100;
  return { current, next, progress };
}

export interface AccentTheme {
  id: string;
  name: string;
  cost: number;
  description: string;
  swatch: [string, string]; // [primary, secondary] for the preview dot pair
}

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: "default",
    name: "Amber Classic",
    cost: 0,
    description: "Estadi's original warm amber and rust palette.",
    swatch: ["#C97B2E", "#B5533C"],
  },
  {
    id: "ocean",
    name: "Ocean",
    cost: 200,
    description: "Cool blues with a teal highlight.",
    swatch: ["#2E7FC9", "#2E9C8F"],
  },
  {
    id: "forest",
    name: "Forest",
    cost: 400,
    description: "Deep greens with an olive highlight.",
    swatch: ["#3F8F5C", "#8A9C3F"],
  },
  {
    id: "rose",
    name: "Rose",
    cost: 700,
    description: "Warm rose with a coral highlight.",
    swatch: ["#C9527F", "#D9735A"],
  },
  {
    id: "violet",
    name: "Violet",
    cost: 1200,
    description: "Rich violet with a magenta highlight — the top-tier look.",
    swatch: ["#7C5CC9", "#B0529C"],
  },
];

export function getTheme(id: string): AccentTheme {
  return ACCENT_THEMES.find((t) => t.id === id) ?? ACCENT_THEMES[0];
}
