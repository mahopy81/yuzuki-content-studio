"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const reasonMessages: Record<string, string> = {
  missing_env: "Supabaseの環境変数がまだ設定されていません。",
  signed_out: "ログインするとダッシュボードを見られます。",
  not_allowed: "このメールアドレスは利用許可リストに入っていません。"
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setIsLoading(false);

    if (signInError) {
      setError("メールアドレスまたはパスワードを確認してください。");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {reason && reasonMessages[reason] ? (
        <p className="rounded-md border border-champagne/40 bg-white/70 px-4 py-3 text-sm text-ink">
          {reasonMessages[reason]}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-ink">メールアドレス</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-md border border-stone-200 bg-white/80 px-4 py-3 outline-none transition focus:border-champagne"
          placeholder="example@gmail.com"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink">パスワード</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-md border border-stone-200 bg-white/80 px-4 py-3 outline-none transition focus:border-champagne"
          placeholder="••••••••"
        />
      </label>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-ink px-4 py-3 font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
