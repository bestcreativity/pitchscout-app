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
      const { data: profile } = await admin.from("profiles").select("usage_count, usage_limit").eq("id", user.id).maybeSingle();
      const row = profile as { usage_count?: number; usage_limit?: number } | null;
      return { id: user.id, email: user.email ?? "Not available", createdAt: user.created_at, usageCount: row?.usage_count ?? 0, usageLimit: row?.usage_limit ?? 5 };
    }));
  });

export const setUserUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid(), limit: z.number().int().min(0).max(10000) }).parse(data))
  .handler(async ({ context, data }) => {
    const admin = await assertAdmin(context.userId, context.claims.email);
    const { error } = await admin.from("profiles").update({ usage_limit: data.limit } as never).eq("id", data.id);
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
