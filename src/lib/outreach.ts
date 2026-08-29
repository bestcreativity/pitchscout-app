export type OutreachPlatform = "gmail" | "facebook" | "x" | "linkedin";

export type OutreachDraft = {
  subject: string;
  message: string;
};

function humanize(text: string) {
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createOutreachDraft(
  businessName: string,
  pitch: { title: string; pitchAngle: string; solution: string },
): OutreachDraft {
  const name = businessName === "Not available" ? "your business" : businessName;
  const honedTitle = pitch.title.replace(/\s+/g, " ").trim();
  const focus = pitch.pitchAngle.trim();
  const solution = pitch.solution.trim();

  const message = humanize(
    `Hi ${name === "your business" ? "there" : name}, I came across ${name} and wanted to reach out because I think there may be an opportunity in ${honedTitle}. From what I can see, ${focus} That usually creates friction in the sales process and can lead to lost leads, wasted time, or missed revenue. I help businesses with ${solution.toLowerCase()}. This is a focused fix designed to improve conversion, reduce manual work, and create a clearer path to revenue. I can keep it simple and low-risk, and I can share a short idea if it seems relevant. Would it be worth a quick 10-minute conversation?`,
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
