import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "adetoyebiridwan1.0@gmail.com";

async function assertAdmin(userId: string, email: unknown) {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (normalizedEmail !== ADMIN_EMAIL) {
    throw new Error(`Admin access required. Sign in as ${ADMIN_EMAIL}.`);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context.userId, context.claims.email);
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(error.message);
    return Promise.all((data.users ?? []).map(async (user) => {
      const { data: profile } = await admin
        .from("profiles")
        .select("usage_count, usage_limit, weekly_limit, monthly_limit")
        .eq("id", user.id)
        .maybeSingle();
      const row = profile as {
        usage_count?: number;
        usage_limit?: number;
        weekly_limit?: number;
        monthly_limit?: number;
      } | null;
      return {
        id: user.id,
        email: user.email ?? "Not available",
        createdAt: user.created_at,
        usageCount: row?.usage_count ?? 0,
        usageLimit: row?.usage_limit ?? 5,
        weeklyLimit: row?.weekly_limit ?? 5,
        monthlyLimit: row?.monthly_limit ?? 20,
      };
    }));
  });

export const setUserUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        limit: z.number().int().min(0).max(10000).optional(),
        weeklyLimit: z.number().int().min(0).max(10000).optional(),
        monthlyLimit: z.number().int().min(0).max(10000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId, context.claims.email);
    const payload: Record<string, number | boolean> = { id: data.id, is_registered: true };
    if (typeof data.limit === "number") payload.usage_limit = data.limit;
    if (typeof data.weeklyLimit === "number") payload.weekly_limit = data.weeklyLimit;
    if (typeof data.monthlyLimit === "number") payload.monthly_limit = data.monthlyLimit;
    if (Object.keys(payload).length <= 2) {
      return { ok: true };
    }
    const { error } = await admin
      .from("profiles")
      .upsert(payload as never, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId, context.claims.email);
    if (data.id === context.userId) throw new Error("The admin account cannot be deleted here.");
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
