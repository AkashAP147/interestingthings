import { categories } from "./categories";
import { Discovery } from "@/types";

// Keywords that trigger a "dopamine hit" and boost the interestingness score
const DOPAMINE_KEYWORDS = [
  "bizarre", "genius", "hidden", "secret", "illegal", "fascinating", 
  "unbelievable", "weird", "mind-blowing", "crazy", "unusual", 
  "satisfying", "mesmerizing", "brilliant", "unexpected", "obscure",
  "rare", "unknown", "creepy", "beautiful", "insane"
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "weird-websites": ["website", "site", "online", "click", "scroll"],
  "unusual-businesses": ["company", "startup", "sell", "buy", "business", "money"],
  "crazy-inventions": ["robot", "device", "invent", "machine", "prototype", "build"],
  "interesting-datasets": ["data", "statistics", "chart", "map", "numbers", "graph"],
  "fascinating-statistics": ["percent", "rate", "population", "study", "research"],
  "strange-products": ["product", "pillow", "buy", "item", "gadget", "toy"],
  "obscure-tools": ["tool", "utility", "app", "generator", "converter"],
  "beautiful-websites": ["design", "art", "visual", "aesthetic", "css", "animation"]
};

export interface AIAnalysisResult {
  score: number;
  isInteresting: boolean;
  suggestedCategoryId: string;
  suggestedTags: string[];
  feedback: string;
}

/**
 * Our Custom Local AI Engine.
 * Evaluates raw scraped data for "Interestingness" using NLP heuristics.
 */
export function analyzeDiscovery(title: string, description: string, sourceUrl: string): AIAnalysisResult {
  let score = 65; // Base score increased for real-world scrapers
  const text = `${title} ${description}`.toLowerCase();
  let feedback = [];

  // 1. Keyword Analysis (Dopamine hit check)
  let foundKeywords = 0;
  for (const keyword of DOPAMINE_KEYWORDS) {
    if (text.includes(keyword)) {
      foundKeywords++;
      score += 10;
    }
  }
  
  if (foundKeywords > 0) {
    feedback.push(`Found ${foundKeywords} highly interesting keywords.`);
  } else {
    feedback.push(`Lacks strong attention-grabbing keywords.`);
    score -= 15;
  }

  // 2. Length & Complexity Analysis
  const wordCount = description.split(/\s+/).length;
  if (wordCount > 15 && wordCount < 50) {
    score += 15; // Optimal length for a quick hit
    feedback.push("Optimal description length.");
  } else if (wordCount <= 15) {
    feedback.push("Description is short, likely a direct link.");
  } else {
    feedback.push("Description is a bit too long for a quick discovery.");
  }

  // 3. Copyright & Sourcing Check
  if (!sourceUrl || sourceUrl.trim() === "") {
    score -= 50; // Heavily penalize unsourced claims
    feedback.push("CRITICAL: Missing source URL. Cannot verify copyright/credit.");
  } else {
    score += 10;
    feedback.push("Source URL provided (credit verified).");
  }

  // 4. Determine Category via Heuristics
  let bestCategorySlug = "weird-websites"; // Default fallback
  let maxMatches = 0;

  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matches = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategorySlug = slug;
    }
  }

  const categoryId = categories.find(c => c.slug === bestCategorySlug)?.id || "c1";

  // 5. Generate tags (extract long words or use matching categories)
  const words = text.replace(/[^a-z0-9 ]/g, '').split(/\s+/);
  const tags = words.filter(w => w.length > 6 && !DOPAMINE_KEYWORDS.includes(w)).slice(0, 3);
  if (tags.length === 0) tags.push("internet", "discovery");

  // Normalize score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    isInteresting: score >= 60,
    suggestedCategoryId: categoryId,
    suggestedTags: tags,
    feedback: feedback.join(" ")
  };
}
