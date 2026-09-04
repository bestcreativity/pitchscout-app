import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const saveResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        url: z.string().min(1),
        businessName: z.string().nullable().optional(),
        bestPitchTitle: z.string().nullable().optional(),
        verifiedEmail: z.string().email().optional(),
        result: z.unknown(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const normalizedUrl = data.url.trim().toLowerCase().replace(/\/$/, "");
    const normalizedEmail = data.verifiedEmail?.trim().toLowerCase();
    const { data: existingResearches, error: duplicateCheckError } = await context.supabase
      .from("researches")
      .select("id, url, verified_email")
      .eq("user_id", context.userId);
    if (duplicateCheckError) throw new Error(duplicateCheckError.message);

    const alreadySaved = (existingResearches ?? []).some((research) => {
      const existingUrl = research.url.trim().toLowerCase().replace(/\/$/, "");
      const existingEmail = research.verified_email?.trim().toLowerCase();
      return existingUrl === normalizedUrl || Boolean(normalizedEmail && existingEmail === normalizedEmail);
    });
    if (alreadySaved) throw new Error("leads already saved");

    const { data: row, error } = await context.supabase
      .from("researches")
      .insert({
        user_id: context.userId,
        url: data.url,
        business_name: data.businessName ?? null,
        verified_email: data.verifiedEmail ?? null,
        email_verified_at: data.verifiedEmail ? new Date().toISOString() : null,
        best_pitch_title: data.bestPitchTitle ?? null,
        result: data.result as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listResearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("researches")
      .select("id, url, business_name, best_pitch_title, verified_email, email_verified_at, result, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), result: z.unknown(), bestPitchTitle: z.string().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("researches")
      .update({
        result: data.result as never,
        ...(data.bestPitchTitle ? { best_pitch_title: data.bestPitchTitle } : {}),
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const verifyResearchEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), email: z.string().trim().email() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const email = data.email.toLowerCase();
    const { error } = await context.supabase
      .from("researches")
      .update({ verified_email: email, email_verified_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { email, verifiedAt: new Date().toISOString() };
  });

export const deleteResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("researches")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
