import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ChevronDown, Loader2, MessageSquarePlus, Trash2 } from "lucide-react";

import { AnalysisResults } from "@/components/analysis-results";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { deleteResearch, listResearches, updateResearch } from "@/lib/research.functions";
import { generateFollowUpMessage } from "@/lib/followup.functions";
import type { AnalysisResult } from "@/lib/analyze.server";
import {
  outreachUrl,
  PLATFORM_LABELS,
  type OutreachPlatform,
} from "@/lib/outreach";


export const Route = createFileRoute("/_authenticated/storage")({
  head: () => ({
    meta: [
      { title: "Saved research — ACE PITCH" },
      {
        name: "description",
        content:
          "Your private storage of past ACE PITCH business research reports. Review or delete any report.",
      },
      { property: "og:title", content: "Saved research — ACE PITCH" },
      {
        property: "og:description",
        content: "Every business you analyzed, saved privately to your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoragePage,
});

function StoragePage() {
  const list = useServerFn(listResearches);
  const remove = useServerFn(deleteResearch);
  const followUp = useServerFn(generateFollowUpMessage);
  const update = useServerFn(updateResearch);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<Record<string, { number: number; subject: string; message: string }[]>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["researches"],
    queryFn: () => list(),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["researches"] }),
  });

  async function onFollowUp(id: string, number: number) {
    setPendingId(id);
    setFollowUpError((p) => ({ ...p, [id]: "" }));
    try {
      const res = await followUp({ data: { id, followUpNumber: number } });
      setFollowUps((p) => ({ ...p, [id]: [...(p[id] ?? []), { number, ...res }] }));
    } catch (e) {
      setFollowUpError((p) => ({
        ...p,
        [id]: e instanceof Error ? e.message : "Could not generate a follow-up.",
      }));
    } finally {
      setPendingId(null);
    }
  }


  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> New analysis
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
          Saved research
        </h1>
        <p className="mt-2 text-muted-foreground">
          Every analysis you run while signed in is saved here. Delete anything
          you no longer need.
        </p>

        {isLoading && (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading your research…
          </p>
        )}

        {error && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
            <p className="font-medium text-foreground">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run an analysis and it will appear here automatically.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/">Analyze a business</Link>
            </Button>
          </div>
        )}

        {data && data.length === 0 && !error && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
            <p className="font-medium text-foreground">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run an analysis and it will appear here automatically.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/">Analyze a business</Link>
            </Button>
          </div>
        )}

        <ul className="mt-8 space-y-4">
          {(data ?? []).map((r) => {
            const isOpen = open === r.id;
            const stored = ((r.result as { acePitch?: { followUps?: { number: number; subject: string; message: string }[] } } | null)?.acePitch?.followUps ?? []);
            const sentFollowUps = [...stored, ...(followUps[r.id] ?? []).filter((item) => !stored.some((old) => old.number === item.number))].sort((a, b) => a.number - b.number);
            return (
              <li
                key={r.id}
                className="rounded-3xl border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium text-foreground">
                      {r.business_name || r.url}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.url}
                    </p>
                    {r.best_pitch_title && (
                      <p className="mt-2 text-sm text-foreground">
                        <span className="text-muted-foreground">Best pitch: </span>
                        {r.best_pitch_title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setOpen(isOpen ? null : r.id)}
                    >
                      <ChevronDown
                        className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                      {isOpen ? "Hide" : "View"}
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 5 }, (_, index) => index + 1).map((number) => {
                        const sent = sentFollowUps.some((item) => item.number === number);
                        const available = number === sentFollowUps.length + 1;
                        return (
                          <Button
                            key={number}
                            variant={sent ? "ghost" : "secondary"}
                            size="sm"
                            className="rounded-full"
                            disabled={pendingId === r.id || sent || !available}
                            onClick={() => onFollowUp(r.id, number)}
                          >
                            {pendingId === r.id && available ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <MessageSquarePlus className="size-4" />
                            )}
                            {sent ? `Follow up ${number} sent` : `Follow up ${number}`}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      disabled={del.isPending}
                      onClick={() => del.mutate(r.id)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </div>
                </div>

                {followUpError[r.id] && (
                  <p className="mt-4 text-sm text-destructive">
                    {followUpError[r.id]}
                  </p>
                )}

                {sentFollowUps.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-border bg-background p-5">
                    {sentFollowUps.map((item) => (
                      <div key={item.number} className="border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">Follow up {item.number}</p>
                          <div className="flex flex-wrap justify-end gap-2">
                            <CopyButton text={`Subject: ${item.subject}\n\n${item.message}`} />
                            {(Object.keys(PLATFORM_LABELS) as OutreachPlatform[]).map((platform) => (
                              <Button key={platform} asChild size="sm" variant="outline" className="rounded-full">
                                <a
                                  href={outreachUrl(platform, { subject: item.subject, message: item.message })}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  Open {PLATFORM_LABELS[platform]}
                                </a>
                              </Button>
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">Subject: <span className="text-foreground">{item.subject}</span></p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{item.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {isOpen && (
                  <div className="mt-6 border-t border-border pt-6">
                    <AnalysisResults
                      result={r.result as unknown as AnalysisResult}
                      selectedPitchTitle={r.best_pitch_title ?? undefined}
                      onPitchChosen={(opportunity) =>
                        update({
                          data: {
                            id: r.id,
                            bestPitchTitle: opportunity.title,
                            result: {
                              ...(r.result as object),
                              acePitch: { selectedPitchTitle: opportunity.title },
                            },
                          },
                        })
                      }
                    />
                  </div>
                )}

              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
