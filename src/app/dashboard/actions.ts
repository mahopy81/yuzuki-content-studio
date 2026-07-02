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
import {
  createImageProject,
  deleteImageProject,
  listImageProjects,
  updateImageProject
} from "@/services/notion/imageProjects";
import { generatedContentToText, generateMockContentSet } from "@/services/ai/mockContent";
import { createTheme, deleteTheme, listThemes, updateTheme } from "@/services/notion/themes";
import type {
  ContentItem,
  ContentItemInput,
  ContentStatus,
  ImageProject,
  ImageProjectInput,
  ImageProjectType,
  Theme,
  ThemeInput
} from "@/types/content";

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
  ActionResult<{ themes: Theme[]; contentItems: ContentItem[]; imageProjects: ImageProject[] }>
> {
  try {
    await getUserId();
    const [themes, contentItems] = await Promise.all([listThemes(), listContentItems()]);
    const imageProjects = await listImageProjects().catch(() => []);

    return {
      ok: true,
      data: {
        themes,
        contentItems,
        imageProjects
      }
    };
  } catch (error) {
    return {
      ok: false,
      data: {
        themes: [],
        contentItems: [],
        imageProjects: []
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

export async function saveImageProjectAction(
  input: ImageProjectInput
): Promise<ActionResult<ImageProject>> {
  try {
    const userId = await getUserId();
    const imageProject = await createImageProject({ ...input, userId });
    revalidatePath("/dashboard");
    return { ok: true, data: imageProject };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateImageProjectAction(
  id: string,
  input: Partial<ImageProjectInput>
): Promise<ActionResult<ImageProject>> {
  try {
    const userId = await getUserId();
    const imageProject = await updateImageProject(id, { ...input, userId });
    revalidatePath("/dashboard");
    return { ok: true, data: imageProject };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteImageProjectAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await getUserId();
    await deleteImageProject(id);
    revalidatePath("/dashboard");
    return { ok: true, data: { id } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

function imageTypeForContent(contentItem: ContentItem): ImageProjectType {
  if (contentItem.contentType === "youtube_live_plan") {
    return "youtube_live_thumbnail";
  }

  if (contentItem.platform === "youtube") {
    return "youtube_thumbnail";
  }

  if (contentItem.contentType === "instagram_reel_script") {
    return "instagram_reel_cover";
  }

  if (contentItem.platform === "note") {
    return "note_eyecatch";
  }

  if (contentItem.platform === "threads") {
    return "threads_image";
  }

  if (contentItem.platform === "x") {
    return "x_image";
  }

  return "instagram_carousel_design";
}

function formatForImageType(imageType: ImageProjectType) {
  if (imageType === "youtube_thumbnail" || imageType === "youtube_live_thumbnail") {
    return "16:9 / 1280x720";
  }

  if (imageType === "instagram_reel_cover") {
    return "9:16 / 1080x1920";
  }

  if (imageType === "x_image") {
    return "16:9";
  }

  return "1:1 / 1080x1080";
}

function buildImagePrompt(contentItem: ContentItem, theme?: Theme) {
  const themeText = theme?.mainTheme || contentItem.title;
  const target = theme?.targetAudience || "発信を見ている読者";
  const cta = contentItem.cta || theme?.cta || "";

  return [
    `目的: ${contentItem.title}に使うSNS画像を作る。`,
    `テーマ: ${themeText}`,
    `届けたい相手: ${target}`,
    "雰囲気: やさしく信頼感があり、上品で読みやすい。余白を広めに取る。",
    "構図: メインコピーが中央で読みやすく、背景は情報を邪魔しない。",
    cta ? `CTA: ${cta}` : "",
    "注意: 小さな文字を詰め込みすぎず、スマホ画面で一瞬で意味が伝わる画像にする。"
  ]
    .filter(Boolean)
    .join("\n");
}

export async function createImageProjectFromContentAction(
  contentItem: ContentItem,
  theme?: Theme
): Promise<ActionResult<ImageProject>> {
  const imageType = imageTypeForContent(contentItem);

  return saveImageProjectAction({
    themeId: theme?.id ?? contentItem.themeId,
    themeTitle: theme?.mainTheme ?? "",
    contentItemId: contentItem.id,
    contentTitle: contentItem.title,
    platform: contentItem.platform,
    imageType,
    title: `${contentItem.title} 画像案`,
    status: "prompt_ready",
    format: formatForImageType(imageType),
    prompt: buildImagePrompt(contentItem, theme),
    negativePrompt: "文字が多すぎる、読みにくい、暗すぎる、過度な装飾、低解像度、実在ブランドのロゴ",
    referenceUrl: "",
    outputUrl: "",
    memo: "Phase 4で投稿から作成"
  });
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

export async function generateContentSetAction(
  theme: Theme
): Promise<ActionResult<{ contentItems: ContentItem[] }>> {
  try {
    const userId = await getUserId();
    const generated = generateMockContentSet({ theme });
    const base = {
      userId,
      themeId: theme.id,
      themeNotionPageId: theme.notionPageId,
      status: "generated" as const,
      cta: theme.cta,
      memo: "Phase 2のモック一括生成で作成"
    };

    const inputs: ContentItemInput[] = [
      {
        ...base,
        platform: "instagram",
        contentType: "instagram_carousel",
        title: generated.instagramCarousel.title,
        body: generatedContentToText(generated.instagramCarousel)
      },
      {
        ...base,
        platform: "instagram",
        contentType: "instagram_caption",
        title: `${theme.mainTheme} Instagramキャプション`,
        caption: `${generated.instagramCaption.hook}\n\n${generated.instagramCaption.body}\n\n${generated.instagramCaption.cta}`,
        hashtags: generated.instagramCaption.hashtags
      },
      {
        ...base,
        platform: "instagram_reel",
        contentType: "instagram_reel_script",
        title: generated.instagramReel.title,
        script: generatedContentToText(generated.instagramReel)
      },
      {
        ...base,
        platform: "youtube",
        contentType: "youtube_script",
        title: generated.youtube.title,
        script: generatedContentToText(generated.youtube),
        body: generated.youtube.description
      },
      ...generated.youtubeLives.map((livePlan, index) => ({
        ...base,
        platform: "youtube_live" as const,
        contentType: "youtube_live_plan" as const,
        title: livePlan.title,
        scheduledDate: livePlan.scheduledDate,
        script: generatedContentToText(livePlan),
        memo: `週2本ライブ企画 ${index + 1}本目 / Phase 2モック生成`
      })),
      {
        ...base,
        platform: "note",
        contentType: "note_article",
        title: generated.note.title,
        article: generatedContentToText(generated.note)
      },
      {
        ...base,
        platform: "threads",
        contentType: "threads_post",
        title: `${theme.mainTheme} Threads投稿案`,
        body: generated.threads.posts.join("\n\n")
      },
      {
        ...base,
        platform: "x",
        contentType: "x_post",
        title: `${theme.mainTheme} X投稿案`,
        body: generated.x.posts.join("\n\n")
      }
    ];

    const contentItems = await Promise.all(inputs.map((input) => createContentItem(input)));

    revalidatePath("/dashboard");
    return { ok: true, data: { contentItems } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
