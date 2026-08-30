export type OutreachPlatform = "gmail" | "facebook" | "x" | "linkedin";

export type OutreachDraft = {
  subject: string;
  message: string;
};

type OutreachPitch = {
  title: string;
  pitchAngle: string;
  solution: string;
  prospectResearchInsight?: string;
  senderBackground?: string;
};

function humanize(text: string) {
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function capWordCount(text: string, maxWords = 130) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}${"..."}`;
}

function pickMostRelevantSkill(solution: string, senderBackground?: string) {
  const source = (senderBackground ?? solution).trim();
  if (!source) return solution.trim();

  const cleaned = source
    .replace(/^.*?(?:I help businesses with|I help with|I specialize in|I build|I do|I provide)\s+/i, "")
    .replace(/[.]+$/g, "")
    .trim();

  return cleaned || solution.trim();
}

export function createOutreachDraft(
  businessName: string,
  pitch: OutreachPitch,
): OutreachDraft {
  const name = businessName === "Not available" ? "your business" : businessName;
  const researchInsight = humanize(
    pitch.prospectResearchInsight?.trim() ||
      `I noticed ${name} still appears to rely on ${pitch.title.toLowerCase()} in a way that is creating missed conversion opportunities.`,
  );
  const gap = humanize(
    pitch.pitchAngle.trim() ||
      "That creates friction in the sales process and leads to missed revenue and wasted time.",
  );
  const skill = pickMostRelevantSkill(pitch.solution, pitch.senderBackground);

  const message = capWordCount(
    humanize(
      `${researchInsight} ${gap}. I help businesses with ${skill.toLowerCase()}. This typically leads to more qualified leads and saves 10+ hours a week. Would it be worth a quick 10-minute chat to see if this is relevant?`,
    ),
  );

  return {
    subject: humanize(`Quick idea for ${name}`),
    message,
  };
}

export function cleanDraft(draft: OutreachDraft): OutreachDraft {
  return { subject: humanize(draft.subject), message: humanize(draft.message) };
}

export function outreachUrl(
  platform: OutreachPlatform,
  draft: OutreachDraft,
) {
  const subject = encodeURIComponent(draft.subject);
  const body = encodeURIComponent(draft.message);
  if (platform === "gmail") {
    return `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}`;
  }
  if (platform === "x") {
    return `https://twitter.com/intent/post?text=${body}`;
  }
  if (platform === "linkedin") {
    return "https://www.linkedin.com/messaging/";
  }
  return "https://www.facebook.com/messages/";
}

export const PLATFORM_LABELS: Record<OutreachPlatform, string> = {
  gmail: "Gmail",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
};
