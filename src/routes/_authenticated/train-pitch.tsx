import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check, FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveResearch } from "@/lib/research.functions";

export const Route = createFileRoute("/_authenticated/train-pitch")({
  head: () => ({
    meta: [
      { title: "Train Pitch — ACE PITCH" },
      {
        name: "description",
        content: "Train ACE PITCH to build highly structured, persuasive pitch messages for your target business.",
      },
    ],
  }),
  component: TrainPitchPage,
});

function TrainPitchPage() {
  const save = useServerFn(saveResearch);
  const [business, setBusiness] = useState("Local SEO agency");
  const [audience, setAudience] = useState("Small local businesses with weak Google presence");
  const [result, setResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function generatePitch() {
    const structure = [
      `Opening: Hi ${business}, I noticed your Google presence isn’t converting the local traffic you already receive.`,
      `Pain point: Most local businesses lose qualified leads because their site, reviews, and local SEO are not aligned with how customers search.`,
      `Offer: We can fix the fundamentals with a focused local SEO audit, citation cleanup, landing page optimization, and conversion-focused offers.`,
      `Proof: This is built for businesses like yours that need more calls and enquiries without needing a full marketing team.`,
      `Close: I’d love to share a quick 10-minute plan showing exactly where the biggest opportunities are and what I would improve first.`,
    ];

    const draft = `Train Pitch Blueprint\n\nAudience: ${audience}\nBusiness: ${business}\n\n1. Hook\n${structure[0]}\n\n2. Problem\n${structure[1]}\n\n3. Solution\n${structure[2]}\n\n4. Value proof\n${structure[3]}\n\n5. CTA\n${structure[4]}`;

    setResult(draft);
    try {
      await save({
        data: {
          url: "train-pitch://generate",
          businessName: business,
          bestPitchTitle: "Train Pitch Blueprint",
          result: {
            type: "train_pitch",
            business,
            audience,
            draft,
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
      <div className="mx-auto w-full max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to main page
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="size-4" /> Train Pitch
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">Teach the AI how your pitch should sound</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Give the business, buyer profile, and outcome you want. ACE PITCH will structure the pitch in a persuasive format.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business">Business / offer</Label>
                <Input id="business" value={business} onChange={(e) => setBusiness(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Target buyer and problem</Label>
                <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
              </div>
            </div>

            <Button className="mt-6 rounded-full" onClick={generatePitch}>
              <FileText className="size-4" /> Generate pitch structure
            </Button>

            {saved && (
              <p className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                <Check className="size-4" /> Saved to your saved research.
              </p>
            )}
          </section>

          <aside className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground">Pitch output</h2>
            {result ? (
              <pre className="mt-4 whitespace-pre-wrap font-mono text-sm leading-6 text-muted-foreground">{result}</pre>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Your structured pitch message will appear here.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
