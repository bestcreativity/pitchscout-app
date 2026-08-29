import test from "node:test";
import assert from "node:assert/strict";

import { createOutreachDraft } from "./outreach.ts";

test("createOutreachDraft keeps the problem-first, personalized structure", () => {
  const draft = createOutreachDraft("Northstar Studio", {
    title: "lead generation funnel",
    pitchAngle:
      "Their booking funnel is leaking leads because they rely on manual follow-up and weak landing page conversion.",
    solution:
      "a conversion-focused lead generation system with better landing pages, CRM automation, and a simple follow-up workflow.",
  });

  assert.match(draft.subject, /Northstar Studio|idea|quick/i);
  assert.match(draft.message, /Hi\b/i);
  assert.match(draft.message, /Northstar Studio|your team|your business/i);
  assert.match(draft.message, /noticed|saw|looked|I came across/i);
  assert.match(draft.message, /leaking|costing|missing|problem|opportunity/i);
  assert.ok(
    draft.message.indexOf("I noticed") < draft.message.indexOf("I help"),
    "The message should identify the problem before pitching the service.",
  );
  assert.match(draft.message, /Would it be worth/i);
  assert.doesNotMatch(draft.message, /desperate|generic|just checking in|I would love to/i);
});
