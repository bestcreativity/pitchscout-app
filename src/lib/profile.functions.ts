import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, background")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      data ?? { id: context.userId, display_name: null, background: null }
    );
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        displayName: z.string().max(120).optional(),
        background: z.string().max(5000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").upsert(
      {
        id: context.userId,
        is_registered: true,
        ...(data.displayName !== undefined
          ? { display_name: data.displayName.trim() || null }
          : {}),
        ...(data.background !== undefined
          ? { background: data.background.trim() || null }
          : {}),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
