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
      { name: "description", content: "Browse the web with AI help and task automation inside the ACE PITCH workspace." },
    ],
  }),
  component: AIBrowserPage,
});

function AIBrowserPage() {
  const save = useServerFn(saveResearch);
  const [url, setUrl] = useState("https://example.com");
  const [instruction, setInstruction] = useState("Review this page and extract the main offer, ideal client, and next action.");
  const [assistantNotes, setAssistantNotes] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function runAssistant() {
    const notes = `AI browser task\n\nSite: ${url}\nInstruction: ${instruction}\n\nSuggested actions:\n1. Open the page and scan the headline, value proposition, and CTA.\n2. Identify the target customer and core offer.\n3. Summarize the offer in a simple outreach message.\n4. Recommend the next campaign or optimization step.`;

    setAssistantNotes(notes);
    try {
      await save({
        data: {
          url,
          businessName: "AI Browser Research",
          bestPitchTitle: "AI Browser Task",
          result: {
            type: "ai_browser",
            url,
            instruction,
            notes,
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
              <Sparkles className="size-4" /> Run AI task
            </Button>
          </div>

          <div className="flex gap-3 rounded-2xl border border-border bg-background p-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="border-b border-border bg-muted/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Browser view
              </div>
              <iframe title="ai-browser" src={url} className="h-[520px] w-full bg-white" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" />
            </div>

            <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
              <div className="space-y-2">
                <Label htmlFor="instruction">Task for the AI</Label>
                <textarea
                  id="instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="min-h-[140px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-0"
                />
              </div>

              <div className="rounded-2xl border border-border bg-card p-3">
                <h3 className="text-sm font-medium text-foreground">AI assistant notes</h3>
                {assistantNotes ? (
                  <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{assistantNotes}</pre>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Your AI-assisted breakdown will appear here.</p>
                )}
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
