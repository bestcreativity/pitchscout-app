import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateFollowUpMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        followUpNumber: z.number().int().min(1).max(5),
        tone: z.string().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("researches")
      .select("url, business_name, best_pitch_title, result")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error || !row) throw new Error("Research not found.");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("background")
      .eq("id", context.userId)
      .maybeSingle();

    const { generateFollowUp } = await import("./followup.server");
    const message = await generateFollowUp({
      url: row.url,
      businessName: row.business_name,
      bestPitchTitle: row.best_pitch_title,
      result: row.result,
      followUpNumber: data.followUpNumber,
      background: profile?.background ?? null,
      tone: data.tone ?? null,
    });
    const result = row.result && typeof row.result === "object" ? row.result as Record<string, unknown> : {};
    const acePitch = result.acePitch && typeof result.acePitch === "object" ? result.acePitch as Record<string, unknown> : {};
    const followUps = Array.isArray(acePitch.followUps) ? acePitch.followUps : [];
    const nextResult = {
      ...result,
      acePitch: {
        ...acePitch,
        followUps: [...followUps.filter((item) => typeof item === "object" && item !== null && (item as { number?: unknown }).number !== data.followUpNumber), { number: data.followUpNumber, ...message }],
      },
    };
    const { error: updateError } = await context.supabase
      .from("researches")
      .update({ result: nextResult as never })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (updateError) throw new Error(updateError.message);
    return message;
  });
