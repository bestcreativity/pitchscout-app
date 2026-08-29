import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const consumeAnalysisUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("consume_analysis_usage");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      allowed: Boolean(row?.allowed),
      used: Number(row?.used ?? 0),
      limit: Number(row?.limit_value ?? 5),
    };
  });
