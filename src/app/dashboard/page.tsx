import { signOut, getDashboardData } from "./actions";
import { DashboardClient } from "./dashboard-client";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const result = await getDashboardData();

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mb-4 flex justify-end">
        <form action={signOut}>
          <button className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-champagne">
            ログアウト
          </button>
        </form>
      </div>
      <DashboardClient
        initialThemes={result.data?.themes ?? []}
        initialContentItems={result.data?.contentItems ?? []}
        initialImageProjects={result.data?.imageProjects ?? []}
        initialAnalysisItems={result.data?.analysisItems ?? []}
        initialThemeOptions={result.data?.themeOptions}
        initialError={result.ok ? undefined : result.error}
        userEmail={user?.email}
      />
    </main>
  );
}
