import test from "node:test";
import assert from "node:assert/strict";

import { createOutreachDraft } from "./outreach.ts";

test("createOutreachDraft follows the required four-step outreach structure", () => {
  const draft = createOutreachDraft("Northstar Studio", {
    title: "lead generation funnel",
    pitchAngle:
      "Their booking funnel is leaking leads because they rely on manual follow-up and weak landing page conversion.",
    solution:
      "a conversion-focused lead generation system with better landing pages, CRM automation, and a simple follow-up workflow.",
    prospectResearchInsight:
      "I noticed Northstar Studio is still relying on a manual booking flow and weak landing-page conversion.",
    senderBackground:
      "I build conversion-focused lead generation systems with better landing pages and automation.",
  });

  assert.match(draft.subject, /Northstar Studio|idea|quick/i);
  assert.doesNotMatch(draft.message, /^Hi\b/i);
  assert.match(draft.message, /I noticed|I looked at|I saw/i);
  assert.match(draft.message, /leaking|manual|conversion|missed|revenue|friction|lost/i);
  assert.ok(
    draft.message.indexOf("I noticed") < draft.message.indexOf("I help"),
    "The message should hook on the insight before pitching the service.",
  );
  assert.match(draft.message, /I help businesses with|I help with/i);
  assert.match(draft.message, /Would it be worth|Would a quick chat|Would you be open/i);
  assert.doesNotMatch(draft.message, /desperate|game-changer|cutting-edge|synergy|seamless|just checking in/i);
  assert.ok(draft.message.split(/\s+/).length <= 130, "The draft must stay under 130 words.");
});
