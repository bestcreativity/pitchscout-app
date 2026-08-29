import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveResearch } from "@/lib/research.functions";

export const Route = createFileRoute("/_authenticated/gig-creator")({
  head: () => ({
    meta: [
      { title: "Gig Creator — ACE PITCH" },
      { name: "description", content: "Turn one keyword into a complete Fiverr-style gig package." },
    ],
  }),
  component: GigCreatorPage,
});

function GigCreatorPage() {
  const save = useServerFn(saveResearch);
  const [keyword, setKeyword] = useState("shopify store setup");
  const [niche, setNiche] = useState("ecommerce founders");
  const [style, setStyle] = useState("premium and conversion-focused");
  const [result, setResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function generateGig() {
    const title = `I will build a ${keyword} strategy for ${niche}`;
    const description = `Need help with ${keyword}? I create a high-converting, premium-quality setup tailored for ${niche}. I will focus on speed, clarity, and user experience while matching your brand style: ${style}.`;
    const packageOne = "Starter package: quick setup, deliverable review, 1 revision.";
    const packageTwo = "Pro package: full setup, optimization, strategy guidance, 3 revisions.";
    const faq = [
      "What do I need to provide? A brief, target audience, and any references.",
      "How long does it take? Usually 2-5 days depending on scope.",
      "Can I request revisions? Yes, revisions are included based on the package selected.",
    ];

    const draft = `Gig Title\n${title}\n\nGig Description\n${description}\n\nPackage Options\n${packageOne}\n${packageTwo}\n\nFAQ\n${faq.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

    setResult(draft);
    try {
      await save({
        data: {
          url: "gig-creator://generate",
          businessName: keyword,
          bestPitchTitle: title,
          result: {
            type: "gig_creator",
            keyword,
            niche,
            style,
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
              <Sparkles className="size-4" /> Gig Creator
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-foreground">Turn one keyword into a full gig package</h1>
            <p className="mt-2 text-sm text-muted-foreground">Create a Fiverr-style offer from a single keyword, target buyer, and brand style.</p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Primary keyword</Label>
                <Input id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="niche">Target buyer / niche</Label>
                <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Brand style</Label>
                <Input id="style" value={style} onChange={(e) => setStyle(e.target.value)} />
              </div>
            </div>

            <Button className="mt-6 rounded-full" onClick={generateGig}>
              Generate gig concept
            </Button>

            {saved && (
              <p className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                <Check className="size-4" /> Saved to your saved research.
              </p>
            )}
          </section>

          <aside className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium text-foreground">Gig blueprint</h2>
            {result ? (
              <pre className="mt-4 whitespace-pre-wrap font-mono text-sm leading-6 text-muted-foreground">{result}</pre>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Your full Fiverr-style gig plan will appear here.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
