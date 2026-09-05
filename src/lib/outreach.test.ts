import test from "node:test";
import assert from "node:assert/strict";

import { createOutreachDraft, outreachUrl } from "./outreach.ts";
import { extractFirstMessageFromResearchResult } from "./followup.server.ts";

test("createOutreachDraft follows the preferred paragraph structure", () => {
  const draft = createOutreachDraft("Austin's Greatest Plumbing", {
    title: "emergency intake workflow",
    pitchAngle:
      "There may be an opportunity to make the emergency request process more responsive for customers who need help quickly.",
    solution:
      "a streamlined emergency intake system that collects the customer's issue and contact details, schedules the request, and alerts the right technician by SMS.",
    prospectResearchInsight:
      "I looked through your website and noticed customers can request service online, which is especially useful for urgent calls outside normal hours.",
    senderBackground:
      "This is the kind of workflow I build using web applications and automation for service businesses.",
  });

  assert.match(draft.subject, /Austin|idea|quick/i);
  assert.match(draft.message, /^Hi Austin's Greatest Plumbing, /i);
  assert.ok(draft.message.split(/\n\n/).length <= 3, "The draft should be up to 3 paragraphs.");
  assert.match(draft.message, /I came across|I looked through|I noticed/i);
  assert.match(draft.message, /opportunity|more responsive|make.*process|make it easier|help customers/i);
  assert.match(draft.message, /I could build|I can help|This is the kind of workflow I build|This is the kind of work I build/i);
  assert.match(draft.message, /If you're open to it|quick 10-minute conversation|10-minute chat/i);
  assert.doesNotMatch(draft.message, /I appreciate the work|still appears to rely on|missed conversion opportunities|10\+ hours saved|businesses with similar issues/i);
  assert.doesNotMatch(draft.message, /desperate|game-changer|cutting-edge|synergy|seamless|just checking in/i);
  assert.ok(draft.message.split(/\s+/).length <= 130, "The draft must stay under 130 words.");
});

test("extractFirstMessageFromResearchResult prefers the saved first outreach message and Gmail keeps the verified recipient", () => {
  const result = {
    type: "manual_lead",
    firstMessage: "Hi there, I wanted to ask if you need help with lead capture.",
    acePitch: {
      selectedPitchTitle: "Lead capture automation",
    },
  };

  assert.equal(
    extractFirstMessageFromResearchResult(result),
    "Hi there, I wanted to ask if you need help with lead capture.",
  );

  const gmailUrl = outreachUrl(
    "gmail",
    {
      subject: "Following up on lead capture",
      message: "Hi there, I wanted to follow up.",
    },
    "prospect@example.com",
  );

  assert.match(gmailUrl, /to=prospect%40example.com/);
  assert.match(gmailUrl, /su=Following%20up%20on%20lead%20capture/);
  assert.match(gmailUrl, /body=Hi%20there%2C%20I%20wanted%20to%20follow%20up\./);
});
