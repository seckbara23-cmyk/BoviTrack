"use client";

import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Supabase n'est pas configuré — l'application fonctionne en mode démo.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError("Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }
      // Full navigation so the middleware sees the new session cookie.
      window.location.assign("/dashboard");
    } catch {
      setError("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-2">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-tile">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-sm text-earth/60">Connectez-vous à votre cheptel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-earth">
              📧 Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-2xl border-2 border-sand-dark bg-sand px-4 py-3 text-base text-earth focus:border-green focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-earth">
              🔒 Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border-2 border-sand-dark bg-sand px-4 py-3 text-base text-earth focus:border-green focus:outline-none"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-2xl bg-alert/10 px-4 py-3 text-sm font-medium text-alert"
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="tile-press flex w-full items-center justify-center gap-2 rounded-2xl bg-green px-4 py-3.5 text-base font-bold text-white shadow-tile hover:bg-green-dark disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        {!isSupabaseConfigured && (
          <p className="mt-4 rounded-2xl bg-gold/15 px-4 py-2.5 text-center text-xs font-medium text-gold-dark">
            🛠️ Mode démo : données fictives, aucune connexion requise.
          </p>
        )}
      </div>
    </div>
  );
}
