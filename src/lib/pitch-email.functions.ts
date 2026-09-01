/**
 * Server-side functions for generating pitch emails
 * Can be called from the client-side UI
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generatePitchEmailFromAnalysis } from "./pitch-email.server";

export const generatePitchEmailBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        researchId: z.string().uuid(),
        senderName: z.string().max(200).optional(),
        senderRole: z.string().max(200).optional(),
        senderEmail: z.string().email().optional(),
        senderWebsite: z.string().max(200).optional(),
        theme: z
          .object({
            primaryColor: z.string().optional(),
            accentColor: z.string().optional(),
            backgroundColor: z.string().optional(),
          })
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // Fetch the research record with analysis data
    const { data: row, error } = await context.supabase
      .from("researches")
      .select("url, business_name, result")
      .eq("id", data.researchId)
      .eq("user_id", context.userId)
      .single();

    if (error || !row) {
      throw new Error("Research not found.");
    }

    // Parse the result to get analysis data
    const analysisData =
      row.result && typeof row.result === "object"
        ? (row.result as Record<string, unknown>)
        : {};

    const acePitch =
      analysisData.acePitch && typeof analysisData.acePitch === "object"
        ? (analysisData.acePitch as Record<string, unknown>)
        : {};

    // Generate the pitch email
    const pitchEmail = generatePitchEmailFromAnalysis({
      analysisResult: analysisData as never,
      senderName: data.senderName,
      senderRole: data.senderRole,
      senderEmail: data.senderEmail,
      senderWebsite: data.senderWebsite,
      customTheme: data.theme,
    });

    // Store the generated email banner in the research result
    const updatedResult = {
      ...analysisData,
      acePitch: {
        ...acePitch,
        emailBanner: {
          html: pitchEmail.html,
          plainText: pitchEmail.plainText,
          subject: pitchEmail.subject,
          benefits: pitchEmail.benefits,
          generatedAt: new Date().toISOString(),
        },
      },
    };

    // Update the research record
    const { error: updateError } = await context.supabase
      .from("researches")
      .update({ result: updatedResult as never })
      .eq("id", data.researchId)
      .eq("user_id", context.userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return pitchEmail;
  });

/**
 * Generate a preview of the pitch email without saving
 */
export const previewPitchEmailBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        researchId: z.string().uuid(),
        senderName: z.string().max(200).optional(),
        senderRole: z.string().max(200).optional(),
        senderEmail: z.string().email().optional(),
        senderWebsite: z.string().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // Fetch the research record with analysis data
    const { data: row, error } = await context.supabase
      .from("researches")
      .select("url, business_name, result")
      .eq("id", data.researchId)
      .eq("user_id", context.userId)
      .single();

    if (error || !row) {
      throw new Error("Research not found.");
    }

    // Parse the result to get analysis data
    const analysisData =
      row.result && typeof row.result === "object"
        ? (row.result as Record<string, unknown>)
        : {};

    // Generate the pitch email preview
    return generatePitchEmailFromAnalysis({
      analysisResult: analysisData as never,
      senderName: data.senderName,
      senderRole: data.senderRole,
      senderEmail: data.senderEmail,
      senderWebsite: data.senderWebsite,
    });
  });
