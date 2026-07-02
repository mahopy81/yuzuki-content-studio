import { signOut } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-lg border border-white/70 bg-white/62 p-6 shadow-soft backdrop-blur md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-champagne">Phase 0</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
              Yuzuki Content Studio
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              認証とNotion接続準備までの初期ダッシュボードです。投稿管理の中身はPhase 1で追加します。
            </p>
          </div>
          <form action={signOut}>
            <button className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-champagne">
              ログアウト
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/70 bg-white/64 p-5 backdrop-blur">
            <p className="text-sm text-stone-500">ログイン中</p>
            <p className="mt-2 break-all text-lg font-semibold text-ink">{user?.email}</p>
          </div>
          <div className="rounded-lg border border-white/70 bg-white/64 p-5 backdrop-blur">
            <p className="text-sm text-stone-500">Notion接続テスト</p>
            <a
              href="/api/notion/test"
              className="mt-2 inline-flex rounded-md bg-rose px-4 py-2 text-sm font-medium text-ink transition hover:bg-pink-200"
            >
              APIを確認する
            </a>
          </div>
          <div className="rounded-lg border border-white/70 bg-white/64 p-5 backdrop-blur">
            <p className="text-sm text-stone-500">次の実装</p>
            <p className="mt-2 text-lg font-semibold text-ink">Phase 1 投稿管理MVP</p>
          </div>
        </section>

        <section className="rounded-lg border border-white/70 bg-white/64 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold tracking-normal text-ink">Phase 0で確認すること</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-700 md:grid-cols-2">
            <li>メールアドレスとパスワードでログインできる</li>
            <li>未ログインではこの画面に入れない</li>
            <li>許可メールアドレス以外は利用できない</li>
            <li>Notion APIの接続テストができる</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
