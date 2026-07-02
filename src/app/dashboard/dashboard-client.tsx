"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createSampleDataAction,
  deleteContentItemAction,
  deleteThemeAction,
  generateContentSetAction,
  saveContentItemAction,
  saveThemeAction,
  updateContentItemAction,
  updateContentStatusAction,
  updateThemeAction
} from "./actions";
import {
  contentStatusOptions,
  contentTypeOptions,
  labelFor,
  platformOptions,
  purposeOptions,
  themeStatusOptions,
  type ContentItem,
  type ContentItemInput,
  type ContentStatus,
  type ContentType,
  type Platform,
  type Theme,
  type ThemeInput,
  type ThemeStatus
} from "@/types/content";

type DashboardClientProps = {
  initialThemes: Theme[];
  initialContentItems: ContentItem[];
  initialError?: string;
  userEmail?: string | null;
};

type BackupData = {
  themes: Theme[];
  contentItems: ContentItem[];
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
  initialError,
  userEmail
}: DashboardClientProps) {
  const shouldUseBackup = initialThemes.length === 0 && initialContentItems.length === 0;
  const backup = shouldUseBackup ? readBackup() : undefined;
  const [themes, setThemes] = useState(backup?.themes ?? initialThemes);
  const [contentItems, setContentItems] = useState(backup?.contentItems ?? initialContentItems);
  const [themeForm, setThemeForm] = useState<ThemeInput>(emptyThemeForm);
  const [contentForm, setContentForm] = useState<ContentItemInput>(emptyContentForm);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
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

    localStorage.setItem(backupKey, JSON.stringify({ themes, contentItems }));
  }, [contentItems, themes]);

  const currentWeekTheme = themes.find((theme) => theme.status === "active") ?? themes[0];

  const summary = useMemo(() => {
    const countByStatus = (status: ContentStatus) =>
      contentItems.filter((item) => item.status === status).length;

    return {
      drafting: countByStatus("drafting") + countByStatus("generated"),
      review: countByStatus("review"),
      scheduled: countByStatus("scheduled"),
      published: countByStatus("published"),
      analysisWaiting: countByStatus("published"),
      liveSchedules: contentItems.filter((item) => item.platform === "youtube_live").slice(0, 3),
      upcoming: contentItems
        .filter((item) => item.scheduledDate)
        .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""))
        .slice(0, 5)
    };
  }, [contentItems]);

  const platformCounts = useMemo(() => {
    return platformOptions.map((platform) => ({
      ...platform,
      count: contentItems.filter((item) => item.platform === platform.value).length
    }));
  }, [contentItems]);

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
          <p className="text-sm font-medium text-champagne">Phase 2</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            Yuzuki Content Studio
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            テーマから各媒体のコンテンツ案を一括生成し、Notionに保存できるMVPです。
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
        <MetricCard label="投稿済み" value={summary.published.toString()} />
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
            onChange={(value) => setContentForm((form) => ({ ...form, title: value }))}
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
            onChange={(value) => setContentForm((form) => ({ ...form, scheduledDate: value }))}
          />
          <TextAreaField
            label="本文"
            value={contentForm.body ?? ""}
            onChange={(value) => setContentForm((form) => ({ ...form, body: value }))}
          />
          <TextAreaField
            label="キャプション"
            value={contentForm.caption ?? ""}
            onChange={(value) => setContentForm((form) => ({ ...form, caption: value }))}
          />
          <TextAreaField
            label="台本"
            value={contentForm.script ?? ""}
            onChange={(value) => setContentForm((form) => ({ ...form, script: value }))}
          />
          <TextAreaField
            label="記事"
            value={contentForm.article ?? ""}
            onChange={(value) => setContentForm((form) => ({ ...form, article: value }))}
          />
          <TextField
            label="ハッシュタグ"
            value={tagsToText(contentForm.hashtags)}
            placeholder="AI副業, 初心者, 発信"
            onChange={(value) =>
              setContentForm((form) => ({ ...form, hashtags: normalizeTags(value) }))
            }
          />
          <TextField
            label="CTA"
            value={contentForm.cta ?? ""}
            onChange={(value) => setContentForm((form) => ({ ...form, cta: value }))}
          />
          <div className="md:col-span-3">
            <TextAreaField
              label="メモ"
              value={contentForm.memo ?? ""}
              onChange={(value) => setContentForm((form) => ({ ...form, memo: value }))}
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
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
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
