import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — ACE PITCH" },
      {
        name: "description",
        content:
          "Sign in to ACE PITCH to save every business research report to your private storage.",
      },
      { property: "og:title", content: "Sign in — ACE PITCH" },
      {
        property: "og:description",
        content: "Create an account to keep your past business research.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const cooldownSeconds = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
    : 0;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/storage", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    if (!cooldownUntil) return;

    const timer = window.setInterval(() => {
      if (Date.now() >= cooldownUntil) {
        setCooldownUntil(null);
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  function handleRateLimitError(message?: string) {
    const text = message ?? "";
    if (!text.toLowerCase().includes("for security purposes") && !text.toLowerCase().includes("only request this after")) {
      return false;
    }

    setCooldownUntil(Date.now() + 33000);
    setError("Too many attempts. Please wait 33 seconds before trying again.");
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldownSeconds > 0) {
      setError(`Too many attempts. Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }

    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() || null },
          },
        });
        if (error) throw error;

        setMode("signin");
        setPassword("");
        setDisplayName("");
        setSuccessMessage(
          "Account created. Please check your email and confirm it before signing in.",
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("email not confirmed") ||
          error.message.toLowerCase().includes("confirm your email")
        ) {
          setError("Please verify your email before signing in. Check your inbox for the confirmation link.");
          return;
        }
        throw error;
      }

      navigate({ to: "/storage", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not sign you in.";
      if (handleRateLimitError(message)) {
        return;
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (cooldownSeconds > 0) {
      setError(`Too many attempts. Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }

    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      const message = result.error.message ?? "Google sign-in failed. Try again.";
      if (handleRateLimitError(message)) {
        return;
      }
      setError("Google sign-in failed. Try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/storage", replace: true });
  }

  return (
    <main className="min-h-screen bg-background px-5 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to ACE PITCH
        </Link>

        <div className="mt-6 rounded-3xl border border-border bg-card p-7">
          <h1 className="text-2xl font-semibold text-foreground">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            An account is optional — it only adds private storage for your past
            research.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 w-full rounded-2xl"
            onClick={google}
          >
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
              />
            </div>

            {successMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{successMessage}</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={busy || cooldownSeconds > 0}
              className="h-11 w-full rounded-2xl"
            >
              {busy && <Loader2 className="animate-spin" />}
              {cooldownSeconds > 0
                ? `Wait ${cooldownSeconds}s`
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setSuccessMessage(null);
            }}
            className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "No account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
