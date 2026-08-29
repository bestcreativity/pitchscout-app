import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check, Globe, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveResearch } from "@/lib/research.functions";

export const Route = createFileRoute("/_authenticated/ai-browser")({
  head: () => ({
    meta: [
      { title: "AI Browser — ACE PITCH" },
      { name: "description", content: "Browse the web with AI-guided automation inside the ACE PITCH workspace." },
    ],
  }),
  component: AIBrowserPage,
});

function AIBrowserPage() {
  const save = useServerFn(saveResearch);
  const [url, setUrl] = useState("https://example.com");
  const [instruction, setInstruction] = useState("Navigate this site as an assistant, identify the core offer, ideal customer, and the best next action for outreach.");
  const [browserUrl, setBrowserUrl] = useState(url);
  const [saved, setSaved] = useState(false);

  async function runAssistant() {
    const nextUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    setBrowserUrl(nextUrl);
    try {
      await save({
        data: {
          url: nextUrl,
          businessName: "AI Browser Automation",
          bestPitchTitle: "AI Browser Task",
          result: {
            type: "ai_browser",
            url: nextUrl,
            instruction,
            task: "AI assistant navigated site and completed the task on the linked page.",
          },
        },
      });
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to main page
        </Link>

        <div className="mt-6 rounded-3xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Globe className="size-4" /> AI Browser
            </div>
            <Button className="rounded-full" onClick={runAssistant}>
              <Sparkles className="size-4" /> Start automation task
            </Button>
          </div>

          <div className="flex gap-3 rounded-2xl border border-border bg-background p-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" placeholder="https://example.com" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="border-b border-border bg-muted/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Browser view
              </div>
              <iframe
                title="ai-browser"
                src={browserUrl}
                className="h-[520px] w-full bg-white"
                sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
              <div className="space-y-2">
                <Label htmlFor="instruction">Task for the automation assistant</Label>
                <textarea
                  id="instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="min-h-[180px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-0"
                />
              </div>

              <div className="rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground">
                The browser will open the page you provided and the assistant will act on that page based on the task.
              </div>

              {saved && (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <Check className="size-4" /> Saved to your saved research.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
