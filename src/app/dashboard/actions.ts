"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createContentItem,
  deleteContentItem,
  listContentItems,
  updateContentItem
} from "@/services/notion/contentItems";
import { createTheme, deleteTheme, listThemes, updateTheme } from "@/services/notion/themes";
import type { ContentItem, ContentItemInput, ContentStatus, Theme, ThemeInput } from "@/types/content";

type ActionResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です。");
  }

  return user.id;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "処理に失敗しました。";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getDashboardData(): Promise<
  ActionResult<{ themes: Theme[]; contentItems: ContentItem[] }>
> {
  try {
    await getUserId();
    const [themes, contentItems] = await Promise.all([listThemes(), listContentItems()]);

    return {
      ok: true,
      data: {
        themes,
        contentItems
      }
    };
  } catch (error) {
    return {
      ok: false,
      data: {
        themes: [],
        contentItems: []
      },
      error: errorMessage(error)
    };
  }
}

export async function saveThemeAction(input: ThemeInput): Promise<ActionResult<Theme>> {
  try {
    const userId = await getUserId();
    const theme = await createTheme({ ...input, userId });
    revalidatePath("/dashboard");
    return { ok: true, data: theme };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateThemeAction(
  id: string,
  input: Partial<ThemeInput>
): Promise<ActionResult<Theme>> {
  try {
    const userId = await getUserId();
    const theme = await updateTheme(id, { ...input, userId });
    revalidatePath("/dashboard");
    return { ok: true, data: theme };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteThemeAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await getUserId();
    await deleteTheme(id);
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function saveContentItemAction(
  input: ContentItemInput
): Promise<ActionResult<ContentItem>> {
  try {
    const userId = await getUserId();
    const contentItem = await createContentItem({ ...input, userId });
    revalidatePath("/dashboard");
    return { ok: true, data: contentItem };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateContentItemAction(
  id: string,
  input: Partial<ContentItemInput>
): Promise<ActionResult<ContentItem>> {
  try {
    const userId = await getUserId();
    const contentItem = await updateContentItem(id, { ...input, userId });
    revalidatePath("/dashboard");
    return { ok: true, data: contentItem };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateContentStatusAction(
  id: string,
  status: ContentStatus
): Promise<ActionResult<ContentItem>> {
  return updateContentItemAction(id, { status });
}

export async function deleteContentItemAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await getUserId();
    await deleteContentItem(id);
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function createSampleDataAction(): Promise<
  ActionResult<{ theme: Theme; contentItems: ContentItem[] }>
> {
  try {
    const userId = await getUserId();
    const theme = await createTheme({
      userId,
      week: "2026-W27",
      mainTheme: "AI副業で最初の1万円を作る方法",
      targetAudience: "20〜30代女性、未経験、副業に興味がある人",
      painPoint: "何から始めていいかわからず、情報収集だけで止まっている",
      desiredOutcome: "小さな商品や発信テーマを決めて、最初の一歩を踏み出せる",
      purpose: "LINE登録",
      cta: "LINEで無料ロードマップ配布中",
      offer: "AI副業スタート講座",
      angle: "難しいスキルより、最初の小さな実績づくりに絞る",
      memo: "Phase 1確認用のサンプルテーマです。",
      status: "active"
    });

    const base = {
      userId,
      themeId: theme.id,
      themeNotionPageId: theme.notionPageId,
      status: "idea" as const,
      cta: theme.cta,
      memo: "サンプルデータ"
    };

    const contentItems = await Promise.all([
      createContentItem({
        ...base,
        platform: "instagram",
        contentType: "instagram_carousel",
        title: "AI副業で最初の1万円を作る3ステップ",
        body: "表紙、共感、原因、解決策、CTAの流れで作成予定。"
      }),
      createContentItem({
        ...base,
        platform: "youtube_live",
        contentType: "youtube_live_plan",
        title: "AI副業の始め方を一緒に整理するライブ",
        script: "冒頭あいさつ、視聴者の悩み整理、3ステップ解説、質問回答、CTA。"
      }),
      createContentItem({
        ...base,
        platform: "x",
        contentType: "x_post",
        title: "AI副業初心者向けX投稿案",
        body: "最初から完璧な商品を作らず、小さく試すことが大事。"
      })
    ]);

    revalidatePath("/dashboard");
    return { ok: true, data: { theme, contentItems } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
