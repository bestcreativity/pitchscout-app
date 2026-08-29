import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your background — ACE PITCH" },
      {
        name: "description",
        content:
          "Describe your skills, services and experience so ACE PITCH tailors every pitch to what you actually offer.",
      },
      { property: "og:title", content: "Your background — ACE PITCH" },
      {
        property: "og:description",
        content:
          "Tell ACE PITCH what you do and it will only suggest pitches you can deliver.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const load = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => load(),
  });

  const [displayName, setDisplayName] = useState("");
  const [background, setBackground] = useState("");

  useEffect(() => {
    if (!data) return;
    setDisplayName(data.display_name ?? "");
    setBackground(data.background ?? "");
  }, [data]);

  const save = useMutation({
    mutationFn: () => update({ data: { displayName, background } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Background saved");
    },
    onError: () => toast.error("Could not save your background"),
  });

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
          Your background
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe what you do, your skills, services, tools and past results.
          ACE PITCH uses this to pick pitches you can actually deliver for each
          business.
        </p>

        {isLoading ? (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </p>
        ) : (
          <form
            className="mt-8 space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-7"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">
                Background — what you do & what you offer
              </Label>
              <Textarea
                id="background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={10}
                placeholder="e.g. I build fast websites and booking systems for local service businesses. Skills: web design, SEO, Google Business optimisation, automation with n8n, Meta ads. I usually charge $800–$3,000 per project. I don't do video editing or print design."
                className="min-h-48 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Be specific: services you sell, skills, typical price range, and
                anything you do NOT offer.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={save.isPending}
              className="rounded-2xl"
            >
              {save.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save /> Save background
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
