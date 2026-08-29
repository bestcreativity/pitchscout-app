import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/storage", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (isResetMode) {
        if (!email.trim()) {
          setError("Enter your email address to receive a reset link.");
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        setSuccessMessage("Password reset link sent. Check your inbox and follow the instructions.");
        return;
      }

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
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
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
            {isResetMode ? "Reset password" : mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isResetMode
              ? "Enter your email and we will send a secure reset link."
              : "An account is optional — it only adds private storage for your past research."}
          </p>

          {!isResetMode && (
            <>
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
            </>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {!isResetMode && mode === "signup" && (
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
            {!isResetMode && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
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
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
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
            )}

            {successMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{successMessage}</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {!isResetMode && (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(true);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full text-left text-sm text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
            )}

            <Button type="submit" disabled={busy} className="h-11 w-full rounded-2xl">
              {busy && <Loader2 className="animate-spin" />}
              {isResetMode
                ? "Send reset link"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setIsResetMode(false);
              setError(null);
              setSuccessMessage(null);
            }}
            className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {isResetMode
              ? "Back to sign in"
              : mode === "signin"
                ? "No account? Create one"
                : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
