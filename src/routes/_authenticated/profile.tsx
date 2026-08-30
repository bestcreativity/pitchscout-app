import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Briefcase, Eye, EyeOff, Loader2, Save, Search, Store, Sparkles, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update your password.";
      setPasswordError(message);
    } finally {
      setPasswordBusy(false);
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
          Your background
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe what you do, your skills, services, tools and past results.
          ACE PITCH uses this to pick pitches you can actually deliver for each
          business.
        </p>

        <nav className="mt-8 rounded-3xl border border-border bg-card p-2 shadow-sm">
          <div className="divide-y divide-border">
            <Link to="/profile" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-foreground transition hover:bg-accent/40">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-primary">
                <Briefcase className="size-4" />
              </span>
              Profile
            </Link>
            <Link to="/find-leads" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-foreground transition hover:bg-accent/40">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-primary">
                <Search className="size-4" />
              </span>
              Find Leads
            </Link>
            <Link to="/leads-store" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-foreground transition hover:bg-accent/40">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-primary">
                <Store className="size-4" />
              </span>
              Leads Store
            </Link>
            <Link to="/train-pitch" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-foreground transition hover:bg-accent/40">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-primary">
                <Sparkles className="size-4" />
              </span>
              Train Pitch
            </Link>
            <Link to="/storage" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-foreground transition hover:bg-accent/40">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-primary">
                <FolderOpen className="size-4" />
              </span>
              Saved research
            </Link>
          </div>
        </nav>

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

        <form
          className="mt-8 space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-7"
          onSubmit={handlePasswordUpdate}
        >
          <div>
            <h2 className="text-xl font-semibold text-foreground">Change password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your password any time while signed in.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="newPassword">New password</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
            />
          </div>

          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          {passwordSuccess && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{passwordSuccess}</p>
          )}

          <Button type="submit" disabled={passwordBusy} className="rounded-2xl">
            {passwordBusy ? (
              <>
                <Loader2 className="animate-spin" /> Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
