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

  let cleaned = source
    .replace(/^.*?(?:I help businesses with|I help with|I specialize in|I build|I do|I provide|This is the kind of workflow I build|This is the kind of work I build)\s+/i, "")
    .replace(/^(?:using|with)\s+/i, "")
    .replace(/[.]+$/g, "")
    .trim();

  if (!cleaned || /^this is the kind of/i.test(source)) {
    cleaned = solution.trim();
  }

  return cleaned || solution.trim();
}

export function createOutreachDraft(
  businessName: string,
  pitch: OutreachPitch,
): OutreachDraft {
  const name = businessName === "Not available" ? "your business" : businessName;
  const greeting = `Hi ${name === "your business" ? "there" : name},`;
  const appreciation = `I came across your business and liked how clearly you focus on urgent customer needs.`;
  const researchInsight = humanize(
    pitch.prospectResearchInsight?.trim() ||
      `I looked through your website and noticed customers can request service online, which is useful for after-hours inquiries.`,
  );
  const opportunity = humanize(
    pitch.pitchAngle.trim() ||
      "That made me think there may be an opportunity to make the emergency-request process more responsive.",
  );
  const skill = pickMostRelevantSkill(pitch.solution, pitch.senderBackground);
  const solution = `I could build ${skill.toLowerCase()} that captures issue details, schedules the request, and alerts the right technician by SMS.`;
  const value = "The goal would be to make urgent requests easier to handle quickly and improve the customer experience.";
  const whyMe = "This is the kind of workflow I build using web apps and automation, so I can tailor it around your team.";
  const cta = "If you're open to it, I can show you what I have in mind in a 10-minute conversation.";

  const paragraphOne = humanize(`${greeting} ${appreciation} ${researchInsight}`);
  const paragraphTwo = humanize(`${opportunity} ${solution}`);
  const paragraphThree = humanize(`${value} ${whyMe} ${cta}`);

  const message = capWordCount(
    humanize([paragraphOne, paragraphTwo, paragraphThree].join("\n\n")),
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
  recipient?: string,
) {
  const subject = encodeURIComponent(draft.subject);
  const body = encodeURIComponent(draft.message);
  const to = recipient ? `&to=${encodeURIComponent(recipient)}` : "";
  if (platform === "gmail") {
    return `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}${to}`;
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
