const AI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = "gemini-3.6-flash";
const PAGE_TIMEOUT_MS = 1200;
const SUB_PAGE_TIMEOUT_MS = 500;
const AI_TIMEOUT_MS = 15000;

export type Opportunity = {
  title: string;
  score: number;
  confidence: "High" | "Medium" | "Low";
  valueLow: number;
  valueHigh: number;
  problem: string;
  evidence: string;
  opportunity: string;
  solution: string;
  benefit: string;
  pitchAngle: string;
};

export type ContactInfo = {
  emails: string[];
  phones: string[];
  socials: { platform: string; url: string }[];
  address: string;
  contactPageUrl: string;
};

export type PitchStructure = {
  subjectLine: string;
  opening: string;
  points: { point: string; detail: string }[];
  callToAction: string;
  toneTips: string;
};

export type AnalysisResult = {
  url: string;
  fetched: boolean;
  partial: boolean;
  notes: string[];
  business: {
    name: string;
    industry: string;
    location: string;
    whatTheyDo: string;
    whoTheyServe: string;
    services: string;
    businessModel: string;
  };
  contact: ContactInfo;
  pitchStructure: PitchStructure;
  bestPitch: {
    title: string;
    score: number;
    why: string;
    whatToOffer: string;
    howToApproach: string;
  };
  opportunities: Opportunity[];
  websiteFindings: { finding: string; evidence: string; impact: string }[];
};

function platformOf(url: string) {
  const map: [RegExp, string][] = [
    [/facebook/i, "Facebook"],
    [/instagram/i, "Instagram"],
    [/linkedin/i, "LinkedIn"],
    [/(twitter|x\.com)/i, "X (Twitter)"],
    [/tiktok/i, "TikTok"],
    [/youtube/i, "YouTube"],
    [/(wa\.me|whatsapp)/i, "WhatsApp"],
  ];
  for (const [re, name] of map) if (re.test(url)) return name;
  return "Social";
}


function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type PageSignals = {
  ok: boolean;
  status?: number;
  error?: string;
  title?: string | undefined;
  metaDescription?: string | undefined;
  text?: string | undefined;
  links?: string[];
  socialLinks?: string[];
  emails?: string[];
  phones?: string[];
  hasViewport?: boolean;
  hasSchema?: boolean;
  hasBookingWords?: boolean;
  hasForm?: boolean;
  bytes?: number;
  loadMs?: number;
  https?: boolean;
};

async function fetchPage(url: string, timeoutMs = 6000): Promise<PageSignals> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ACEPITCH/1.0; business analysis bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const html = await res.text();
    const loadMs = Date.now() - start;
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}`, loadMs };
    }
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim();
    const metaDescription =
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(
        html,
      )?.[1] ?? undefined;
    const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map(
      (m) => m[1] ?? "",
    ).filter(Boolean);
    const social = hrefs.filter((h) =>
      /(facebook|instagram|linkedin|twitter|x\.com|tiktok|youtube|wa\.me|whatsapp)/i.test(
        h,
      ),
    );
    const emails = Array.from(
      new Set(html.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? []),
    ).slice(0, 5);
    const phones = Array.from(
      new Set(html.match(/(?:tel:)([+\d][\d\s().-]{6,})/gi) ?? []),
    ).slice(0, 5);
    const text = stripHtml(html).slice(0, 5000);

    return {
      ok: true,
      status: res.status,
      title,
      metaDescription,
      text,
      links: Array.from(new Set(hrefs)).slice(0, 30),
      socialLinks: Array.from(new Set(social)).slice(0, 10),
      emails,
      phones,
      hasViewport: /name=["']viewport["']/i.test(html),
      hasSchema: /application\/ld\+json/i.test(html),
      hasBookingWords: /book now|book online|schedule|appointment|reserve/i.test(
        html,
      ),
      hasForm: /<form/i.test(html),
      bytes: html.length,
      loadMs,
      https: url.startsWith("https://"),
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return {
        ok: false,
        error: `Request timed out after ${timeoutMs}ms`,
        loadMs: Date.now() - start,
      };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Fetch failed",
      loadMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSubPages(base: string, links: string[]) {
  const candidates = new Set<string>();
  for (const href of links) {
    if (!/^(https?:)?\/\//.test(href) && !href.startsWith("/")) continue;
    let abs: string;
    try {
      abs = new URL(href, base).toString();
    } catch {
      continue;
    }
    if (new URL(abs).host !== new URL(base).host) continue;
    if (/(about|service|contact|pricing|work|product|shop)/i.test(abs)) {
      candidates.add(abs.split("#")[0] ?? abs);
    }
    if (candidates.size >= 1) break;
  }
  const results = await Promise.all(
    Array.from(candidates).map(async (u) => {
      const p = await fetchPage(u, SUB_PAGE_TIMEOUT_MS);
      return { url: u, ok: p.ok, text: p.text?.slice(0, 1500) ?? "" };
    }),
  );
  return results.filter((r) => r.ok && r.text);
}

const SCHEMA = {
  name: "ace_pitch_analysis",
  description:
    "Structured analysis of a business and the services that could realistically be pitched to it.",
  parameters: {
    type: "object",
    properties: {
      business: {
        type: "object",
        properties: {
          name: { type: "string" },
          industry: { type: "string" },
          location: { type: "string" },
          whatTheyDo: { type: "string" },
          whoTheyServe: { type: "string" },
          services: { type: "string" },
          businessModel: { type: "string" },
        },
        required: [
          "name",
          "industry",
          "location",
          "whatTheyDo",
          "whoTheyServe",
          "services",
          "businessModel",
        ],
      },
      bestPitch: {
        type: "object",
        properties: {
          title: { type: "string" },
          score: { type: "number" },
          why: { type: "string" },
          whatToOffer: { type: "string" },
          howToApproach: { type: "string" },
        },
        required: ["title", "score", "why", "whatToOffer", "howToApproach"],
      },
      opportunities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            score: { type: "number" },
            confidence: { type: "string", enum: ["High", "Medium", "Low"] },
            valueLow: { type: "number" },
            valueHigh: { type: "number" },
            problem: { type: "string" },
            evidence: { type: "string" },
            opportunity: { type: "string" },
            solution: { type: "string" },
            benefit: { type: "string" },
            pitchAngle: { type: "string" },
          },
          required: [
            "title",
            "score",
            "confidence",
            "valueLow",
            "valueHigh",
            "problem",
            "evidence",
            "opportunity",
            "solution",
            "benefit",
            "pitchAngle",
          ],
        },
      },
      websiteFindings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            finding: { type: "string" },
            evidence: { type: "string" },
            impact: { type: "string" },
          },
          required: ["finding", "evidence", "impact"],
        },
      },
      contact: {
        type: "object",
        description:
          "Contact details actually present in the signals. Use 'Not available' when absent.",
        properties: {
          address: { type: "string" },
          contactPageUrl: { type: "string" },
        },
        required: ["address", "contactPageUrl"],
      },
      pitchStructure: {
        type: "object",
        description:
          "Key points for structuring the outreach message for the best pitch.",
        properties: {
          subjectLine: { type: "string" },
          opening: { type: "string" },
          points: {
            type: "array",
            items: {
              type: "object",
              properties: {
                point: { type: "string" },
                detail: { type: "string" },
              },
              required: ["point", "detail"],
            },
          },
          callToAction: { type: "string" },
          toneTips: { type: "string" },
        },
        required: [
          "subjectLine",
          "opening",
          "points",
          "callToAction",
          "toneTips",
        ],
      },
      unverified: { type: "array", items: { type: "string" } },
    },
    required: [
      "business",
      "bestPitch",
      "opportunities",
      "websiteFindings",
      "contact",
      "pitchStructure",
    ],

  },
} as const;

const SYSTEM = `You are ACE PITCH, a private business-scouting analyst for a freelance digital consultant.
You are given raw signals scraped from a business website. Analyze the BUSINESS, not just the website.

Hard rules:
- NEVER invent facts. If a field is not supported by the provided signals, output exactly "Not available".
- Evidence must quote or point to something actually present (or actually absent) in the signals.
- Opportunities must be realistic to sell to THIS specific business in its industry. Do not use a generic template list; vary by business.
- Score 0-100 weighing: realism of the pitch (most important), business relevance, potential value, strength of evidence, urgency, ease of selling.
- Return 5 opportunities max, sorted by score descending. bestPitch must equal the top opportunity.
- valueLow/valueHigh are rough USD project ranges (indicative, not quotes).
- Website findings are business-relevant problems, not nitpicks.
- contact.address / contact.contactPageUrl must come from the signals only ("Not available" otherwise).
- pitchStructure is the skeleton of the outreach message for bestPitch. It must follow this exact 4-step structure, with no intro greeting and no generic compliments:
  1. THE SPECIFIC HOOK: Start directly with a concrete insight about the business (PROSPECT_RESEARCH_INSIGHT). Show evidence from the website, not a generic opener.
  2. THE GAP/FRICTION: Connect that insight to a real business problem such as lost revenue, manual work, slow operations, or poor conversion.
  3. THE MATCH (MY SKILL → THEIR VALUE): Pick one highly relevant skill from the SENDER BACKGROUND and connect it to a specific business outcome such as more revenue, 10+ hours saved per week, or faster conversion.
  4. LOW-FRICTION CTA: End with a permission-based question that invites a short conversation without pressure.
- Maximum message length: 130 words.
- Tone: direct, professional, helpful, peer-to-peer.
- Avoid buzzwords and generic praise.
- Do not list all of the sender's skills; pick only the single most relevant skill for this prospect.
- Keep it human, specific, non-salesy, and brief.
- List in "unverified" anything meaningful you could not confirm.`;

function fallbackAnalysis(
  url: string,
  page: PageSignals,
  notes: string[],
): AnalysisResult {
  const name = page.title?.split(/[|\-:]/)[0]?.trim() || new URL(url).hostname;
  const findings: AnalysisResult["websiteFindings"] = [];
  const opportunities: Opportunity[] = [];

  if (!page.hasViewport) {
    findings.push({
      finding: "Mobile viewport support could not be confirmed.",
      evidence: "No viewport meta tag was detected in the page markup.",
      impact: "Mobile visitors may see a poor layout or reduced conversion.",
    });
    opportunities.push({
      title: "Mobile experience improvement",
      score: 72,
      confidence: "Medium",
      valueLow: 500,
      valueHigh: 1800,
      problem: "The page does not declare a mobile viewport.",
      evidence: "No viewport meta tag was detected.",
      opportunity: "Improve the experience for visitors on phones and tablets.",
      solution: "Audit and improve responsive layouts, spacing, and conversion paths.",
      benefit: "Make the site easier to use and reduce mobile drop-off.",
      pitchAngle: "I noticed the mobile viewport setup could be improved and can audit the key visitor paths.",
    });
  }

  if (!page.hasForm && !page.emails?.length && !page.phones?.length) {
    findings.push({
      finding: "A direct contact path was not found in the page markup.",
      evidence: "No form, email, or phone number was detected.",
      impact: "Interested visitors may have no obvious way to start a conversation.",
    });
    opportunities.push({
      title: "Contact conversion path",
      score: 78,
      confidence: "Medium",
      valueLow: 400,
      valueHigh: 1500,
      problem: "A direct contact path could not be confirmed.",
      evidence: "No form, email, or phone number was detected.",
      opportunity: "Give qualified visitors a clear next step.",
      solution: "Add and test a focused contact or booking path.",
      benefit: "Make it easier for interested visitors to become leads.",
      pitchAngle: "I could map the visitor path and add a clearer way for qualified prospects to reach you.",
    });
  }

  if (!page.hasSchema) {
    findings.push({
      finding: "Structured data was not detected.",
      evidence: "No JSON-LD schema block was found in the page markup.",
      impact: "Search engines may have less context about the business and its services.",
    });
  }

  if (!opportunities.length) {
    opportunities.push({
      title: "Website conversion review",
      score: 60,
      confidence: "Low",
      valueLow: 300,
      valueHigh: 1200,
      problem: "A full business opportunity could not be verified automatically.",
      evidence: "The page was fetched, but the AI analysis service did not respond in time.",
      opportunity: "Review the main visitor journey for friction and missed enquiries.",
      solution: "Run a focused audit of the homepage, contact path, and primary call to action.",
      benefit: "Identify practical improvements before investing in larger changes.",
      pitchAngle: "I can do a focused review of the main visitor journey and show the highest-impact improvements.",
    });
  }

  opportunities.sort((a, b) => b.score - a.score);
  const bestPitch = opportunities[0];
  const contact: ContactInfo = {
    emails: page.emails ?? [],
    phones: (page.phones ?? []).map((phone) => phone.replace(/^tel:/i, "").trim()),
    socials: (page.socialLinks ?? []).map((socialUrl) => ({
      platform: platformOf(socialUrl),
      url: socialUrl,
    })),
    address: "Not available",
    contactPageUrl: "Not available",
  };

  return {
    url,
    fetched: page.ok,
    partial: true,
    notes: Array.from(new Set([
      ...notes,
      "AI analysis was unavailable, so this report uses verified website signals only.",
    ])).slice(0, 6),
    business: {
      name,
      industry: "Not available",
      location: "Not available",
      whatTheyDo: page.metaDescription || "Not available",
      whoTheyServe: "Not available",
      services: "Not available",
      businessModel: "Not available",
    },
    contact,
    pitchStructure: {
      subjectLine: `A quick idea for ${name}`,
      opening: bestPitch.pitchAngle,
      points: [
        { point: "Specific finding", detail: bestPitch.evidence },
        { point: "Business impact", detail: bestPitch.benefit },
        { point: "Practical next step", detail: bestPitch.solution },
      ],
      callToAction: "Would you be open to a short conversation about this?",
      toneTips: "Keep the message specific, helpful, and low pressure.",
    },
    bestPitch,
    opportunities,
    websiteFindings: findings,
  };
}


export async function runAnalysis(
  rawUrl: string,
  background?: string,
): Promise<AnalysisResult> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("Gemini AI is not configured for this project.");

  const url = normalizeUrl(rawUrl);
  const page = await fetchPage(url, PAGE_TIMEOUT_MS);
  const notes: string[] = [];
  let subPages: { url: string; text: string }[] = [];

  if (!page.ok) {
    notes.push(
      `The website could not be fetched (${page.error ?? "unknown error"}).`,
    );
  } else {
    subPages = (await fetchSubPages(url, page.links ?? [])).map((p) => ({
      url: p.url,
      text: p.text,
    }));
    if (!page.text || page.text.length < 300) {
      notes.push(
        "Very little readable text was found on the page (it may be JavaScript-rendered).",
      );
    }
    if (!page.socialLinks?.length) notes.push("No social profile links found on the site.");
    if (!page.emails?.length && !page.phones?.length)
      notes.push("No email or phone contact details found in the page markup.");
  }

  const signals = {
    requestedUrl: url,
    fetchOk: page.ok,
    httpStatus: page.status ?? null,
    fetchError: page.error ?? null,
    responseTimeMs: page.loadMs ?? null,
    htmlBytes: page.bytes ?? null,
    https: page.https ?? null,
    title: page.title ?? null,
    metaDescription: page.metaDescription ?? null,
    hasViewportMeta: page.hasViewport ?? null,
    hasStructuredData: page.hasSchema ?? null,
    hasContactForm: page.hasForm ?? null,
    mentionsBookingOrScheduling: page.hasBookingWords ?? null,
    socialLinks: page.socialLinks ?? [],
    emails: page.emails ?? [],
    phoneLinks: page.phones ?? [],
    internalLinks: page.links?.slice(0, 40) ?? [],
    homepageText: page.text ?? null,
    subPages,
  };

  const requestBody = JSON.stringify({
      model: MODEL,
      max_tokens: 1800,
      messages: [
        {
          role: "system",
          content:
            background && background.trim()
              ? `The consultant's own background, skills and services (their offer):\n"""\n${background.trim().slice(0, 4000)}\n"""\nOnly propose opportunities this consultant can realistically deliver with the skills/services above. Weight scores toward their strengths, connect each opportunity to a specific capability they mentioned, respect their stated price range for value estimates, and never suggest work they said they don't do. Write the pitch structure in their voice, referencing their relevant experience.`
              : "The consultant's background is not provided. Assume a general freelance digital consultant (web, SEO, automation, ads).",
        },
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Analyze this business from the following scraped signals.\n\n${JSON.stringify(
            signals,
          ).slice(0, 24000)}`,
        },
      ],
      tools: [{ type: "function", function: SCHEMA }],
      tool_choice: { type: "function", function: { name: SCHEMA.name } },
    });

  let res: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
      res = await fetch(AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return fallbackAnalysis(url, page, ["The AI provider took too long to respond."]);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
    if (res.ok || ![429, 500, 502, 503, 504].includes(res.status) || attempt === 1) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (!res) throw new Error("The AI provider did not respond.");

  if (!res.ok) {
    const body = await res.text();
    console.error(`AI gateway failed [${res.status}]: ${body}`);
    if (res.status === 429)
      throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Add credits to continue.");
    if ([500, 502, 503, 504].includes(res.status))
      return fallbackAnalysis(url, page, ["The AI provider is temporarily busy."]);
    throw new Error(`Analysis failed [${res.status}]`);
  }

  const data = (await res.json()) as {
    choices?: {
      message?: {
        tool_calls?: { function?: { arguments?: string } }[];
        content?: string;
      };
    }[];
  };
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("The analysis returned no usable result.");

  let parsed: {
    business: AnalysisResult["business"];
    bestPitch: AnalysisResult["bestPitch"];
    opportunities: Opportunity[];
    websiteFindings: AnalysisResult["websiteFindings"];
    contact?: { address?: string; contactPageUrl?: string };
    pitchStructure?: PitchStructure;
    unverified?: string[];
  };
  try {
    parsed = JSON.parse(args);
  } catch {
    throw new Error("The analysis returned malformed data.");
  }

  const opportunities = (parsed.opportunities ?? [])
    .map((o) => ({ ...o, score: Math.max(0, Math.min(100, Math.round(o.score))) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  for (const u of parsed.unverified ?? []) notes.push(u);

  const contact: ContactInfo = {
    emails: page.emails ?? [],
    phones: (page.phones ?? []).map((p) => p.replace(/^tel:/i, "").trim()),
    socials: Array.from(
      new Map(
        (page.socialLinks ?? [])
          .map((href) => {
            try {
              return new URL(href, url).toString();
            } catch {
              return null;
            }
          })
          .filter((u): u is string => !!u)
          .map((u) => [u, { platform: platformOf(u), url: u }]),
      ).values(),
    ),
    address: parsed.contact?.address?.trim() || "Not available",
    contactPageUrl: parsed.contact?.contactPageUrl?.trim() || "Not available",
  };

  const pitchStructure: PitchStructure = {
    subjectLine: parsed.pitchStructure?.subjectLine ?? "Not available",
    opening: parsed.pitchStructure?.opening ?? "Not available",
    points: (parsed.pitchStructure?.points ?? []).slice(0, 6),
    callToAction: parsed.pitchStructure?.callToAction ?? "Not available",
    toneTips: parsed.pitchStructure?.toneTips ?? "Not available",
  };

  return {
    url,
    fetched: page.ok,
    partial: !page.ok || notes.length > 0,
    notes: Array.from(new Set(notes)).slice(0, 6),
    business: parsed.business,
    contact,
    pitchStructure,
    bestPitch: parsed.bestPitch,
    opportunities,
    websiteFindings: (parsed.websiteFindings ?? []).slice(0, 8),
  };
}

