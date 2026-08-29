import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const analyzeBusiness = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        url: z.string().min(3).max(2000),
        background: z.string().max(5000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { runAnalysis } = await import("./analyze.server");
    return runAnalysis(data.url, data.background);
  });
