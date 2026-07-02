"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createSampleDataAction,
  deleteContentItemAction,
  deleteImageProjectAction,
  deleteThemeAction,
  generateContentSetAction,
  createImageProjectFromContentAction,
  saveContentItemAction,
  saveImageProjectAction,
  saveThemeAction,
  updateContentItemAction,
  updateImageProjectAction,
  updateContentStatusAction,
  updateThemeAction
} from "./actions";
import {
  contentStatusOptions,
  contentTypeOptions,
  imageProjectStatusOptions,
  imageProjectTypeOptions,
  labelFor,
  liveStreamTypeOptions,
  platformOptions,
  purposeOptions,
  themeStatusOptions,
  type ContentItem,
  type ContentItemInput,
  type ContentStatus,
  type ContentType,
  type ImageProject,
  type ImageProjectInput,
  type ImageProjectStatus,
  type ImageProjectType,
  type LiveStreamType,
  type Platform,
  type Theme,
  type ThemeInput,
  type ThemeStatus,
  type YouTubeLivePlan,
  type YouTubeLiveSection
} from "@/types/content";

type DashboardClientProps = {
  initialThemes: Theme[];
  initialContentItems: ContentItem[];
  initialImageProjects: ImageProject[];
  initialError?: string;
  userEmail?: string | null;
};

type BackupData = {
  themes: Theme[];
  contentItems: ContentItem[];
  imageProjects?: ImageProject[];
};

const backupKey = "yuzuki-content-studio-phase1";

const emptyThemeForm: ThemeInput = {
  week: "",
  mainTheme: "",
  targetAudience: "",
  painPoint: "",
  desiredOutcome: "",
  purpose: "LINE登録",
  cta: "",
  offer: "",
  angle: "",
  memo: "",
  status: "idea"
};

const emptyContentForm: ContentItemInput = {
  themeId: "",
  themeNotionPageId: "",
  platform: "instagram",
  contentType: "instagram_carousel",
  title: "",
  status: "idea",
  scheduledDate: "",
  publishedDate: "",
  cta: "",
  body: "",
  caption: "",
  script: "",
  article: "",
  hashtags: [],
  imageProjectId: "",
  memo: ""
};

const emptyImageProjectForm: ImageProjectInput = {
  themeId: "",
  themeTitle: "",
  contentItemId: "",
  contentTitle: "",
  platform: "instagram",
  imageType: "instagram_carousel_design",
  title: "",
  status: "idea",
  format: "1:1 / 1080x1080",
  prompt: "",
  negativePrompt: "",
  referenceUrl: "",
  outputUrl: "",
  memo: ""
};

function localId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function tagsToText(tags?: string[]) {
  return (tags ?? []).join(", ");
}

function linesToArray(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(value?: string[]) {
  return (value ?? []).join("\n");
}

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asLiveSection(value: unknown): YouTubeLiveSection | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const section = value as Partial<YouTubeLiveSection>;

  return {
    title: typeof section.title === "string" ? section.title : "",
    estimatedMinutes:
      typeof section.estimatedMinutes === "number" && Number.isFinite(section.estimatedMinutes)
        ? section.estimatedMinutes
        : 10,
    talkingPoints: asStringArray(section.talkingPoints),
    script: typeof section.script === "string" ? section.script : ""
  };
}

function defaultLiveSections(): YouTubeLiveSection[] {
  return [
    {
      title: "導入",
      estimatedMinutes: 10,
      talkingPoints: ["今日のテーマ", "視聴者に得てほしいこと"],
      script: ""
    },
    {
      title: "本編",
      estimatedMinutes: 30,
      talkingPoints: ["悩みの整理", "解決の流れ", "具体例"],
      script: ""
    }
  ];
}

function buildDefaultLivePlan(form: ContentItemInput, theme?: Theme): YouTubeLivePlan {
  const title = form.title || `${theme?.mainTheme ?? "今週のテーマ"} ライブ配信`;

  return {
    title,
    liveStreamType: "work_with_me",
    thumbnailText: "",
    theme: theme?.mainTheme ?? "",
    purpose: theme?.purpose ?? "",
    targetAudience: theme?.targetAudience ?? "",
    scheduledDate: form.scheduledDate,
    startTime: "",
    estimatedDurationMinutes: 60,
    openingGreeting: "",
    openingHook: "",
    outline: [],
    sections: defaultLiveSections(),
    chatTopics: [],
    commentPickupPoints: [],
    questionsForViewers: [],
    interactiveIdeas: [],
    workContent: "",
    explanationItems: [],
    announcement: "",
    cta: form.cta ?? theme?.cta ?? "",
    endingScript: "",
    clipIdeas: [],
    repurposeIdeas: []
  };
}

function parseLivePlan(form: ContentItemInput, theme?: Theme): YouTubeLivePlan {
  const fallback = buildDefaultLivePlan(form, theme);

  if (!form.script?.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(form.script) as Partial<YouTubeLivePlan>;
    const sections = Array.isArray(parsed.sections)
      ? parsed.sections
          .map(asLiveSection)
          .filter((section): section is YouTubeLiveSection => Boolean(section))
      : fallback.sections;

    return {
      ...fallback,
      ...parsed,
      title: typeof parsed.title === "string" ? parsed.title : fallback.title,
      liveStreamType: liveStreamTypeOptions.some((option) => option.value === parsed.liveStreamType)
        ? (parsed.liveStreamType as LiveStreamType)
        : fallback.liveStreamType,
      estimatedDurationMinutes:
        typeof parsed.estimatedDurationMinutes === "number" &&
        Number.isFinite(parsed.estimatedDurationMinutes)
          ? parsed.estimatedDurationMinutes
          : fallback.estimatedDurationMinutes,
      outline: asStringArray(parsed.outline),
      sections: sections.length > 0 ? sections : fallback.sections,
      chatTopics: asStringArray(parsed.chatTopics),
      commentPickupPoints: asStringArray(parsed.commentPickupPoints),
      questionsForViewers: asStringArray(parsed.questionsForViewers),
      interactiveIdeas: asStringArray(parsed.interactiveIdeas),
      explanationItems: asStringArray(parsed.explanationItems),
      clipIdeas: asStringArray(parsed.clipIdeas),
      repurposeIdeas: asStringArray(parsed.repurposeIdeas)
    };
  } catch {
    return {
      ...fallback,
      openingHook: form.script
    };
  }
}

function imageTypeForContent(contentItem?: ContentItem): ImageProjectType {
  if (!contentItem) {
    return "instagram_carousel_design";
  }

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

function buildImagePrompt(contentItem?: ContentItem, theme?: Theme) {
  const title = contentItem?.title || theme?.mainTheme || "SNS投稿";
  const themeText = theme?.mainTheme || title;
  const target = theme?.targetAudience || "発信を見ている読者";
  const cta = contentItem?.cta || theme?.cta || "";

  return [
    `目的: ${title}に使うSNS画像を作る。`,
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

function readBackup() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const stored = localStorage.getItem(backupKey);

  if (!stored) {
    return undefined;
  }

  try {
    return JSON.parse(stored) as BackupData;
  } catch {
    return undefined;
  }
}

export function DashboardClient({
  initialThemes,
  initialContentItems,
  initialImageProjects,
  initialError,
  userEmail
}: DashboardClientProps) {
  const shouldUseBackup =
    initialThemes.length === 0 && initialContentItems.length === 0 && initialImageProjects.length === 0;
  const backup = shouldUseBackup ? readBackup() : undefined;
  const [themes, setThemes] = useState(backup?.themes ?? initialThemes);
  const [contentItems, setContentItems] = useState(backup?.contentItems ?? initialContentItems);
  const [imageProjects, setImageProjects] = useState(
    backup?.imageProjects ?? initialImageProjects
  );
  const [themeForm, setThemeForm] = useState<ThemeInput>(emptyThemeForm);
  const [contentForm, setContentForm] = useState<ContentItemInput>(emptyContentForm);
  const [imageProjectForm, setImageProjectForm] =
    useState<ImageProjectInput>(emptyImageProjectForm);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingImageProjectId, setEditingImageProjectId] = useState<string | null>(null);
  const [creatingImageForContentId, setCreatingImageForContentId] = useState<string | null>(null);
  const [generatingThemeId, setGeneratingThemeId] = useState<string | null>(null);
  const [notice, setNotice] = useState(
    backup
      ? "Notionから読み込めなかったため、ブラウザ内のバックアップを表示しています。"
      : initialError
        ? `Notion読み込み: ${initialError}`
        : ""
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(backupKey, JSON.stringify({ themes, contentItems, imageProjects }));
  }, [contentItems, imageProjects, themes]);

  const currentWeekTheme = themes.find((theme) => theme.status === "active") ?? themes[0];

  const summary = useMemo(() => {
    const countByStatus = (status: ContentStatus) =>
      contentItems.filter((item) => item.status === status).length;

    return {
      drafting: countByStatus("drafting") + countByStatus("generated"),
      review: countByStatus("review"),
      scheduled: countByStatus("scheduled"),
      published: countByStatus("published"),
      imageWaiting: imageProjects.filter((project) =>
        ["idea", "prompt_ready", "generating", "review"].includes(project.status)
      ).length,
      analysisWaiting: countByStatus("published"),
      liveSchedules: contentItems.filter((item) => item.platform === "youtube_live").slice(0, 3),
      upcoming: contentItems
        .filter((item) => item.scheduledDate)
        .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""))
        .slice(0, 5)
    };
  }, [contentItems, imageProjects]);

  const platformCounts = useMemo(() => {
    return platformOptions.map((platform) => ({
      ...platform,
      count: contentItems.filter((item) => item.platform === platform.value).length
    }));
  }, [contentItems]);

  const selectedContentTheme = themes.find(
    (theme) => theme.id === (contentForm.themeId || themes[0]?.id || "")
  );

  const livePlan = useMemo(
    () => parseLivePlan(contentForm, selectedContentTheme),
    [contentForm, selectedContentTheme]
  );

  function updateContentForm(input: Partial<ContentItemInput>) {
    setContentForm((form) => ({ ...form, ...input }));
  }

  function updateLivePlan(input: YouTubeLivePlan) {
    setContentForm((form) => ({
      ...form,
      title: input.title,
      scheduledDate: input.scheduledDate ?? "",
      cta: input.cta,
      script: toPrettyJson(input)
    }));
  }

  function selectTheme(theme: Theme) {
    setEditingThemeId(theme.id);
    setThemeForm({
      userId: theme.userId,
      week: theme.week,
      mainTheme: theme.mainTheme,
      targetAudience: theme.targetAudience,
      painPoint: theme.painPoint,
      desiredOutcome: theme.desiredOutcome,
      purpose: theme.purpose || "LINE登録",
      cta: theme.cta,
      offer: theme.offer ?? "",
      angle: theme.angle,
      memo: theme.memo ?? "",
      status: theme.status
    });
  }

  function resetThemeForm() {
    setEditingThemeId(null);
    setThemeForm(emptyThemeForm);
  }

  function selectContentItem(contentItem: ContentItem) {
    setEditingContentId(contentItem.id);
    setContentForm({
      userId: contentItem.userId,
      themeId: contentItem.themeId,
      themeNotionPageId: contentItem.themeNotionPageId,
      platform: contentItem.platform,
      contentType: contentItem.contentType,
      title: contentItem.title,
      status: contentItem.status,
      scheduledDate: contentItem.scheduledDate ?? "",
      publishedDate: contentItem.publishedDate ?? "",
      cta: contentItem.cta ?? "",
      body: contentItem.body ?? "",
      caption: contentItem.caption ?? "",
      script: contentItem.script ?? "",
      article: contentItem.article ?? "",
      hashtags: contentItem.hashtags ?? [],
      imageProjectId: contentItem.imageProjectId ?? "",
      memo: contentItem.memo ?? ""
    });
  }

  function resetContentForm() {
    setEditingContentId(null);
    setContentForm({
      ...emptyContentForm,
      themeId: themes[0]?.id ?? "",
      themeNotionPageId: themes[0]?.notionPageId ?? ""
    });
  }

  function withSelectedTheme(input: ContentItemInput) {
    const selectedTheme = themes.find((theme) => theme.id === input.themeId);

    return {
      ...input,
      themeNotionPageId: selectedTheme?.notionPageId ?? input.themeNotionPageId
    };
  }

  function selectImageProject(imageProject: ImageProject) {
    setEditingImageProjectId(imageProject.id);
    setImageProjectForm({
      userId: imageProject.userId,
      themeId: imageProject.themeId ?? "",
      themeTitle: imageProject.themeTitle ?? "",
      contentItemId: imageProject.contentItemId ?? "",
      contentTitle: imageProject.contentTitle ?? "",
      platform: imageProject.platform,
      imageType: imageProject.imageType,
      title: imageProject.title,
      status: imageProject.status,
      format: imageProject.format,
      prompt: imageProject.prompt,
      negativePrompt: imageProject.negativePrompt ?? "",
      referenceUrl: imageProject.referenceUrl ?? "",
      outputUrl: imageProject.outputUrl ?? "",
      memo: imageProject.memo ?? ""
    });
  }

  function resetImageProjectForm() {
    setEditingImageProjectId(null);
    setImageProjectForm({
      ...emptyImageProjectForm,
      themeId: themes[0]?.id ?? "",
      themeTitle: themes[0]?.mainTheme ?? ""
    });
  }

  function updateImageProjectForm(input: Partial<ImageProjectInput>) {
    setImageProjectForm((form) => ({ ...form, ...input }));
  }

  function submitTheme() {
    startTransition(async () => {
      const input = {
        ...themeForm,
        mainTheme: themeForm.mainTheme.trim(),
        week: themeForm.week.trim()
      };

      if (!input.mainTheme || !input.week) {
        setNotice("テーマ名と週は必須です。");
        return;
      }

      if (editingThemeId) {
        const result = await updateThemeAction(editingThemeId, input);
        const updatedTheme =
          result.data ??
          ({
            ...themes.find((theme) => theme.id === editingThemeId),
            ...input,
            updatedAt: nowIso()
          } as Theme);

        setThemes((current) =>
          current.map((theme) => (theme.id === editingThemeId ? updatedTheme : theme))
        );
        setNotice(result.ok ? "テーマをNotionに保存しました。" : `ローカル更新: ${result.error}`);
      } else {
        const result = await saveThemeAction(input);
        const createdTheme =
          result.data ??
          ({
            ...input,
            id: localId("theme"),
            createdAt: nowIso(),
            updatedAt: nowIso()
          } satisfies Theme);

        setThemes((current) => [createdTheme, ...current]);
        setNotice(
          result.ok
            ? "テーマをNotionに保存しました。"
            : `Notion保存に失敗したため、ブラウザにバックアップしました。${result.error}`
        );
      }

      resetThemeForm();
    });
  }

  function submitContentItem() {
    startTransition(async () => {
      const selectedThemeId = contentForm.themeId || themes[0]?.id || "";
      const input = withSelectedTheme({
        ...contentForm,
        themeId: selectedThemeId,
        title: contentForm.title.trim()
      });

      if (!input.title || !input.themeId) {
        setNotice("コンテンツ名と紐づけるテーマは必須です。");
        return;
      }

      if (editingContentId) {
        const result = await updateContentItemAction(editingContentId, input);
        const updatedItem =
          result.data ??
          ({
            ...contentItems.find((item) => item.id === editingContentId),
            ...input,
            updatedAt: nowIso()
          } as ContentItem);

        setContentItems((current) =>
          current.map((item) => (item.id === editingContentId ? updatedItem : item))
        );
        setNotice(result.ok ? "コンテンツをNotionに保存しました。" : `ローカル更新: ${result.error}`);
      } else {
        const result = await saveContentItemAction(input);
        const createdItem =
          result.data ??
          ({
            ...input,
            id: localId("content"),
            createdAt: nowIso(),
            updatedAt: nowIso()
          } satisfies ContentItem);

        setContentItems((current) => [createdItem, ...current]);
        setNotice(
          result.ok
            ? "コンテンツをNotionに保存しました。"
            : `Notion保存に失敗したため、ブラウザにバックアップしました。${result.error}`
        );
      }

      resetContentForm();
    });
  }

  function submitImageProject() {
    startTransition(async () => {
      const selectedTheme = themes.find((theme) => theme.id === imageProjectForm.themeId);
      const selectedContent = contentItems.find(
        (item) => item.id === imageProjectForm.contentItemId
      );
      const input: ImageProjectInput = {
        ...imageProjectForm,
        themeTitle: selectedTheme?.mainTheme ?? imageProjectForm.themeTitle,
        contentTitle: selectedContent?.title ?? imageProjectForm.contentTitle,
        title: imageProjectForm.title.trim(),
        prompt: imageProjectForm.prompt.trim()
      };

      if (!input.title || !input.prompt) {
        setNotice("画像プロジェクト名とプロンプトは必須です。");
        return;
      }

      if (editingImageProjectId) {
        const result = await updateImageProjectAction(editingImageProjectId, input);
        const updatedProject =
          result.data ??
          ({
            ...imageProjects.find((project) => project.id === editingImageProjectId),
            ...input,
            updatedAt: nowIso()
          } as ImageProject);

        setImageProjects((current) =>
          current.map((project) =>
            project.id === editingImageProjectId ? updatedProject : project
          )
        );
        setNotice(result.ok ? "画像プロジェクトをNotionに保存しました。" : `ローカル更新: ${result.error}`);
      } else {
        const result = await saveImageProjectAction(input);
        const createdProject =
          result.data ??
          ({
            ...input,
            id: localId("image"),
            createdAt: nowIso(),
            updatedAt: nowIso()
          } satisfies ImageProject);

        setImageProjects((current) => [createdProject, ...current]);
        setNotice(
          result.ok
            ? "画像プロジェクトをNotionに保存しました。"
            : `Notion保存に失敗したため、ブラウザにバックアップしました。${result.error}`
        );
      }

      resetImageProjectForm();
    });
  }

  function createImageProjectFromContent(contentItem: ContentItem) {
    const theme = themes.find((themeItem) => themeItem.id === contentItem.themeId);
    setCreatingImageForContentId(contentItem.id);

    startTransition(async () => {
      const result = await createImageProjectFromContentAction(contentItem, theme);
      setCreatingImageForContentId(null);

      const imageProject = result.data;

      if (imageProject) {
        setImageProjects((current) => [imageProject, ...current]);
        setContentItems((current) =>
          current.map((item) =>
            item.id === contentItem.id ? { ...item, imageProjectId: imageProject.id } : item
          )
        );
        setNotice("投稿から画像プロジェクトを作成し、Notionに保存しました。");
        return;
      }

      const imageType = imageTypeForContent(contentItem);
      const localProject: ImageProject = {
        ...emptyImageProjectForm,
        id: localId("image"),
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
        negativePrompt: "文字が多すぎる、読みにくい、暗すぎる、過度な装飾、低解像度",
        memo: `Notion保存に失敗したためローカル作成: ${result.error ?? ""}`,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };

      setImageProjects((current) => [localProject, ...current]);
      setNotice(`画像プロジェクトをブラウザにバックアップしました。${result.error ?? ""}`);
    });
  }

  function changeContentStatus(id: string, status: ContentStatus) {
    setContentItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status, updatedAt: nowIso() } : item))
    );

    startTransition(async () => {
      if (id.startsWith("content-")) {
        return;
      }

      const result = await updateContentStatusAction(id, status);
      if (!result.ok) {
        setNotice(`ステータスはローカル更新のみです。${result.error}`);
      }
    });
  }

  function removeTheme(id: string) {
    if (!confirm("このテーマを削除しますか？ Notion上ではアーカイブされます。")) {
      return;
    }

    startTransition(async () => {
      const result = id.startsWith("theme-") ? { ok: true } : await deleteThemeAction(id);

      if (result.ok) {
        setThemes((current) => current.filter((theme) => theme.id !== id));
        setContentItems((current) => current.filter((item) => item.themeId !== id));
        setNotice("テーマを削除しました。");
      } else {
        setNotice(`削除できませんでした。${result.error}`);
      }
    });
  }

  function removeContentItem(id: string) {
    if (!confirm("このコンテンツを削除しますか？ Notion上ではアーカイブされます。")) {
      return;
    }

    startTransition(async () => {
      const result = id.startsWith("content-") ? { ok: true } : await deleteContentItemAction(id);

      if (result.ok) {
        setContentItems((current) => current.filter((item) => item.id !== id));
        setNotice("コンテンツを削除しました。");
      } else {
        setNotice(`削除できませんでした。${result.error}`);
      }
    });
  }

  function removeImageProject(id: string) {
    if (!confirm("この画像プロジェクトを削除しますか？ Notion上ではアーカイブされます。")) {
      return;
    }

    startTransition(async () => {
      const result = id.startsWith("image-") ? { ok: true } : await deleteImageProjectAction(id);

      if (result.ok) {
        setImageProjects((current) => current.filter((project) => project.id !== id));
        setNotice("画像プロジェクトを削除しました。");
      } else {
        setNotice(`削除できませんでした。${result.error}`);
      }
    });
  }

  function createSampleData() {
    startTransition(async () => {
      const result = await createSampleDataAction();

      const sampleData = result.data;

      if (sampleData) {
        setThemes((current) => [sampleData.theme, ...current]);
        setContentItems((current) => [...sampleData.contentItems, ...current]);
        setNotice("サンプルデータをNotionに保存しました。");
        return;
      }

      const theme: Theme = {
        ...emptyThemeForm,
        id: localId("theme"),
        week: "2026-W27",
        mainTheme: "AI副業で最初の1万円を作る方法",
        targetAudience: "20〜30代女性、未経験、副業に興味がある人",
        painPoint: "何から始めていいかわからない",
        desiredOutcome: "最初の小さな実績づくりができる",
        cta: "LINEで無料ロードマップ配布中",
        offer: "AI副業スタート講座",
        angle: "最初の一歩に絞る",
        status: "active",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      const contentItem: ContentItem = {
        ...emptyContentForm,
        id: localId("content"),
        themeId: theme.id,
        platform: "youtube_live",
        contentType: "youtube_live_plan",
        title: "AI副業の始め方ライブ",
        status: "idea",
        script: "週テーマから作るYouTubeライブ企画のサンプルです。",
        createdAt: nowIso(),
        updatedAt: nowIso()
      };

      setThemes((current) => [theme, ...current]);
      setContentItems((current) => [contentItem, ...current]);
      setNotice(`サンプルをブラウザに保存しました。${result.error ?? ""}`);
    });
  }

  function generateContentSet(theme: Theme) {
    setGeneratingThemeId(theme.id);
    startTransition(async () => {
      const result = await generateContentSetAction(theme);
      setGeneratingThemeId(null);

      const generatedData = result.data;

      if (generatedData) {
        setContentItems((current) => [...generatedData.contentItems, ...current]);
        setNotice("テーマから各媒体のコンテンツ案を一括生成し、Notionに保存しました。");
        return;
      }

      setNotice(`一括生成に失敗しました。${result.error ?? ""}`);
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-white/70 bg-white/68 p-6 shadow-soft backdrop-blur md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-champagne">Phase 4</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            Yuzuki Content Studio
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            投稿案と画像制作プロジェクトをまとめて管理し、Notionへ保存できます。
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-stone-600 md:items-end">
          <span>ログイン中: {userEmail}</span>
          <a
            href="/api/notion/test"
            className="rounded-md border border-stone-200 bg-white px-4 py-2 text-center font-medium text-ink transition hover:border-champagne"
          >
            Notion接続テスト
          </a>
        </div>
      </header>

      {notice ? (
        <div className="rounded-md border border-champagne/50 bg-white/78 px-4 py-3 text-sm text-ink">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="今週のテーマ" value={currentWeekTheme?.mainTheme ?? "未設定"} />
        <MetricCard label="作成中" value={summary.drafting.toString()} />
        <MetricCard label="確認待ち" value={summary.review.toString()} />
        <MetricCard label="予約済み" value={summary.scheduled.toString()} />
        <MetricCard label="画像制作中" value={summary.imageWaiting.toString()} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="テーマ管理">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label="週"
              value={themeForm.week}
              placeholder="2026-W27"
              onChange={(value) => setThemeForm((form) => ({ ...form, week: value }))}
            />
            <SelectField
              label="ステータス"
              value={themeForm.status}
              options={themeStatusOptions}
              onChange={(value) =>
                setThemeForm((form) => ({ ...form, status: value as ThemeStatus }))
              }
            />
            <TextField
              label="メインテーマ"
              value={themeForm.mainTheme}
              placeholder="AI副業で最初の1万円を作る方法"
              onChange={(value) => setThemeForm((form) => ({ ...form, mainTheme: value }))}
            />
            <SelectSimpleField
              label="投稿の目的"
              value={themeForm.purpose}
              options={purposeOptions}
              onChange={(value) => setThemeForm((form) => ({ ...form, purpose: value }))}
            />
            <TextAreaField
              label="ターゲット"
              value={themeForm.targetAudience}
              onChange={(value) => setThemeForm((form) => ({ ...form, targetAudience: value }))}
            />
            <TextAreaField
              label="読者の悩み"
              value={themeForm.painPoint}
              onChange={(value) => setThemeForm((form) => ({ ...form, painPoint: value }))}
            />
            <TextAreaField
              label="理想状態"
              value={themeForm.desiredOutcome}
              onChange={(value) => setThemeForm((form) => ({ ...form, desiredOutcome: value }))}
            />
            <TextAreaField
              label="CTA"
              value={themeForm.cta}
              onChange={(value) => setThemeForm((form) => ({ ...form, cta: value }))}
            />
            <TextField
              label="商品導線"
              value={themeForm.offer ?? ""}
              onChange={(value) => setThemeForm((form) => ({ ...form, offer: value }))}
            />
            <TextField
              label="訴求角度"
              value={themeForm.angle}
              onChange={(value) => setThemeForm((form) => ({ ...form, angle: value }))}
            />
            <div className="md:col-span-2">
              <TextAreaField
                label="参考メモ"
                value={themeForm.memo ?? ""}
                onChange={(value) => setThemeForm((form) => ({ ...form, memo: value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={submitTheme}
              disabled={isPending}
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {editingThemeId ? "テーマを保存" : "テーマを作成"}
            </button>
            <button
              onClick={resetThemeForm}
              className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink"
            >
              入力をリセット
            </button>
            <button
              onClick={createSampleData}
              disabled={isPending}
              className="rounded-md border border-champagne/60 bg-rose px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              サンプルデータ投入
            </button>
          </div>
        </Panel>

        <Panel title="投稿状況">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-ink">媒体別の制作状況</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {platformCounts.map((platform) => (
                  <div
                    key={platform.value}
                    className="rounded-md border border-stone-200 bg-white/75 px-3 py-2 text-sm"
                  >
                    <span className="text-stone-500">{platform.label}</span>
                    <strong className="ml-2 text-ink">{platform.count}</strong>
                  </div>
                ))}
              </div>
            </div>
            <MiniList
              title="直近の投稿予定"
              items={summary.upcoming.map((item) => `${item.scheduledDate} / ${item.title}`)}
              emptyText="予約済みの投稿はまだありません。"
            />
            <MiniList
              title="直近のライブ配信予定"
              items={summary.liveSchedules.map((item) => item.title)}
              emptyText="ライブ配信企画はまだありません。"
            />
            <MiniList
              title="直近の分析メモ"
              items={contentItems
                .filter((item) => item.memo && item.status === "published")
                .slice(0, 3)
                .map((item) => item.memo ?? "")}
              emptyText="分析メモはPhase 8で強化します。"
            />
          </div>
        </Panel>
      </section>

      <Panel title="テーマ一覧">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {themes.length === 0 ? (
            <p className="text-sm text-stone-500">まだテーマがありません。</p>
          ) : (
            themes.map((theme) => (
              <article
                key={theme.id}
                className="rounded-lg border border-stone-200 bg-white/72 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-stone-500">{theme.week}</p>
                    <h3 className="mt-1 text-base font-semibold text-ink">{theme.mainTheme}</h3>
                  </div>
                  <span className="rounded-full bg-rose px-3 py-1 text-xs text-ink">
                    {labelFor(themeStatusOptions, theme.status)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                  {theme.targetAudience || "ターゲット未入力"}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => generateContentSet(theme)}
                    disabled={isPending || generatingThemeId === theme.id}
                    className="rounded-md bg-ink px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {generatingThemeId === theme.id ? "生成中" : "一括生成"}
                  </button>
                  <button
                    onClick={() => selectTheme(theme)}
                    className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => removeTheme(theme.id)}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                  >
                    削除
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>

      <Panel title="コンテンツ作成・編集">
        <div className="grid gap-3 md:grid-cols-3">
          <SelectSimpleField
            label="テーマ"
            value={contentForm.themeId || themes[0]?.id || ""}
            options={themes.map((theme) => ({ value: theme.id, label: theme.mainTheme }))}
            onChange={(value) => {
              const selectedTheme = themes.find((theme) => theme.id === value);
              setContentForm((form) => ({
                ...form,
                themeId: value,
                themeNotionPageId: selectedTheme?.notionPageId ?? ""
              }));
            }}
          />
          <SelectField
            label="媒体"
            value={contentForm.platform}
            options={platformOptions}
            onChange={(value) =>
              setContentForm((form) => ({ ...form, platform: value as Platform }))
            }
          />
          <SelectField
            label="コンテンツ種別"
            value={contentForm.contentType}
            options={contentTypeOptions}
            onChange={(value) =>
              setContentForm((form) => ({ ...form, contentType: value as ContentType }))
            }
          />
          <TextField
            label="タイトル"
            value={contentForm.title}
            onChange={(value) => {
              if (contentForm.contentType === "youtube_live_plan") {
                updateLivePlan({ ...livePlan, title: value });
                return;
              }

              updateContentForm({ title: value });
            }}
          />
          <SelectField
            label="ステータス"
            value={contentForm.status}
            options={contentStatusOptions}
            onChange={(value) =>
              setContentForm((form) => ({ ...form, status: value as ContentStatus }))
            }
          />
          <TextField
            label="投稿予定日"
            type="date"
            value={contentForm.scheduledDate ?? ""}
            onChange={(value) => {
              if (contentForm.contentType === "youtube_live_plan") {
                updateLivePlan({ ...livePlan, scheduledDate: value });
                return;
              }

              updateContentForm({ scheduledDate: value });
            }}
          />
        </div>

        {editingContentId ? (
          <div className="mt-4 rounded-md border border-champagne/50 bg-rose/70 px-4 py-3 text-sm text-ink">
            編集中: {contentForm.title || "無題"} /{" "}
            {labelFor(contentTypeOptions, contentForm.contentType)}
          </div>
        ) : null}

        <ContentEditorFields
          form={contentForm}
          livePlan={livePlan}
          onChange={updateContentForm}
          onChangeLivePlan={updateLivePlan}
        />

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <TextField
            label="CTA"
            value={contentForm.cta ?? ""}
            onChange={(value) => {
              if (contentForm.contentType === "youtube_live_plan") {
                updateLivePlan({ ...livePlan, cta: value });
                return;
              }

              updateContentForm({ cta: value });
            }}
          />
          <TextField
            label="ハッシュタグ"
            value={tagsToText(contentForm.hashtags)}
            placeholder="AI副業, 初心者, 発信"
            onChange={(value) => updateContentForm({ hashtags: normalizeTags(value) })}
          />
          <div className="md:col-span-3">
            <TextAreaField
              label="メモ"
              value={contentForm.memo ?? ""}
              onChange={(value) => updateContentForm({ memo: value })}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={submitContentItem}
            disabled={isPending || themes.length === 0}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {editingContentId ? "コンテンツを保存" : "コンテンツを作成"}
          </button>
          <button
            onClick={resetContentForm}
            className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink"
          >
            入力をリセット
          </button>
        </div>
      </Panel>

      <Panel title="画像プロジェクト作成・編集">
        <div className="grid gap-3 md:grid-cols-3">
          <SelectSimpleField
            label="テーマ"
            value={imageProjectForm.themeId ?? ""}
            options={themes.map((theme) => ({ value: theme.id, label: theme.mainTheme }))}
            onChange={(value) => {
              const selectedTheme = themes.find((theme) => theme.id === value);
              updateImageProjectForm({
                themeId: value,
                themeTitle: selectedTheme?.mainTheme ?? ""
              });
            }}
          />
          <SelectSimpleField
            label="関連投稿"
            value={imageProjectForm.contentItemId ?? ""}
            options={contentItems.map((item) => ({ value: item.id, label: item.title }))}
            onChange={(value) => {
              const selectedContent = contentItems.find((item) => item.id === value);
              const selectedTheme = themes.find((theme) => theme.id === selectedContent?.themeId);
              const imageType = imageTypeForContent(selectedContent);

              updateImageProjectForm({
                contentItemId: value,
                contentTitle: selectedContent?.title ?? "",
                themeId: selectedTheme?.id ?? imageProjectForm.themeId,
                themeTitle: selectedTheme?.mainTheme ?? imageProjectForm.themeTitle,
                platform: selectedContent?.platform ?? imageProjectForm.platform,
                imageType,
                title: selectedContent ? `${selectedContent.title} 画像案` : imageProjectForm.title,
                format: formatForImageType(imageType),
                prompt: buildImagePrompt(selectedContent, selectedTheme),
                negativePrompt:
                  imageProjectForm.negativePrompt ||
                  "文字が多すぎる、読みにくい、暗すぎる、過度な装飾、低解像度"
              });
            }}
          />
          <TextField
            label="画像プロジェクト名"
            value={imageProjectForm.title}
            onChange={(value) => updateImageProjectForm({ title: value })}
          />
          <SelectField
            label="媒体"
            value={imageProjectForm.platform}
            options={platformOptions}
            onChange={(value) => updateImageProjectForm({ platform: value as Platform })}
          />
          <SelectField
            label="画像タイプ"
            value={imageProjectForm.imageType}
            options={imageProjectTypeOptions}
            onChange={(value) => {
              const imageType = value as ImageProjectType;
              updateImageProjectForm({
                imageType,
                format: formatForImageType(imageType)
              });
            }}
          />
          <SelectField
            label="ステータス"
            value={imageProjectForm.status}
            options={imageProjectStatusOptions}
            onChange={(value) =>
              updateImageProjectForm({ status: value as ImageProjectStatus })
            }
          />
          <TextField
            label="サイズ・形式"
            value={imageProjectForm.format}
            placeholder="1:1 / 1080x1080"
            onChange={(value) => updateImageProjectForm({ format: value })}
          />
          <TextField
            label="参考URL"
            value={imageProjectForm.referenceUrl ?? ""}
            onChange={(value) => updateImageProjectForm({ referenceUrl: value })}
          />
          <TextField
            label="完成URL"
            value={imageProjectForm.outputUrl ?? ""}
            onChange={(value) => updateImageProjectForm({ outputUrl: value })}
          />
          <div className="md:col-span-2">
            <TextAreaField
              label="画像生成プロンプト"
              value={imageProjectForm.prompt}
              rows={8}
              onChange={(value) => updateImageProjectForm({ prompt: value })}
            />
          </div>
          <TextAreaField
            label="避けたい表現"
            value={imageProjectForm.negativePrompt ?? ""}
            rows={8}
            onChange={(value) => updateImageProjectForm({ negativePrompt: value })}
          />
          <div className="md:col-span-3">
            <TextAreaField
              label="制作メモ"
              value={imageProjectForm.memo ?? ""}
              onChange={(value) => updateImageProjectForm({ memo: value })}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={submitImageProject}
            disabled={isPending}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {editingImageProjectId ? "画像プロジェクトを保存" : "画像プロジェクトを作成"}
          </button>
          <button
            onClick={resetImageProjectForm}
            className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink"
          >
            入力をリセット
          </button>
        </div>
      </Panel>

      <Panel title="画像プロジェクト一覧">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {imageProjects.length === 0 ? (
            <p className="text-sm text-stone-500">まだ画像プロジェクトがありません。</p>
          ) : (
            imageProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-lg border border-stone-200 bg-white/72 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-stone-500">
                      {labelFor(imageProjectTypeOptions, project.imageType)} / {project.format}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-ink">{project.title}</h3>
                  </div>
                  <span className="rounded-full bg-rose px-3 py-1 text-xs text-ink">
                    {labelFor(imageProjectStatusOptions, project.status)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                  {project.prompt || "プロンプト未入力"}
                </p>
                <div className="mt-3 space-y-1 text-xs text-stone-500">
                  <p>テーマ: {project.themeTitle || "未設定"}</p>
                  <p>関連投稿: {project.contentTitle || "未設定"}</p>
                  {project.outputUrl ? (
                    <a
                      href={project.outputUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block font-medium text-ink underline decoration-champagne underline-offset-4"
                    >
                      完成URLを開く
                    </a>
                  ) : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => selectImageProject(project)}
                    className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => removeImageProject(project.id)}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                  >
                    削除
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </Panel>

      <Panel title="コンテンツ一覧">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs text-stone-500">
                <th className="border-b border-stone-200 px-3 py-3">タイトル</th>
                <th className="border-b border-stone-200 px-3 py-3">テーマ</th>
                <th className="border-b border-stone-200 px-3 py-3">媒体</th>
                <th className="border-b border-stone-200 px-3 py-3">種別</th>
                <th className="border-b border-stone-200 px-3 py-3">ステータス</th>
                <th className="border-b border-stone-200 px-3 py-3">予定日</th>
                <th className="border-b border-stone-200 px-3 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {contentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-stone-500">
                    まだコンテンツがありません。
                  </td>
                </tr>
              ) : (
                contentItems.map((item) => {
                  const theme = themes.find((themeItem) => themeItem.id === item.themeId);

                  return (
                    <tr key={item.id} className="align-top">
                      <td className="border-b border-stone-100 px-3 py-3 font-medium text-ink">
                        {item.title}
                      </td>
                      <td className="border-b border-stone-100 px-3 py-3 text-stone-600">
                        {theme?.mainTheme ?? "未紐づけ"}
                      </td>
                      <td className="border-b border-stone-100 px-3 py-3">
                        {labelFor(platformOptions, item.platform)}
                      </td>
                      <td className="border-b border-stone-100 px-3 py-3">
                        {labelFor(contentTypeOptions, item.contentType)}
                      </td>
                      <td className="border-b border-stone-100 px-3 py-3">
                        <select
                          value={item.status}
                          onChange={(event) =>
                            changeContentStatus(item.id, event.target.value as ContentStatus)
                          }
                          className="rounded-md border border-stone-200 bg-white px-2 py-1"
                        >
                          {contentStatusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-stone-100 px-3 py-3">
                        {item.scheduledDate || "-"}
                      </td>
                      <td className="border-b border-stone-100 px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => selectContentItem(item)}
                            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => createImageProjectFromContent(item)}
                            disabled={isPending || creatingImageForContentId === item.id}
                            className="rounded-md border border-champagne/60 bg-rose px-3 py-2 text-xs font-medium text-ink disabled:opacity-60"
                          >
                            {creatingImageForContentId === item.id ? "作成中" : "画像案"}
                          </button>
                          <button
                            onClick={() => removeContentItem(item.id)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ContentEditorFields({
  form,
  livePlan,
  onChange,
  onChangeLivePlan
}: {
  form: ContentItemInput;
  livePlan: YouTubeLivePlan;
  onChange: (input: Partial<ContentItemInput>) => void;
  onChangeLivePlan: (input: YouTubeLivePlan) => void;
}) {
  if (form.contentType === "youtube_live_plan") {
    return <YouTubeLiveEditor plan={livePlan} onChange={onChangeLivePlan} />;
  }

  if (form.contentType === "instagram_caption") {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextAreaField
          label="キャプション本文"
          value={form.caption ?? ""}
          rows={8}
          onChange={(value) => onChange({ caption: value })}
        />
        <TextAreaField
          label="投稿メモ・補足"
          value={form.body ?? ""}
          rows={8}
          onChange={(value) => onChange({ body: value })}
        />
      </div>
    );
  }

  if (form.contentType === "instagram_reel_script") {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextAreaField
          label="リール台本"
          value={form.script ?? ""}
          rows={10}
          onChange={(value) => onChange({ script: value })}
        />
        <TextAreaField
          label="画面メモ・テロップ案"
          value={form.body ?? ""}
          rows={10}
          onChange={(value) => onChange({ body: value })}
        />
      </div>
    );
  }

  if (form.contentType === "youtube_script") {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextAreaField
          label="YouTube台本"
          value={form.script ?? ""}
          rows={12}
          onChange={(value) => onChange({ script: value })}
        />
        <TextAreaField
          label="概要欄・補足"
          value={form.body ?? ""}
          rows={12}
          onChange={(value) => onChange({ body: value })}
        />
      </div>
    );
  }

  if (form.contentType === "note_article") {
    return (
      <div className="mt-4">
        <TextAreaField
          label="note記事本文"
          value={form.article ?? ""}
          rows={14}
          onChange={(value) => onChange({ article: value })}
        />
      </div>
    );
  }

  if (form.contentType === "threads_post" || form.contentType === "x_post") {
    return (
      <div className="mt-4">
        <TextAreaField
          label={form.contentType === "threads_post" ? "Threads投稿案" : "X投稿案"}
          value={form.body ?? ""}
          rows={10}
          onChange={(value) => onChange({ body: value })}
        />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <TextAreaField
        label="本文・構成案"
        value={form.body ?? ""}
        rows={10}
        onChange={(value) => onChange({ body: value })}
      />
    </div>
  );
}

function YouTubeLiveEditor({
  plan,
  onChange
}: {
  plan: YouTubeLivePlan;
  onChange: (input: YouTubeLivePlan) => void;
}) {
  const update = (input: Partial<YouTubeLivePlan>) => onChange({ ...plan, ...input });
  const updateStringList = (key: keyof YouTubeLivePlan, value: string) =>
    update({ [key]: linesToArray(value) } as Partial<YouTubeLivePlan>);
  const updateSection = (index: number, input: Partial<YouTubeLiveSection>) => {
    const sections = plan.sections.map((section, sectionIndex) =>
      sectionIndex === index ? { ...section, ...input } : section
    );
    onChange({ ...plan, sections });
  };
  const addSection = () => {
    onChange({
      ...plan,
      sections: [
        ...plan.sections,
        {
          title: "新しいセクション",
          estimatedMinutes: 10,
          talkingPoints: [],
          script: ""
        }
      ]
    });
  };
  const removeSection = (index: number) => {
    if (plan.sections.length <= 1) {
      return;
    }

    onChange({
      ...plan,
      sections: plan.sections.filter((_, sectionIndex) => sectionIndex !== index)
    });
  };

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
        <h3 className="text-base font-semibold text-ink">YouTubeライブ企画</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <TextField
            label="ライブタイトル"
            value={plan.title}
            onChange={(value) => update({ title: value })}
          />
          <TextField
            label="サムネ文言"
            value={plan.thumbnailText}
            onChange={(value) => update({ thumbnailText: value })}
          />
          <SelectField
            label="配信タイプ"
            value={plan.liveStreamType}
            options={liveStreamTypeOptions}
            onChange={(value) => update({ liveStreamType: value as LiveStreamType })}
          />
          <TextField
            label="テーマ"
            value={plan.theme}
            onChange={(value) => update({ theme: value })}
          />
          <TextField
            label="目的"
            value={plan.purpose}
            onChange={(value) => update({ purpose: value })}
          />
          <TextField
            label="ターゲット"
            value={plan.targetAudience}
            onChange={(value) => update({ targetAudience: value })}
          />
          <TextField
            label="配信予定日"
            type="date"
            value={plan.scheduledDate ?? ""}
            onChange={(value) => update({ scheduledDate: value })}
          />
          <TextField
            label="開始時間"
            type="time"
            value={plan.startTime ?? ""}
            onChange={(value) => update({ startTime: value })}
          />
          <TextField
            label="予定時間（分）"
            type="number"
            value={plan.estimatedDurationMinutes.toString()}
            onChange={(value) => update({ estimatedDurationMinutes: Number(value) || 0 })}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
          <h3 className="text-base font-semibold text-ink">冒頭</h3>
          <div className="mt-3 space-y-3">
            <TextAreaField
              label="あいさつ"
              value={plan.openingGreeting}
              rows={4}
              onChange={(value) => update({ openingGreeting: value })}
            />
            <TextAreaField
              label="冒頭フック"
              value={plan.openingHook}
              rows={4}
              onChange={(value) => update({ openingHook: value })}
            />
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
          <h3 className="text-base font-semibold text-ink">全体構成</h3>
          <div className="mt-3">
            <TextAreaField
              label="アウトライン（1行に1つ）"
              value={arrayToLines(plan.outline)}
              rows={9}
              onChange={(value) => updateStringList("outline", value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h3 className="text-base font-semibold text-ink">本編セクション</h3>
          <button
            type="button"
            onClick={addSection}
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
          >
            セクション追加
          </button>
        </div>
        <div className="mt-3 space-y-4">
          {plan.sections.map((section, index) => (
            <div key={`${section.title}-${index}`} className="rounded-md border border-stone-100 bg-white/80 p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_140px_auto] md:items-end">
                <TextField
                  label={`セクション${index + 1} タイトル`}
                  value={section.title}
                  onChange={(value) => updateSection(index, { title: value })}
                />
                <TextField
                  label="目安分数"
                  type="number"
                  value={section.estimatedMinutes.toString()}
                  onChange={(value) => updateSection(index, { estimatedMinutes: Number(value) || 0 })}
                />
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-50"
                  disabled={plan.sections.length <= 1}
                >
                  削除
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextAreaField
                  label="話すポイント（1行に1つ）"
                  value={arrayToLines(section.talkingPoints)}
                  rows={5}
                  onChange={(value) => updateSection(index, { talkingPoints: linesToArray(value) })}
                />
                <TextAreaField
                  label="台本"
                  value={section.script}
                  rows={5}
                  onChange={(value) => updateSection(index, { script: value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextAreaGroup
          title="視聴者とのやりとり"
          fields={[
            {
              label: "チャット話題（1行に1つ）",
              value: arrayToLines(plan.chatTopics),
              onChange: (value) => updateStringList("chatTopics", value)
            },
            {
              label: "拾いたいコメント（1行に1つ）",
              value: arrayToLines(plan.commentPickupPoints),
              onChange: (value) => updateStringList("commentPickupPoints", value)
            },
            {
              label: "視聴者への質問（1行に1つ）",
              value: arrayToLines(plan.questionsForViewers),
              onChange: (value) => updateStringList("questionsForViewers", value)
            },
            {
              label: "参加型アイデア（1行に1つ）",
              value: arrayToLines(plan.interactiveIdeas),
              onChange: (value) => updateStringList("interactiveIdeas", value)
            }
          ]}
        />

        <TextAreaGroup
          title="締めと二次活用"
          fields={[
            {
              label: "告知",
              value: plan.announcement,
              onChange: (value) => update({ announcement: value })
            },
            {
              label: "CTA",
              value: plan.cta,
              onChange: (value) => update({ cta: value })
            },
            {
              label: "締めの台本",
              value: plan.endingScript,
              onChange: (value) => update({ endingScript: value })
            },
            {
              label: "切り抜き案（1行に1つ）",
              value: arrayToLines(plan.clipIdeas),
              onChange: (value) => updateStringList("clipIdeas", value)
            },
            {
              label: "再利用案（1行に1つ）",
              value: arrayToLines(plan.repurposeIdeas),
              onChange: (value) => updateStringList("repurposeIdeas", value)
            }
          ]}
        />
      </div>
    </div>
  );
}

function TextAreaGroup({
  title,
  fields
}: {
  title: string;
  fields: { label: string; value: string; onChange: (value: string) => void }[];
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="mt-3 space-y-3">
        {fields.map((field) => (
          <TextAreaField
            key={field.label}
            label={field.label}
            value={field.value}
            rows={4}
            onChange={field.onChange}
          />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-28 rounded-lg border border-white/70 bg-white/68 p-4 backdrop-blur">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-2 line-clamp-3 text-xl font-semibold leading-7 text-ink">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/70 bg-white/68 p-5 shadow-soft backdrop-blur">
      <h2 className="text-lg font-semibold tracking-normal text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniList({
  title,
  items,
  emptyText
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <ul className="mt-2 space-y-2 text-sm text-stone-600">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-md bg-white/70 px-3 py-2">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-md bg-white/70 px-3 py-2">{emptyText}</li>
        )}
      </ul>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-stone-200 bg-white/85 px-3 py-2 outline-none transition focus:border-champagne"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-2 w-full resize-y rounded-md border border-stone-200 bg-white/85 px-3 py-2 leading-6 outline-none transition focus:border-champagne"
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-stone-200 bg-white/85 px-3 py-2 outline-none transition focus:border-champagne"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectSimpleField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[] | string[];
  onChange: (value: string) => void;
}) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-stone-200 bg-white/85 px-3 py-2 outline-none transition focus:border-champagne"
      >
        {normalizedOptions.length === 0 ? <option value="">先にテーマを作成してください</option> : null}
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
