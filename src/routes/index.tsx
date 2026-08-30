import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";

import { analyzeBusiness } from "@/lib/analyze.functions";
import type { AnalysisResult } from "@/lib/analyze.server";
import { saveResearch } from "@/lib/research.functions";
import { updateResearch } from "@/lib/research.functions";
import { useSession } from "@/hooks/useSession";
import { useGuestUsage } from "@/hooks/useGuestUsage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsageLimitDialog } from "@/components/usage-limit-dialog";
import { EmailPasteInput } from "@/components/email-paste-input";
import { consumeAnalysisUsage } from "@/lib/usage.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ACE PITCH — Find what you can pitch to any business" },
      {
        name: "description",
        content:
          "Paste a business website URL and ACE PITCH analyzes the business, website and digital presence to reveal the strongest services you can pitch.",
      },
      { property: "og:title", content: "ACE PITCH" },
      {
        property: "og:description",
        content:
          "A private scouting assistant that tells you exactly what to pitch to any business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AcePitch,
});

const STEPS = [
  "Website found",
  "Business identified",
  "Services identified",
  "Website analyzed",
  "Customer experience analyzed",
  "Digital presence analyzed",
  "Opportunities discovered",
  "Best pitch selected",
];

const AnalysisResults = lazy(() =>
  import("@/components/analysis-results").then(({ AnalysisResults }) => ({
    default: AnalysisResults,
  })),
);

function AcePitch() {
  const analyze = useServerFn(analyzeBusiness);
  const save = useServerFn(saveResearch);
  const update = useServerFn(updateResearch);
  const consumeUsage = useServerFn(consumeAnalysisUsage);
  const { user } = useSession();
  const guestUsage = useGuestUsage();
  const navigate = useNavigate();
  
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [researchId, setResearchId] = useState<string | null>(null);
  const [showUsageLimitDialog, setShowUsageLimitDialog] = useState(false);

  function isAllowedInput(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return false;

    try {
      const maybeUrl = new URL(trimmed);
      return maybeUrl.protocol === "http:" || maybeUrl.protocol === "https:";
    } catch {
      const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
      return emailPattern.test(trimmed);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || status === "running") return;

    if (!isAllowedInput(trimmed)) {
      setError("Enter a valid website URL or email address (for example: https://example.com or contact@example.com)");
      setStatus("error");
      return;
    }

    // Check guest usage limit
    if (!user && guestUsage.hasReachedLimit) {
      setShowUsageLimitDialog(true);
      return;
    }

    setStatus("running");
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      // Check user usage limit if registered
      if (user) {
        try {
          const usage = await consumeUsage({});
          if (!usage.allowed) {
            setShowUsageLimitDialog(true);
            setStatus("idle");
            return;
          }
        } catch (err) {
          // If usage check fails, continue anyway but log the error
          console.error("Failed to check usage:", err);
        }
      } else {
        // Consume guest usage
        guestUsage.consumeUsage();
      }

      let background: string | undefined;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("background")
          .eq("id", user.id)
          .maybeSingle();
        background = profile?.background ?? undefined;
      }
      const data = (await analyze({
        data: { url, ...(background ? { background } : {}) },
      })) as AnalysisResult;
      setResult(data);
      setStatus("done");
      if (user) {
        try {
          const savedResearch = await save({
            data: {
              url: data.url,
              businessName: data.business.name,
              bestPitchTitle: data.bestPitch.title,
              result: data,
            },
          });
          setResearchId(savedResearch.id);
          setSaved(true);
        } catch {
          /* saving is best-effort */
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during the analysis.",
      );
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setSaved(false);
    setResearchId(null);
  }

  return (
    <main className="px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            ACE PITCH
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Find what you can pitch to any business.
          </p>
        </header>

        <form onSubmit={onSubmit} className="mt-10">
          <div className="rounded-3xl border border-border bg-card p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_40px_-24px_rgba(15,23,42,0.25)]">
            <div className="px-4 pt-3">
              <EmailPasteInput
                value={url}
                onChange={(e) => setUrl(e)}
                placeholder="Paste website URL or contact@example.com"
              />
            </div>
            <p className="px-4 pb-3 pt-2 text-sm text-muted-foreground">
              Example: https://examplebusiness.com or contact@example.com
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={status === "running" || !url.trim()}
              className="h-13 w-full rounded-2xl text-base"
            >
              {status === "running" ? (
                <>
                  <Loader2 className="animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  Analyze Business <ArrowRight />
                </>
              )}
            </Button>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
            ACE PITCH analyzes the business, website, customer experience and
            digital opportunities to find the strongest services you can pitch.
            {!user && (
              <>
                <br />
                <span className="mt-2 block text-xs">
                  Free trial: {guestUsage.remaining} / {guestUsage.limit} analyses left
                </span>
              </>
            )}
          </p>
        </form>

        {status === "running" && <Progress />}

        {status === "error" && (
          <div className="animate-rise mt-10 rounded-3xl border border-destructive/25 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-foreground">Analysis failed</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={reset}>
              <RotateCcw /> Try again
            </Button>
          </div>
        )}

        {status === "done" && result && (
          <div className="mt-12">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {user
                  ? saved
                    ? "Saved to your storage."
                    : "Saving to your storage…"
                  : "Sign in to save this research."}
              </p>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={reset}>
                <RotateCcw /> New analysis
              </Button>
            </div>
            <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted/40" />}>
              <AnalysisResults
                result={result}
                onPitchChosen={async (opportunity) => {
                  if (!researchId) return;
                  await update({
                    data: {
                      id: researchId,
                      bestPitchTitle: opportunity.title,
                      result: {
                        ...result,
                        acePitch: { selectedPitchTitle: opportunity.title },
                      },
                    },
                  });
                }}
                isGuest={!user}
              />
            </Suspense>
          </div>
        )}
      </div>

      <UsageLimitDialog
        open={showUsageLimitDialog}
        onOpenChange={setShowUsageLimitDialog}
        isGuest={!user}
        onSignUp={() => navigate({ to: "/auth" })}
      />
    </main>
  );
}

function Progress() {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setDone((d) => (d < STEPS.length - 1 ? d + 1 : d));
    }, 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="animate-rise mt-12 rounded-3xl border border-border bg-card p-7">
      <p className="flex items-center gap-2 text-lg font-medium text-foreground">
        <Loader2 className="size-4 animate-spin text-primary" /> Analyzing
        business…
      </p>
      <ul className="mt-5 space-y-3">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-3 text-base transition-opacity duration-500 ${
              i <= done ? "opacity-100" : "opacity-35"
            }`}
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full ${
                i <= done ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {i <= done && <Check className="size-3" />}
            </span>
            <span className={i <= done ? "text-foreground" : "text-muted-foreground"}>
              {s}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
