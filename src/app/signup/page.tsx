"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleAuthButton } from "@/components/auth-google-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="notebook-page w-full max-w-sm animate-scale-in p-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Check your inbox</h1>
          <p className="mt-2 text-sm text-ink/70">
            We sent a confirmation link to <span className="font-medium">{email}</span>. Click it
            to finish creating your account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="notebook-page w-full max-w-sm animate-scale-in p-8">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Create your account</h1>
            <p className="mt-1 text-sm text-ink/60">Start organizing what you're studying.</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-6">
          <GoogleAuthButton />
        </div>
        <div className="my-5 flex items-center gap-3 text-xs text-ink/40">
          <div className="h-px flex-1 bg-margin" />
          or
          <div className="h-px flex-1 bg-margin" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="fullName">
              Name
            </label>
            <input
              id="fullName"
              required
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rust">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-rust underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
