"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { ChangeEvent, KeyboardEvent, PointerEvent } from "react";
import {
  createSampleDataAction,
  deleteAnalysisAction,
  deleteContentItemAction,
  deleteImageProjectAction,
  deleteThemeAction,
  generateContentSetAction,
  createImageProjectFromContentAction,
  saveAnalysisAction,
  saveContentItemAction,
  saveImageProjectAction,
  saveThemeAction,
  updateAnalysisAction,
  updateContentItemAction,
  updateImageProjectAction,
  updateContentStatusAction,
  updateThemeAction
} from "./actions";
import {
  contentStatusOptions,
  contentTypeOptions,
  colorThemeOptions,
  ctaTemplates,
  imageProjectStatusOptions,
  imageProjectTypeOptions,
  imagePlatformOptions,
  labelFor,
  liveStreamTypeOptions,
  outputPresets,
  platformOptions,
  purposeOptions,
  slideTemplateOptions,
  themeStatusOptions,
  type ContentItem,
  type ContentItemInput,
  type ContentStatus,
  type ContentType,
  type Analysis,
  type AnalysisInput,
  type ImageProject,
  type ImagePlatform,
  type ImageProjectInput,
  type ImageProjectStatus,
  type ImageProjectType,
  type LiveStreamType,
  type Platform,
  type Theme,
  type ThemeInput,
  type ThemeOption,
  type ThemeOptionCategory,
  type ThemeOptionGroups,
  type ThemeOptionSelection,
  type ThemeStatus,
  type Slide,
  type SlideElement,
  type SlideTemplateType,
  type YouTubeLivePlan,
  type YouTubeLiveSection
} from "@/types/content";

type DashboardClientProps = {
  initialThemes: Theme[];
  initialContentItems: ContentItem[];
  initialImageProjects: ImageProject[];
  initialAnalysisItems: Analysis[];
  initialThemeOptions?: ThemeOptionGroups;
  initialError?: string;
  userEmail?: string | null;
};

type BackupData = {
  themes: Theme[];
  contentItems: ContentItem[];
  imageProjects?: ImageProject[];
  analysisItems?: Analysis[];
};

type DashboardSection =
  | "guide"
  | "overview"
  | "themes"
  | "content"
  | "images"
  | "lives"
  | "calendar"
  | "analysis"
  | "data"
  | "status";

type CalendarDay = {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  items: ContentItem[];
};

const backupKey = "yuzuki-content-studio-phase1";
const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
const editorPreviewScale = 0.34;
const safeAreaMargin = 80;

const navItems: { value: DashboardSection; label: string; description: string }[] = [
  { value: "guide", label: "使い方", description: "最初に見る" },
  { value: "overview", label: "ダッシュボード", description: "全体状況" },
  { value: "themes", label: "テーマ管理", description: "週テーマ" },
  { value: "content", label: "投稿作成", description: "本文・台本" },
  { value: "images", label: "画像エディタ", description: "カルーセル" },
  { value: "lives", label: "ライブ配信", description: "週2本管理" },
  { value: "calendar", label: "カレンダー", description: "投稿予定" },
  { value: "analysis", label: "分析管理", description: "投稿後の数値" },
  { value: "data", label: "データ管理", description: "JSON保存" },
  { value: "status", label: "投稿管理", description: "一覧・状態" }
];

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

const themeOptionCategories: ThemeOptionCategory[] = [
  "Target Audience",
  "Pain Point",
  "Desired Outcome",
  "CTA",
  "Offer",
  "Angle"
];

const themeOptionFieldConfigs = [
  {
    label: "ターゲット",
    category: "Target Audience",
    textKey: "targetAudience",
    optionIdKey: "targetOptionId",
    optionKey: "targetOption"
  },
  {
    label: "読者の悩み",
    category: "Pain Point",
    textKey: "painPoint",
    optionIdKey: "painOptionId",
    optionKey: "painOption"
  },
  {
    label: "理想状態",
    category: "Desired Outcome",
    textKey: "desiredOutcome",
    optionIdKey: "desiredOutcomeOptionId",
    optionKey: "desiredOutcomeOption"
  },
  {
    label: "CTA",
    category: "CTA",
    textKey: "cta",
    optionIdKey: "ctaOptionId",
    optionKey: "ctaOption"
  },
  {
    label: "商品導線",
    category: "Offer",
    textKey: "offer",
    optionIdKey: "offerOptionId",
    optionKey: "offerOption"
  },
  {
    label: "訴求角度",
    category: "Angle",
    textKey: "angle",
    optionIdKey: "angleOptionId",
    optionKey: "angleOption"
  }
] as const;

type ThemeOptionFieldConfig = (typeof themeOptionFieldConfigs)[number];

function createEmptyThemeOptionGroups(): ThemeOptionGroups {
  return themeOptionCategories.reduce((groups, category) => {
    groups[category] = [];
    return groups;
  }, {} as ThemeOptionGroups);
}

function findThemeOption(
  groups: ThemeOptionGroups,
  category: ThemeOptionCategory,
  optionId?: string
) {
  if (!optionId) {
    return undefined;
  }

  return groups[category].find((option) => option.id === optionId);
}

function toThemeOptionSelection(
  option: ThemeOption | undefined,
  customText?: string
): ThemeOptionSelection | undefined {
  if (!option && !customText?.trim()) {
    return undefined;
  }

  return {
    optionId: option?.id,
    optionName: option?.name,
    description: option?.description,
    promptSnippet: option?.promptSnippet,
    useCase: option?.useCase,
    customText: customText?.trim()
  };
}

function applyThemeOptionSelections(input: ThemeInput, groups: ThemeOptionGroups): ThemeInput {
  const next = { ...input };

  for (const config of themeOptionFieldConfigs) {
    const optionId = String(next[config.optionIdKey] ?? "");
    const option = findThemeOption(groups, config.category, optionId);
    const customText = String(next[config.textKey] ?? "").trim();
    const textValue = customText || option?.name || "";

    next[config.textKey] = textValue;
    next[config.optionIdKey] = option?.id ?? optionId;
    next[config.optionKey] = toThemeOptionSelection(option, textValue);
  }

  return next;
}

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
  imagePlatform: "instagram_carousel",
  outputPreset: outputPresets[0],
  slides: [],
  colorTheme: "korean_pink",
  memo: ""
};

const emptyAnalysisForm: AnalysisInput = {
  contentItemId: "",
  contentTitle: "",
  platform: "instagram",
  impressions: 0,
  reach: 0,
  views: 0,
  averageViewDuration: 0,
  livePeakViewers: 0,
  liveChatCount: 0,
  likes: 0,
  comments: 0,
  saves: 0,
  shares: 0,
  follows: 0,
  profileAccess: 0,
  linkClicks: 0,
  lineRegistrations: 0,
  conversions: 0,
  saveRate: 0,
  engagementRate: 0,
  followConversionRate: 0,
  lineRegistrationRate: 0,
  goodPoint: "",
  improvementPoint: "",
  nextAction: "",
  analyzedAt: new Date().toISOString().slice(0, 10)
};

function localId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonthInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function parseMonthInput(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  return new Date(year, (monthIndex || 1) - 1, 1);
}

function addMonths(month: string, amount: number) {
  const date = parseMonthInput(month);
  date.setMonth(date.getMonth() + amount);

  return formatMonthInput(date);
}

function addDaysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return formatDateInput(date);
}

function scheduledDateKey(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function buildCalendarDays(month: string, items: ContentItem[]): CalendarDay[] {
  const firstDay = parseMonthInput(month);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    const dateKey = formatDateInput(date);

    return {
      date: dateKey,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === firstDay.getMonth(),
      items: items.filter((item) => scheduledDateKey(item.scheduledDate) === dateKey)
    };
  });
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

  if (imageType === "instagram_carousel_design") {
    return "4:5 / 1080x1350";
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

function imagePlatformForType(imageType: ImageProjectType): ImagePlatform {
  if (imageType === "x_image") {
    return "x_images";
  }

  if (imageType === "threads_image") {
    return "threads_images";
  }

  return "instagram_carousel";
}

function presetForPlatform(platform: ImagePlatform) {
  return outputPresets.find((preset) => preset.platform === platform) ?? outputPresets[0];
}

function getColorTheme(value?: string) {
  return colorThemeOptions.find((theme) => theme.value === value) ?? colorThemeOptions[0];
}

function createTextElement(
  name: string,
  content: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  zIndex: number,
  type: SlideElement["type"] = "text"
): SlideElement {
  return {
    id: localId("element"),
    type,
    name,
    visible: true,
    content,
    x,
    y,
    width,
    height: Math.round(fontSize * 2.2),
    fontSize,
    lineHeight: 1.35,
    fontWeight: type === "cta" ? "bold" : name === "タイトル" ? "bold" : "normal",
    textAlign: "center",
    color: "#2f2a2a",
    backgroundColor: type === "cta" ? "#f4c9d4" : "transparent",
    borderRadius: type === "cta" ? 28 : 0,
    zIndex
  };
}

function createShapeElement(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundColor: string,
  borderRadius: number,
  zIndex: number
): SlideElement {
  return {
    id: localId("element"),
    type: "shape",
    name,
    visible: true,
    x,
    y,
    width,
    height,
    backgroundColor,
    borderRadius,
    zIndex
  };
}

type CarouselSourceSlide = {
  type?: string;
  templateType?: SlideTemplateType;
  label?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  point?: string;
  note?: string;
  cta?: string;
  items?: string[];
};

type CarouselSource = {
  brand?: string;
  theme?: string;
  title?: string;
  slides?: CarouselSourceSlide[];
};

function parseCarouselSource(contentItem?: ContentItem, theme?: Theme): CarouselSource | undefined {
  if (!contentItem || contentItem.contentType !== "instagram_carousel") {
    return undefined;
  }

  if (!contentItem.body?.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(contentItem.body) as CarouselSource;

    if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
      return {
        ...parsed,
        brand: parsed.brand || "Yuzuki｜心響学×AIフリーランス",
        theme: parsed.theme || theme?.mainTheme || parsed.title || contentItem.title
      };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function templateForCarouselSlide(source: CarouselSourceSlide, index: number, total: number): SlideTemplateType {
  if (index === 0) {
    return "cover";
  }

  if (index === total - 1) {
    return "thanks";
  }

  const requested = source.templateType ?? (source.type as SlideTemplateType | undefined);

  if (requested && slideTemplateOptions.some((option) => option.value === requested)) {
    return requested;
  }

  const pattern: SlideTemplateType[] = ["text", "roadmap", "tips", "mistake", "summary"];
  return pattern[Math.min(index - 1, pattern.length - 1)] ?? "text";
}

function buildPinkCarouselSlide({
  source,
  index,
  total,
  brand,
  themeTitle
}: {
  source: CarouselSourceSlide;
  index: number;
  total: number;
  brand: string;
  themeTitle: string;
}): Slide {
  const templateType = templateForCarouselSlide(source, index, total);
  const label = source.label || String(index + 1).padStart(2, "0");
  const title = source.title || themeTitle;
  const body = source.body || source.note || "";
  const point = source.point || source.cta || source.note || "";
  const elements: SlideElement[] = [
    createTextElement("ブランド", brand, 92, 78, 620, 28, 3),
    createTextElement("ページ番号", `${label} / ${String(total).padStart(2, "0")}`, 820, 78, 170, 26, 3),
    createTextElement("NEXT", index === total - 1 ? "SAVE" : "NEXT →", 790, 1230, 190, 30, 3),
    createTextElement("フッター", "♡ いいね・コメント・シェア嬉しいです！", 96, 1248, 560, 26, 3)
  ];

  if (templateType === "cover") {
    elements.push(
      createShapeElement("見出しカード", 90, 210, 900, 520, "rgba(255,255,255,0.82)", 42, 1),
      createTextElement("ラベル", source.label || "月5万！", 175, 260, 240, 40, 3),
      createTextElement("タイトル", title, 160, 360, 760, 76, 4),
      createTextElement("サブタイトル", source.subtitle || body || "3ヶ月で初案件まで", 205, 620, 670, 38, 4),
      createShapeElement("ポイントカード", 145, 805, 790, 220, "rgba(255,255,255,0.76)", 34, 1),
      createTextElement("ポイント", point || "初心者でも小さく始められるAI副業ロードマップ", 190, 875, 700, 34, 4),
      createTextElement("装飾ハート", "♡", 850, 245, 70, 64, 5)
    );
  } else if (templateType === "roadmap") {
    elements.push(createTextElement("タイトル", title, 120, 190, 840, 58, 4));
    ["1ヶ月目", "2ヶ月目", "3ヶ月目"].forEach((month, monthIndex) => {
      const y = 360 + monthIndex * 220;
      const monthBody = (
        source.items?.[monthIndex] ||
        body ||
        point ||
        "やることを小さく分けて進める"
      ).replace(/^[-・\s]+/, "");

      elements.push(
        createShapeElement(`${month}カード`, 115, y, 850, 165, "rgba(255,255,255,0.82)", 30, 1),
        createTextElement(month, month, 160, y + 55, 180, 34, 4),
        createTextElement(`${month}本文`, monthBody, 360, y + 45, 520, 30, 4)
      );
    });
    elements.push(createTextElement("ポイント", point || "月ごとに分けると迷わず進めます", 165, 1070, 750, 34, 4));
  } else if (templateType === "tips") {
    const items = source.items && source.items.length > 0 ? source.items : body.split(/[。\n]/).filter(Boolean).slice(0, 4);
    elements.push(createTextElement("タイトル", title, 120, 180, 840, 56, 4));
    items.slice(0, 4).forEach((item, itemIndex) => {
      const y = 335 + itemIndex * 165;
      elements.push(
        createShapeElement(`チェック${itemIndex + 1}`, 125, y, 830, 115, "rgba(255,255,255,0.82)", 28, 1),
        createTextElement(`チェック記号${itemIndex + 1}`, "✓", 165, y + 53, 70, 40, 4),
        createTextElement(`チェック本文${itemIndex + 1}`, item.trim(), 250, y + 43, 620, 30, 4)
      );
    });
    elements.push(createTextElement("ポイント", point || "できたところからチェックして進めよう", 155, 1090, 780, 34, 4));
  } else if (templateType === "mistake") {
    elements.push(
      createTextElement("タイトル", title, 120, 180, 840, 56, 4),
      createShapeElement("NGカード", 120, 360, 840, 250, "rgba(255,255,255,0.82)", 34, 1),
      createTextElement("NG", "× NG", 170, 430, 180, 44, 4),
      createTextElement("NG本文", body || "完璧に準備してから始めようとして止まる", 330, 425, 520, 34, 4),
      createShapeElement("OKカード", 120, 690, 840, 250, "rgba(255,255,255,0.82)", 34, 1),
      createTextElement("OK", "✓ OK", 170, 760, 180, 44, 4),
      createTextElement("OK本文", point || "小さく試して反応を見ながら改善する", 330, 755, 520, 34, 4)
    );
  } else if (templateType === "thanks") {
    elements.push(
      createTextElement("Thank you", "Thank you", 185, 185, 710, 90, 4),
      createTextElement("サブコピー", "最後まで読んでくれてありがとう♡", 195, 330, 690, 34, 4),
      createShapeElement("プロフィールカード", 145, 500, 790, 390, "rgba(255,255,255,0.82)", 42, 1),
      createTextElement("プロフィール名", "Yuzuki", 230, 585, 620, 48, 4),
      createTextElement("プロフィール本文", body || point || "ゆるふわな理想を、AIと心理学でロジックに変える。", 230, 680, 620, 34, 4),
      createTextElement("フォロー", "← FOLLOW", 335, 1010, 410, 46, 4)
    );
  } else {
    elements.push(
      createTextElement("タイトル", title, 110, 185, 860, 58, 4),
      createShapeElement("本文カード", 105, 390, 870, 460, "rgba(255,255,255,0.84)", 36, 1),
      createTextElement("本文", body || "ここに本文が入ります。読者の悩みと解決策を、読みやすく短くまとめます。", 165, 475, 750, 36, 4),
      createShapeElement("マーカー", 145, 915, 790, 155, "rgba(255,225,239,0.86)", 32, 1),
      createTextElement("ポイント", point || "今日できる一手をひとつ決めよう", 185, 980, 700, 32, 4)
    );
  }

  return {
    id: localId("slide"),
    templateType,
    title,
    backgroundColor: "#fff7fb",
    colorTheme: "yuzuki_pink_grid",
    elements: elements.map((element) => ({
      ...element,
      color:
        element.name === "タイトル" || element.name === "Thank you" || element.name === "フォロー"
          ? "#ff5faf"
          : element.name.includes("NG")
            ? "#d65a6f"
            : element.name.includes("OK") || element.name.includes("チェック記号")
              ? "#62a681"
              : "#8b5f6d",
      fontWeight:
        element.name === "本文" || element.name.includes("本文") || element.name === "フッター"
          ? "normal"
          : "bold",
      lineHeight: element.lineHeight ?? 1.5
    }))
  };
}

function createPinkCarouselSlides(contentItem?: ContentItem, theme?: Theme): Slide[] | undefined {
  const source = parseCarouselSource(contentItem, theme);

  if (!source?.slides?.length) {
    return undefined;
  }

  const slides = source.slides.slice(0, 10);
  const total = slides.length;

  return slides.map((slide, index) =>
    buildPinkCarouselSlide({
      source: slide,
      index,
      total,
      brand: source.brand || "Yuzuki｜心響学×AIフリーランス",
      themeTitle: source.theme || contentItem?.title || "Instagramカルーセル"
    })
  );
}

function createDefaultSlides({
  title,
  body,
  cta,
  platform,
  colorTheme
}: {
  title: string;
  body?: string;
  cta?: string;
  platform: ImagePlatform;
  colorTheme: string;
}): Slide[] {
  const preset = presetForPlatform(platform);
  const theme = getColorTheme(colorTheme);
  const isInstagram = platform === "instagram_carousel";
  const templates = isInstagram
    ? slideTemplateOptions
    : slideTemplateOptions.filter((template) =>
        ["cover", "summary", "example", "cta"].includes(template.value)
      );
  const maxSlides = Math.min(preset.maxSlides, templates.length);

  return templates.slice(0, maxSlides).map((template, index) => {
    const label = String(index + 1).padStart(2, "0");
    const slideTitle = index === 0 ? title : template.label;

    return {
      id: localId("slide"),
      templateType: template.value,
      title: slideTitle,
      backgroundColor: theme.backgroundColor,
      colorTheme,
      elements: [
        createTextElement("ラベル", label, 90, 88, 180, 34, 1),
        createTextElement("タイトル", slideTitle, 140, 255, preset.width - 280, 64, 2),
        createTextElement(
          "本文",
          body || "ここに本文を入れます。読者の悩み、解決策、具体例を短くまとめます。",
          170,
          430,
          preset.width - 340,
          34,
          3
        ),
        createTextElement("CTA", cta || "保存してあとで見返す", 240, preset.height - 210, preset.width - 480, 34, 4, "cta")
      ].map((element) => ({
        ...element,
        color: element.type === "cta" ? theme.textColor : theme.textColor,
        backgroundColor: element.type === "cta" ? theme.ctaColor : element.backgroundColor
      }))
    };
  });
}

function ensureImageProjectEditor(input: ImageProjectInput): ImageProjectInput {
  const imagePlatform = input.imagePlatform ?? imagePlatformForType(input.imageType);
  const outputPreset = input.outputPreset ?? presetForPlatform(imagePlatform);
  const colorTheme = input.colorTheme ?? "korean_pink";

  return {
    ...input,
    imagePlatform,
    outputPreset,
    colorTheme,
    slides:
      input.slides && input.slides.length > 0
        ? input.slides
        : createDefaultSlides({
            title: input.title || input.contentTitle || "画像プロジェクト",
            body: input.prompt,
            cta: "",
            platform: imagePlatform,
            colorTheme
          })
  };
}

function applyColorThemeToSlides(slides: Slide[], colorTheme: string) {
  const theme = getColorTheme(colorTheme);

  return slides.map((slide) => ({
    ...slide,
    colorTheme,
    backgroundColor: theme.backgroundColor,
    elements: slide.elements.map((element) => ({
      ...element,
      color: element.type === "shape" ? element.color : theme.textColor,
      backgroundColor: element.type === "cta" ? theme.ctaColor : element.backgroundColor
    }))
  }));
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(value: string, maxChars: number) {
  const lines = value.split("\n").flatMap((line) => {
    if (line.length <= maxChars) {
      return [line];
    }

    const chunks: string[] = [];
    for (let index = 0; index < line.length; index += maxChars) {
      chunks.push(line.slice(index, index + maxChars));
    }
    return chunks;
  });

  return lines.length > 0 ? lines : [""];
}

function slideToSvg(slide: Slide, preset = outputPresets[0]) {
  const sortedElements = [...slide.elements]
    .filter((element) => element.visible)
    .sort((a, b) => a.zIndex - b.zIndex);
  const isPinkCarousel = slide.colorTheme === "yuzuki_pink_grid";
  const backgroundSvg = isPinkCarousel
    ? `<defs><pattern id="pink-grid" width="155" height="155" patternUnits="userSpaceOnUse"><path d="M 155 0 L 0 0 0 155" fill="none" stroke="#ffc2dc" stroke-width="2"/></pattern></defs><rect width="100%" height="100%" fill="#fff7fb" /><rect width="100%" height="100%" fill="url(#pink-grid)" opacity="0.82" /><circle cx="905" cy="190" r="58" fill="none" stroke="#ffb5d5" stroke-width="5" opacity="0.65"/><path d="M154 1116 C184 1078 231 1084 244 1126 C259 1084 313 1078 338 1118 C361 1156 320 1204 244 1244 C171 1204 128 1154 154 1116Z" fill="#ffe1ef" opacity="0.58"/><path d="M838 1142 C920 1128 954 1160 982 1210" fill="none" stroke="#ff8fbd" stroke-width="8" stroke-linecap="round" opacity="0.68"/>`
    : `<rect width="100%" height="100%" fill="${slide.backgroundColor}" />`;
  const elementSvg = sortedElements
    .map((element) => {
      if (element.type === "shape") {
        return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height ?? 80}" rx="${element.borderRadius ?? 0}" fill="${element.backgroundColor ?? "#ffffff"}" />`;
      }

      const fontSize = element.fontSize ?? 32;
      const lineHeight = element.lineHeight ?? 1.35;
      const lines = wrapText(element.content ?? "", Math.max(8, Math.floor(element.width / (fontSize * 0.62))));
      const textAnchor =
        element.textAlign === "left" ? "start" : element.textAlign === "right" ? "end" : "middle";
      const textX =
        element.textAlign === "left"
          ? element.x
          : element.textAlign === "right"
            ? element.x + element.width
            : element.x + element.width / 2;
      const rect =
        element.type === "cta"
          ? `<rect x="${element.x - 24}" y="${element.y - 28}" width="${element.width + 48}" height="${(element.height ?? fontSize * 2) + 40}" rx="${element.borderRadius ?? 28}" fill="${element.backgroundColor ?? "#f4c9d4"}" />`
          : "";
      const tspans = lines
        .map(
          (line, index) =>
            `<tspan x="${textX}" dy="${index === 0 ? 0 : fontSize * lineHeight}">${escapeSvgText(line)}</tspan>`
        )
        .join("");

      return `${rect}<text x="${textX}" y="${element.y}" fill="${element.color ?? "#2f2a2a"}" font-size="${fontSize}" font-weight="${element.fontWeight ?? "normal"}" text-anchor="${textAnchor}" font-family="Arial, sans-serif">${tspans}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${preset.width}" height="${preset.height}" viewBox="0 0 ${preset.width} ${preset.height}">${backgroundSvg}${elementSvg}</svg>`;
}

function downloadSlideAsPng(slide: Slide, preset = outputPresets[0]) {
  const svg = slideToSvg(slide, preset);
  const image = new Image();
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(svgUrl);
    const link = document.createElement("a");
    link.download = `${slide.title || "slide"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  image.src = svgUrl;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function downloadSlidesAsPng(slides: Slide[], preset = outputPresets[0]) {
  for (const slide of slides) {
    downloadSlideAsPng(slide, preset);
    await sleep(250);
  }
}

function contentItemToInput(item: ContentItem): ContentItemInput {
  return {
    userId: item.userId,
    themeId: item.themeId,
    themeNotionPageId: item.themeNotionPageId,
    platform: item.platform,
    contentType: item.contentType,
    title: item.title,
    status: item.status,
    scheduledDate: item.scheduledDate ?? "",
    publishedDate: item.publishedDate ?? "",
    cta: item.cta ?? "",
    body: item.body ?? "",
    caption: item.caption ?? "",
    script: item.script ?? "",
    article: item.article ?? "",
    hashtags: item.hashtags ?? [],
    imageProjectId: item.imageProjectId ?? "",
    memo: item.memo ?? ""
  };
}

function parseLivePlanFromItem(item: ContentItem, theme?: Theme) {
  return parseLivePlan(contentItemToInput(item), theme);
}

function rate(part?: number, total?: number) {
  if (!part || !total) {
    return 0;
  }

  return Math.round((part / total) * 10000) / 100;
}

function withCalculatedAnalysis(input: AnalysisInput): AnalysisInput {
  const reach = input.reach || input.views || input.impressions || 0;
  const engagement =
    (input.likes ?? 0) + (input.comments ?? 0) + (input.saves ?? 0) + (input.shares ?? 0);

  return {
    ...input,
    saveRate: rate(input.saves, reach),
    engagementRate: rate(engagement, reach),
    followConversionRate: rate(input.follows, reach),
    lineRegistrationRate: rate(input.lineRegistrations, reach)
  };
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
  initialAnalysisItems,
  initialThemeOptions,
  initialError,
  userEmail
}: DashboardClientProps) {
  const shouldUseBackup =
    initialThemes.length === 0 &&
    initialContentItems.length === 0 &&
    initialImageProjects.length === 0 &&
    initialAnalysisItems.length === 0;
  const backup = shouldUseBackup ? readBackup() : undefined;
  const [themes, setThemes] = useState(backup?.themes ?? initialThemes);
  const [contentItems, setContentItems] = useState(backup?.contentItems ?? initialContentItems);
  const [imageProjects, setImageProjects] = useState(
    backup?.imageProjects ?? initialImageProjects
  );
  const [analysisItems, setAnalysisItems] = useState(
    backup?.analysisItems ?? initialAnalysisItems
  );
  const [themeOptions] = useState<ThemeOptionGroups>(
    initialThemeOptions ?? createEmptyThemeOptionGroups()
  );
  const [themeForm, setThemeForm] = useState<ThemeInput>(emptyThemeForm);
  const [contentForm, setContentForm] = useState<ContentItemInput>(emptyContentForm);
  const [imageProjectForm, setImageProjectForm] =
    useState<ImageProjectInput>(emptyImageProjectForm);
  const [analysisForm, setAnalysisForm] = useState<AnalysisInput>(emptyAnalysisForm);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingImageProjectId, setEditingImageProjectId] = useState<string | null>(null);
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [creatingImageForContentId, setCreatingImageForContentId] = useState<string | null>(null);
  const [generatingThemeId, setGeneratingThemeId] = useState<string | null>(null);
  const [scheduleMonth, setScheduleMonth] = useState(() => formatMonthInput(new Date()));
  const [activeSection, setActiveSection] = useState<DashboardSection>("guide");
  const [liveTypeFilter, setLiveTypeFilter] = useState<LiveStreamType | "all">("all");
  const [selectedLiveThemeId, setSelectedLiveThemeId] = useState("");
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

    localStorage.setItem(
      backupKey,
      JSON.stringify({ themes, contentItems, imageProjects, analysisItems })
    );
  }, [analysisItems, contentItems, imageProjects, themes]);

  const currentWeekTheme = themes.find((theme) => theme.status === "active") ?? themes[0];
  const selectedLiveTheme =
    themes.find((theme) => theme.id === (selectedLiveThemeId || currentWeekTheme?.id)) ??
    currentWeekTheme;

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
      analysisWaiting: contentItems.filter(
        (item) =>
          item.status === "published" &&
          !analysisItems.some((analysis) => analysis.contentItemId === item.id)
      ).length,
      liveSchedules: contentItems.filter((item) => item.platform === "youtube_live").slice(0, 3),
      upcoming: contentItems
        .filter((item) => item.scheduledDate)
        .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""))
        .slice(0, 5)
    };
  }, [analysisItems, contentItems, imageProjects]);

  const platformCounts = useMemo(() => {
    return platformOptions.map((platform) => ({
      ...platform,
      count: contentItems.filter((item) => item.platform === platform.value).length
    }));
  }, [contentItems]);

  const calendarDays = useMemo(
    () => buildCalendarDays(scheduleMonth, contentItems),
    [contentItems, scheduleMonth]
  );

  const scheduledThisMonth = useMemo(() => {
    return calendarDays
      .filter((day) => day.isCurrentMonth)
      .reduce((total, day) => total + day.items.length, 0);
  }, [calendarDays]);

  const unscheduledItems = useMemo(() => {
    return contentItems
      .filter((item) => !item.scheduledDate && item.status !== "published" && item.status !== "analyzed")
      .slice(0, 8);
  }, [contentItems]);

  const liveItems = useMemo(() => {
    return contentItems
      .filter((item) => item.contentType === "youtube_live_plan")
      .filter((item) => {
        if (liveTypeFilter === "all") {
          return true;
        }

        const theme = themes.find((themeItem) => themeItem.id === item.themeId);
        return parseLivePlanFromItem(item, theme).liveStreamType === liveTypeFilter;
      })
      .sort((a, b) => (a.scheduledDate ?? "9999-99-99").localeCompare(b.scheduledDate ?? "9999-99-99"));
  }, [contentItems, liveTypeFilter, themes]);

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
    setActiveSection("themes");
    setEditingThemeId(theme.id);
    setThemeForm({
      userId: theme.userId,
      week: theme.week,
      mainTheme: theme.mainTheme,
      targetAudience: theme.targetAudience,
      targetOptionId: theme.targetOptionId ?? theme.targetOption?.optionId ?? "",
      targetOption: theme.targetOption,
      painPoint: theme.painPoint,
      painOptionId: theme.painOptionId ?? theme.painOption?.optionId ?? "",
      painOption: theme.painOption,
      desiredOutcome: theme.desiredOutcome,
      desiredOutcomeOptionId:
        theme.desiredOutcomeOptionId ?? theme.desiredOutcomeOption?.optionId ?? "",
      desiredOutcomeOption: theme.desiredOutcomeOption,
      purpose: theme.purpose || "LINE登録",
      cta: theme.cta,
      ctaOptionId: theme.ctaOptionId ?? theme.ctaOption?.optionId ?? "",
      ctaOption: theme.ctaOption,
      offer: theme.offer ?? "",
      offerOptionId: theme.offerOptionId ?? theme.offerOption?.optionId ?? "",
      offerOption: theme.offerOption,
      angle: theme.angle,
      angleOptionId: theme.angleOptionId ?? theme.angleOption?.optionId ?? "",
      angleOption: theme.angleOption,
      memo: theme.memo ?? "",
      status: theme.status
    });
  }

  function resetThemeForm() {
    setEditingThemeId(null);
    setThemeForm(emptyThemeForm);
  }

  function selectContentItem(contentItem: ContentItem) {
    setActiveSection("content");
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
    setActiveSection("images");
    setEditingImageProjectId(imageProject.id);
    setImageProjectForm(ensureImageProjectEditor({
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
      imagePlatform: imageProject.imagePlatform,
      outputPreset: imageProject.outputPreset,
      slides: imageProject.slides,
      colorTheme: imageProject.colorTheme,
      memo: imageProject.memo ?? ""
    }));
  }

  function resetImageProjectForm() {
    setEditingImageProjectId(null);
    setImageProjectForm(ensureImageProjectEditor({
      ...emptyImageProjectForm,
      themeId: themes[0]?.id ?? "",
      themeTitle: themes[0]?.mainTheme ?? ""
    }));
  }

  function updateImageProjectForm(input: Partial<ImageProjectInput>) {
    setImageProjectForm((form) => ({ ...form, ...input }));
  }

  function updateAnalysisForm(input: Partial<AnalysisInput>) {
    setAnalysisForm((form) => withCalculatedAnalysis({ ...form, ...input }));
  }

  function selectAnalysis(analysis: Analysis) {
    setActiveSection("analysis");
    setEditingAnalysisId(analysis.id);
    setAnalysisForm(
      withCalculatedAnalysis({
        userId: analysis.userId,
        contentItemId: analysis.contentItemId,
        contentTitle: analysis.contentTitle ?? "",
        platform: analysis.platform,
        impressions: analysis.impressions ?? 0,
        reach: analysis.reach ?? 0,
        views: analysis.views ?? 0,
        averageViewDuration: analysis.averageViewDuration ?? 0,
        livePeakViewers: analysis.livePeakViewers ?? 0,
        liveChatCount: analysis.liveChatCount ?? 0,
        likes: analysis.likes ?? 0,
        comments: analysis.comments ?? 0,
        saves: analysis.saves ?? 0,
        shares: analysis.shares ?? 0,
        follows: analysis.follows ?? 0,
        profileAccess: analysis.profileAccess ?? 0,
        linkClicks: analysis.linkClicks ?? 0,
        lineRegistrations: analysis.lineRegistrations ?? 0,
        conversions: analysis.conversions ?? 0,
        saveRate: analysis.saveRate ?? 0,
        engagementRate: analysis.engagementRate ?? 0,
        followConversionRate: analysis.followConversionRate ?? 0,
        lineRegistrationRate: analysis.lineRegistrationRate ?? 0,
        goodPoint: analysis.goodPoint ?? "",
        improvementPoint: analysis.improvementPoint ?? "",
        nextAction: analysis.nextAction ?? "",
        analyzedAt: analysis.analyzedAt ?? new Date().toISOString().slice(0, 10)
      })
    );
  }

  function resetAnalysisForm() {
    setEditingAnalysisId(null);
    setAnalysisForm({
      ...emptyAnalysisForm,
      analyzedAt: new Date().toISOString().slice(0, 10)
    });
  }

  function submitTheme() {
    startTransition(async () => {
      const input = applyThemeOptionSelections({
        ...themeForm,
        mainTheme: themeForm.mainTheme.trim(),
        week: themeForm.week.trim()
      }, themeOptions);

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
      const input: ImageProjectInput = ensureImageProjectEditor({
        ...imageProjectForm,
        themeTitle: selectedTheme?.mainTheme ?? imageProjectForm.themeTitle,
        contentTitle: selectedContent?.title ?? imageProjectForm.contentTitle,
        title: imageProjectForm.title.trim(),
        prompt: imageProjectForm.prompt.trim()
      });

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

  function submitAnalysis() {
    startTransition(async () => {
      const selectedContent = contentItems.find((item) => item.id === analysisForm.contentItemId);
      const input = withCalculatedAnalysis({
        ...analysisForm,
        contentTitle: selectedContent?.title ?? analysisForm.contentTitle,
        platform: selectedContent?.platform ?? analysisForm.platform
      });

      if (!input.contentItemId) {
        setNotice("分析する投稿を選んでください。");
        return;
      }

      if (editingAnalysisId) {
        const result = await updateAnalysisAction(editingAnalysisId, input);
        const updatedAnalysis =
          result.data ??
          ({
            ...analysisItems.find((analysis) => analysis.id === editingAnalysisId),
            ...input,
            updatedAt: nowIso()
          } as Analysis);

        setAnalysisItems((current) =>
          current.map((analysis) =>
            analysis.id === editingAnalysisId ? updatedAnalysis : analysis
          )
        );
        setNotice(result.ok ? "分析結果をNotionに保存しました。" : `分析結果をブラウザ内に保存しました。${result.error}`);
      } else {
        const result = await saveAnalysisAction(input);
        const createdAnalysis =
          result.data ??
          ({
            ...input,
            id: localId("analysis"),
            createdAt: nowIso(),
            updatedAt: nowIso()
          } satisfies Analysis);

        setAnalysisItems((current) => [createdAnalysis, ...current]);
        setNotice(result.ok ? "分析結果をNotionに保存しました。" : `分析結果をブラウザ内に保存しました。${result.error}`);
      }

      resetAnalysisForm();
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
        const imageType = imageProject.imageType ?? imageTypeForContent(contentItem);
        const carouselSlides = createPinkCarouselSlides(contentItem, theme);
        const editorInput = ensureImageProjectEditor({
          ...imageProject,
          imagePlatform: imageProject.imagePlatform ?? imagePlatformForType(imageType),
          outputPreset: imageProject.outputPreset ?? presetForPlatform(imagePlatformForType(imageType)),
          slides:
            imageProject.slides && imageProject.slides.length > 0
              ? imageProject.slides
              : carouselSlides ??
                createDefaultSlides({
                    title: contentItem.title,
                    body: buildImagePrompt(contentItem, theme),
                    cta: theme?.cta,
                    platform: imagePlatformForType(imageType),
                    colorTheme: imageProject.colorTheme ?? "korean_pink"
                  }),
          colorTheme: carouselSlides ? "yuzuki_pink_grid" : imageProject.colorTheme ?? "korean_pink"
        });
        const editorProject: ImageProject = {
          ...imageProject,
          ...editorInput
        };

        setImageProjects((current) => [editorProject, ...current]);
        setContentItems((current) =>
          current.map((item) =>
            item.id === contentItem.id ? { ...item, imageProjectId: editorProject.id } : item
          )
        );
        setImageProjectForm(editorProject);
        setEditingImageProjectId(editorProject.id);
        setActiveSection("images");
        setNotice("投稿から画像プロジェクトを作成し、Notionに保存しました。");
        return;
      }

      const imageType = imageTypeForContent(contentItem);
      const carouselSlides = createPinkCarouselSlides(contentItem, theme);
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
        imagePlatform: imagePlatformForType(imageType),
        outputPreset: presetForPlatform(imagePlatformForType(imageType)),
        slides:
          carouselSlides ??
          createDefaultSlides({
            title: contentItem.title,
            body: buildImagePrompt(contentItem, theme),
            cta: theme?.cta,
            platform: imagePlatformForType(imageType),
            colorTheme: "korean_pink"
          }),
        colorTheme: carouselSlides ? "yuzuki_pink_grid" : "korean_pink",
        memo: `Notion保存に失敗したためローカル作成: ${result.error ?? ""}`,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };

      setImageProjects((current) => [localProject, ...current]);
      setImageProjectForm(localProject);
      setEditingImageProjectId(localProject.id);
      setActiveSection("images");
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

  function scheduleContentItem(item: ContentItem, scheduledDate: string) {
    const status: ContentStatus = scheduledDate ? "scheduled" : item.status === "scheduled" ? "drafting" : item.status;

    setContentItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, scheduledDate, status, updatedAt: nowIso() }
          : currentItem
      )
    );

    startTransition(async () => {
      if (item.id.startsWith("content-")) {
        setNotice("投稿予定をブラウザ内で更新しました。Notion保存前のローカルデータです。");
        return;
      }

      const result = await updateContentItemAction(item.id, { scheduledDate, status });

      if (result.data) {
        setContentItems((current) =>
          current.map((currentItem) => (currentItem.id === item.id ? result.data! : currentItem))
        );
      }

      setNotice(
        result.ok
          ? scheduledDate
            ? "投稿予定をNotionに保存しました。"
            : "投稿予定を解除しました。"
          : `投稿予定はローカル更新のみです。${result.error}`
      );
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

  function removeAnalysis(id: string) {
    if (!confirm("この分析結果を削除しますか？ Notion上ではアーカイブされます。")) {
      return;
    }

    startTransition(async () => {
      const result = id.startsWith("analysis-") ? { ok: true } : await deleteAnalysisAction(id);

      if (result.ok) {
        setAnalysisItems((current) => current.filter((analysis) => analysis.id !== id));
        setNotice("分析結果を削除しました。");
      } else {
        setNotice(`分析結果を削除できませんでした。${result.error}`);
      }
    });
  }

  function exportAllData() {
    downloadJson(`yuzuki-content-studio-${new Date().toISOString().slice(0, 10)}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      themes,
      contentItems,
      imageProjects,
      analysisItems
    });
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result ?? "{}")) as Partial<BackupData>;
        setThemes(Array.isArray(parsed.themes) ? parsed.themes : []);
        setContentItems(Array.isArray(parsed.contentItems) ? parsed.contentItems : []);
        setImageProjects(Array.isArray(parsed.imageProjects) ? parsed.imageProjects : []);
        setAnalysisItems(Array.isArray(parsed.analysisItems) ? parsed.analysisItems : []);
        setNotice("JSONをブラウザ内に読み込みました。Notionへ反映したい場合は、各画面で保存してください。");
      } catch {
        setNotice("JSONの読み込みに失敗しました。ファイルの形式を確認してください。");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
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
      const enrichedTheme = {
        ...theme,
        ...applyThemeOptionSelections(theme, themeOptions)
      };
      const result = await generateContentSetAction(enrichedTheme);
      setGeneratingThemeId(null);

      const generatedData = result.data;

      if (generatedData) {
        setContentItems((current) => [...generatedData.contentItems, ...current]);
        setActiveSection("status");
        const sourceLabel =
          generatedData.source === "claude" ? "Claude Opus" : "モック生成";
        setNotice(
          `${sourceLabel}で${generatedData.contentItems.length}件のコンテンツ案を一括生成しました。「投稿管理」に表示しています。`
        );
        return;
      }

      setNotice(`一括生成に失敗しました。${result.error ?? ""}`);
    });
  }

  function createWeeklyLivePair(theme: Theme) {
    const plans = [
      buildDefaultLivePlan(
        {
          ...emptyContentForm,
          themeId: theme.id,
          themeNotionPageId: theme.notionPageId,
          title: `${theme.mainTheme} 作業ライブ`,
          cta: theme.cta,
          scheduledDate: addDaysFromToday(2)
        },
        theme
      ),
      {
        ...buildDefaultLivePlan(
          {
            ...emptyContentForm,
            themeId: theme.id,
            themeNotionPageId: theme.notionPageId,
            title: `${theme.mainTheme} 解説ライブ`,
            cta: theme.cta,
            scheduledDate: addDaysFromToday(5)
          },
          theme
        ),
        liveStreamType: "roadmap" as LiveStreamType,
        estimatedDurationMinutes: 75,
        startTime: "20:00"
      }
    ];

    const inputs: ContentItemInput[] = plans.map((plan, index) => ({
      userId: undefined,
      themeId: theme.id,
      themeNotionPageId: theme.notionPageId,
      platform: "youtube_live",
      contentType: "youtube_live_plan",
      title: plan.title,
      status: "generated",
      scheduledDate: plan.scheduledDate,
      publishedDate: "",
      cta: plan.cta,
      body: "",
      caption: "",
      script: toPrettyJson(plan),
      article: "",
      hashtags: [],
      imageProjectId: "",
      memo: `Phase 7 週2本ライブ ${index + 1}本目`
    }));

    startTransition(async () => {
      const results = await Promise.all(inputs.map((input) => saveContentItemAction(input)));
      const created = results.map((result, index) =>
        result.data ??
        ({
          ...inputs[index],
          id: localId("content"),
          createdAt: nowIso(),
          updatedAt: nowIso()
        } satisfies ContentItem)
      );

      setContentItems((current) => [...created, ...current]);
      setActiveSection("lives");
      setNotice(
        results.every((result) => result.ok)
          ? "週2本のYouTubeライブ企画をNotionに保存しました。"
          : "週2本のYouTubeライブ企画を作りました。一部はブラウザ内の保存です。"
      );
    });
  }

  function createDerivedContentFromLive(
    item: ContentItem,
    target: "reel" | "threads" | "x" | "note" | "carousel"
  ) {
    const theme = themes.find((themeItem) => themeItem.id === item.themeId);
    const plan = parseLivePlanFromItem(item, theme);
    const titlePrefix = plan.title || item.title;
    const commonMemo = `Phase 7 ライブ配信から派生: ${item.title}`;
    const outlineText = plan.outline.length > 0 ? plan.outline.join(" / ") : plan.openingHook;
    const inputMap: Record<typeof target, ContentItemInput> = {
      reel: {
        ...contentItemToInput(item),
        platform: "instagram_reel",
        contentType: "instagram_reel_script",
        title: `${titlePrefix} リール切り抜き案`,
        status: "generated",
        script: [
          `Hook: ${plan.openingHook || plan.thumbnailText}`,
          `Main: ${outlineText}`,
          `CTA: ${plan.cta}`,
          `Clip ideas: ${plan.clipIdeas.join(" / ")}`
        ].join("\n"),
        body: "",
        memo: commonMemo
      },
      threads: {
        ...contentItemToInput(item),
        platform: "threads",
        contentType: "threads_post",
        title: `${titlePrefix} Threads投稿案`,
        status: "generated",
        body: [plan.openingHook, ...plan.questionsForViewers, plan.cta].filter(Boolean).join("\n\n"),
        script: "",
        memo: commonMemo
      },
      x: {
        ...contentItemToInput(item),
        platform: "x",
        contentType: "x_post",
        title: `${titlePrefix} X投稿案`,
        status: "generated",
        body: [plan.thumbnailText, outlineText, plan.cta].filter(Boolean).join("\n\n"),
        script: "",
        memo: commonMemo
      },
      note: {
        ...contentItemToInput(item),
        platform: "note",
        contentType: "note_article",
        title: `${titlePrefix} note記事案`,
        status: "generated",
        article: [
          `# ${titlePrefix}`,
          plan.openingHook,
          ...plan.sections.map((section) => `## ${section.title}\n${section.script}`),
          plan.cta
        ].filter(Boolean).join("\n\n"),
        script: "",
        memo: commonMemo
      },
      carousel: {
        ...contentItemToInput(item),
        platform: "instagram",
        contentType: "instagram_carousel",
        title: `${titlePrefix} カルーセル案`,
        status: "generated",
        body: ["01 表紙", plan.thumbnailText || titlePrefix, "02 要点", outlineText, "03 CTA", plan.cta]
          .filter(Boolean)
          .join("\n"),
        script: "",
        memo: commonMemo
      }
    };
    const input = inputMap[target];

    startTransition(async () => {
      const result = await saveContentItemAction(input);
      const created =
        result.data ??
        ({
          ...input,
          id: localId("content"),
          createdAt: nowIso(),
          updatedAt: nowIso()
        } satisfies ContentItem);

      setContentItems((current) => [created, ...current]);
      setNotice(
        result.ok
          ? "ライブ配信から派生コンテンツをNotionに保存しました。"
          : `派生コンテンツをブラウザ内に保存しました。${result.error ?? ""}`
      );
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 lg:flex-row">
      <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-64 lg:shrink-0">
        <div className="rounded-lg border border-white/70 bg-white/72 p-4 shadow-soft backdrop-blur">
          <p className="text-xs font-medium text-champagne">Yuzuki Content Studio</p>
          <nav className="mt-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveSection(item.value)}
                className={`w-full rounded-md border px-3 py-3 text-left transition ${
                  activeSection === item.value
                    ? "border-champagne bg-rose text-ink"
                    : "border-stone-200 bg-white/70 text-stone-600 hover:border-champagne/60"
                }`}
              >
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs">{item.description}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-white/70 bg-white/68 p-6 shadow-soft backdrop-blur md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-champagne">Phase 8-10</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            Yuzuki Content Studio
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            投稿案、画像制作、投稿予定をまとめて管理し、Notionへ保存できます。
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

      {activeSection === "guide" ? (
      <Panel title="Yuzuki Content Studioの使い方">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {[
              {
                step: "1",
                title: "テーマを決める",
                body: "左メニューの「テーマ管理」を開き、今週の発信テーマ、届けたい相手、悩み、CTAを入力します。最初は「サンプルデータ投入」でもOKです。",
                action: "テーマ管理を開く",
                section: "themes" as DashboardSection
              },
              {
                step: "2",
                title: "投稿を一括生成する",
                body: "テーマ一覧で「一括生成」を押すと、Instagram、X、Threads、note、YouTube、ライブ企画の下書きが作られます。Claude Opusを設定済みなら文章生成にClaudeを使います。",
                action: "テーマ一覧へ進む",
                section: "themes" as DashboardSection
              },
              {
                step: "3",
                title: "文章を編集する",
                body: "「投稿作成」で投稿本文、キャプション、台本、note記事、ライブ台本を整えます。編集したら「投稿を保存」を押します。",
                action: "投稿作成を開く",
                section: "content" as DashboardSection
              },
              {
                step: "4",
                title: "画像を作る",
                body: "「画像エディタ」でカルーセル、X画像、Threads画像を作ります。文字をクリックして選択、ドラッグで移動、最後にPNGを書き出します。",
                action: "画像エディタを開く",
                section: "images" as DashboardSection
              },
              {
                step: "5",
                title: "投稿予定を決める",
                body: "「カレンダー」または「投稿管理」で投稿予定日を入れます。ステータスを予約済み、投稿済みなどに変えて進行を管理します。",
                action: "カレンダーを開く",
                section: "calendar" as DashboardSection
              },
              {
                step: "6",
                title: "投稿後に分析する",
                body: "投稿後は「分析管理」で表示回数、保存、いいね、LINE登録などを入力します。保存率や反応率は自動計算されます。",
                action: "分析管理を開く",
                section: "analysis" as DashboardSection
              }
            ].map((item) => (
              <div key={item.step} className="rounded-lg border border-stone-200 bg-white/72 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                      {item.step}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-600">{item.body}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.section)}
                    className="shrink-0 rounded-md border border-champagne/60 bg-rose px-3 py-2 text-xs font-medium text-ink"
                  >
                    {item.action}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
              <h3 className="text-base font-semibold text-ink">おすすめの最短ルート</h3>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                <li>1. 「テーマ管理」でテーマを作る</li>
                <li>2. 「一括生成」を押す</li>
                <li>3. 「投稿作成」で文章を直す</li>
                <li>4. 「画像エディタ」で画像を作る</li>
                <li>5. 「投稿管理」で日付とステータスを整える</li>
              </ol>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
              <h3 className="text-base font-semibold text-ink">Claude Opusを使うには</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                VercelのEnvironment Variablesに `ANTHROPIC_API_KEY` と `ANTHROPIC_MODEL` を入れると、
                テーマの一括生成時にClaude Opusで文章を作れます。
              </p>
              <code className="mt-3 block rounded-md bg-stone-100 px-3 py-2 text-xs text-stone-700">
                ANTHROPIC_MODEL=claude-opus-4-8
              </code>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
              <h3 className="text-base font-semibold text-ink">困ったとき</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                まず「データ管理」でJSONを書き出してバックアップしてください。その後、Notion接続テストを押すと保存先の接続確認ができます。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection("data")}
                  className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                >
                  データ管理を開く
                </button>
                <a
                  href="/api/notion/test"
                  className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                >
                  Notion接続テスト
                </a>
              </div>
            </div>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeSection === "overview" ? (
      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="今週のテーマ" value={currentWeekTheme?.mainTheme ?? "未設定"} />
        <MetricCard label="作成中" value={summary.drafting.toString()} />
        <MetricCard label="確認待ち" value={summary.review.toString()} />
        <MetricCard label="予約済み" value={summary.scheduled.toString()} />
        <MetricCard label="今月予定" value={scheduledThisMonth.toString()} />
      </section>
      ) : null}

      {activeSection === "lives" ? (
      <Panel title="YouTubeライブ配信管理">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div className="grid flex-1 gap-3 md:grid-cols-2">
            <SelectSimpleField
              label="配信タイプで絞り込み"
              value={liveTypeFilter}
              options={[
                { value: "all", label: "すべて" },
                ...liveStreamTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label
                }))
              ]}
              onChange={(value) => setLiveTypeFilter(value as LiveStreamType | "all")}
            />
            <SelectSimpleField
              label="週テーマ"
              value={selectedLiveTheme?.id ?? ""}
              options={themes.map((theme) => ({ value: theme.id, label: theme.mainTheme }))}
              onChange={(value) => setSelectedLiveThemeId(value)}
            />
          </div>
          <button
            type="button"
            onClick={() => selectedLiveTheme && createWeeklyLivePair(selectedLiveTheme)}
            disabled={!selectedLiveTheme || isPending}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            週2本ライブを作成
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {liveItems.length === 0 ? (
            <p className="rounded-md border border-stone-200 bg-white/70 px-4 py-6 text-sm text-stone-500">
              YouTubeライブ企画はまだありません。週テーマを選んで「週2本ライブを作成」を押してください。
            </p>
          ) : (
            liveItems.map((item) => {
              const theme = themes.find((themeItem) => themeItem.id === item.themeId);
              const plan = parseLivePlanFromItem(item, theme);

              return (
                <article key={item.id} className="rounded-lg border border-stone-200 bg-white/72 p-4">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-rose px-3 py-1 text-xs text-ink">
                          {labelFor(liveStreamTypeOptions, plan.liveStreamType)}
                        </span>
                        <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">
                          {labelFor(contentStatusOptions, item.status)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-ink">{item.title}</h3>
                      <p className="mt-1 text-sm text-stone-600">
                        {plan.scheduledDate || "日付未定"} {plan.startTime || ""} / {plan.estimatedDurationMinutes}分
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                        {plan.openingHook || plan.purpose || "ライブの目的や冒頭フックを編集画面で整えます。"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => selectContentItem(item)}
                        className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                      >
                        企画を編集
                      </button>
                      <button
                        type="button"
                        onClick={() => createImageProjectFromContent(item)}
                        disabled={isPending || creatingImageForContentId === item.id}
                        className="rounded-md border border-champagne/60 bg-rose px-3 py-2 text-xs font-medium text-ink disabled:opacity-60"
                      >
                        サムネ画像
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <button type="button" onClick={() => createDerivedContentFromLive(item, "reel")} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium">
                      リール案
                    </button>
                    <button type="button" onClick={() => createDerivedContentFromLive(item, "threads")} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium">
                      Threads案
                    </button>
                    <button type="button" onClick={() => createDerivedContentFromLive(item, "x")} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium">
                      X案
                    </button>
                    <button type="button" onClick={() => createDerivedContentFromLive(item, "note")} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium">
                      note案
                    </button>
                    <button type="button" onClick={() => createDerivedContentFromLive(item, "carousel")} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium">
                      カルーセル案
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </Panel>
      ) : null}

      {activeSection === "calendar" ? (
      <Panel title="投稿カレンダー">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setScheduleMonth((month) => addMonths(month, -1))}
              className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
            >
              前月
            </button>
            <input
              type="month"
              value={scheduleMonth}
              onChange={(event) => setScheduleMonth(event.target.value)}
              className="rounded-md border border-stone-200 bg-white/85 px-3 py-2 text-sm outline-none transition focus:border-champagne"
            />
            <button
              type="button"
              onClick={() => setScheduleMonth((month) => addMonths(month, 1))}
              className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
            >
              翌月
            </button>
            <button
              type="button"
              onClick={() => setScheduleMonth(formatMonthInput(new Date()))}
              className="rounded-md border border-champagne/60 bg-rose px-3 py-2 text-xs font-medium text-ink"
            >
              今月
            </button>
          </div>
          <p className="text-sm text-stone-600">
            この月の投稿予定: <strong className="text-ink">{scheduledThisMonth}</strong>件
          </p>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-medium text-stone-500">
          {weekdayLabels.map((weekday) => (
            <div key={weekday}>{weekday}</div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className={`min-h-28 rounded-md border p-2 text-left ${
                day.isCurrentMonth
                  ? "border-stone-200 bg-white/75"
                  : "border-stone-100 bg-white/35 text-stone-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{day.day}</span>
                {day.items.length > 0 ? (
                  <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] text-ink">
                    {day.items.length}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 space-y-1">
                {day.items.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectContentItem(item)}
                    className="block w-full rounded-sm bg-white px-2 py-1 text-left text-[11px] leading-4 text-ink shadow-sm"
                  >
                    {labelFor(platformOptions, item.platform)} / {item.title}
                  </button>
                ))}
                {day.items.length > 3 ? (
                  <p className="px-1 text-[11px] text-stone-500">他 {day.items.length - 3}件</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-stone-200 bg-white/60 p-4">
          <h3 className="text-base font-semibold text-ink">未予約の投稿</h3>
          <div className="mt-3 space-y-2">
            {unscheduledItems.length === 0 ? (
              <p className="text-sm text-stone-500">未予約の投稿はありません。</p>
            ) : (
              unscheduledItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-md border border-stone-100 bg-white/80 px-3 py-3 md:flex-row md:items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {labelFor(platformOptions, item.platform)} /{" "}
                      {labelFor(contentTypeOptions, item.contentType)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => scheduleContentItem(item, addDaysFromToday(1))}
                      className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                    >
                      明日
                    </button>
                    <button
                      type="button"
                      onClick={() => scheduleContentItem(item, addDaysFromToday(3))}
                      className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                    >
                      3日後
                    </button>
                    <button
                      type="button"
                      onClick={() => scheduleContentItem(item, addDaysFromToday(7))}
                      className="rounded-md bg-ink px-3 py-2 text-xs font-medium text-white"
                    >
                      7日後
                    </button>
                    <button
                      type="button"
                      onClick={() => selectContentItem(item)}
                      className="rounded-md border border-champagne/60 bg-rose px-3 py-2 text-xs font-medium text-ink"
                    >
                      詳細編集
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Panel>
      ) : null}

      {activeSection === "themes" || activeSection === "overview" ? (
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {activeSection === "themes" ? (
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
            {themeOptionFieldConfigs.map((config) => (
              <ThemeOptionField
                key={config.category}
                config={config}
                value={String(themeForm[config.textKey] ?? "")}
                optionId={String(themeForm[config.optionIdKey] ?? "")}
                options={themeOptions[config.category]}
                onOptionChange={(optionId) => {
                  const option = findThemeOption(themeOptions, config.category, optionId);
                  setThemeForm((form) => ({
                    ...form,
                    [config.optionIdKey]: option?.id ?? "",
                    [config.optionKey]: toThemeOptionSelection(option, option?.name),
                    [config.textKey]: option?.name ?? ""
                  }));
                }}
                onTextChange={(value) =>
                  setThemeForm((form) => ({
                    ...form,
                    [config.textKey]: value,
                    [config.optionKey]: toThemeOptionSelection(
                      findThemeOption(
                        themeOptions,
                        config.category,
                        String(form[config.optionIdKey] ?? "")
                      ),
                      value
                    )
                  }))
                }
              />
            ))}
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
        ) : null}

        {activeSection === "overview" ? (
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
        ) : null}
      </section>
      ) : null}

      {activeSection === "themes" ? (
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
      ) : null}

      {activeSection === "content" ? (
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
      ) : null}

      {activeSection === "images" ? (
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
              const carouselSlides = createPinkCarouselSlides(selectedContent, selectedTheme);

              updateImageProjectForm({
                contentItemId: value,
                contentTitle: selectedContent?.title ?? "",
                themeId: selectedTheme?.id ?? imageProjectForm.themeId,
                themeTitle: selectedTheme?.mainTheme ?? imageProjectForm.themeTitle,
                platform: selectedContent?.platform ?? imageProjectForm.platform,
                imageType,
                imagePlatform: imagePlatformForType(imageType),
                outputPreset: presetForPlatform(imagePlatformForType(imageType)),
                title: selectedContent ? `${selectedContent.title} 画像案` : imageProjectForm.title,
                format: formatForImageType(imageType),
                prompt: buildImagePrompt(selectedContent, selectedTheme),
                slides:
                  carouselSlides ??
                  createDefaultSlides({
                    title: selectedContent?.title ?? "画像プロジェクト",
                    body: buildImagePrompt(selectedContent, selectedTheme),
                    cta: selectedTheme?.cta,
                    platform: imagePlatformForType(imageType),
                    colorTheme: imageProjectForm.colorTheme ?? "korean_pink"
                  }),
                colorTheme: carouselSlides ? "yuzuki_pink_grid" : imageProjectForm.colorTheme,
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
              const imagePlatform = imagePlatformForType(imageType);
              const outputPreset = presetForPlatform(imagePlatform);
              updateImageProjectForm({
                imageType,
                imagePlatform,
                outputPreset,
                format: formatForImageType(imageType),
                slides: createDefaultSlides({
                  title: imageProjectForm.title || imageProjectForm.contentTitle || "画像プロジェクト",
                  body: imageProjectForm.prompt,
                  cta: "",
                  platform: imagePlatform,
                  colorTheme: imageProjectForm.colorTheme ?? "korean_pink"
                })
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
        <ImageEditorPanel form={ensureImageProjectEditor(imageProjectForm)} onChange={updateImageProjectForm} />
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
      ) : null}

      {activeSection === "images" ? (
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
      ) : null}

      {activeSection === "analysis" ? (
      <Panel title="分析管理">
        <div className="grid gap-3 md:grid-cols-3">
          <SelectSimpleField
            label="分析する投稿"
            value={analysisForm.contentItemId}
            options={contentItems.map((item) => ({ value: item.id, label: item.title }))}
            onChange={(value) => {
              const item = contentItems.find((contentItem) => contentItem.id === value);
              updateAnalysisForm({
                contentItemId: value,
                contentTitle: item?.title ?? "",
                platform: item?.platform ?? analysisForm.platform
              });
            }}
          />
          <SelectField
            label="媒体"
            value={analysisForm.platform}
            options={platformOptions}
            onChange={(value) => updateAnalysisForm({ platform: value as Platform })}
          />
          <TextField
            label="分析日"
            type="date"
            value={analysisForm.analyzedAt ?? ""}
            onChange={(value) => updateAnalysisForm({ analyzedAt: value })}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ["表示回数", "impressions"],
            ["リーチ", "reach"],
            ["再生数", "views"],
            ["平均視聴秒数", "averageViewDuration"],
            ["ライブ最大同接", "livePeakViewers"],
            ["ライブコメント数", "liveChatCount"],
            ["いいね", "likes"],
            ["コメント", "comments"],
            ["保存", "saves"],
            ["シェア", "shares"],
            ["フォロー増", "follows"],
            ["プロフィールアクセス", "profileAccess"],
            ["リンククリック", "linkClicks"],
            ["LINE登録", "lineRegistrations"],
            ["成約", "conversions"]
          ].map(([label, key]) => (
            <TextField
              key={key}
              label={label}
              type="number"
              value={String((analysisForm[key as keyof AnalysisInput] as number | undefined) ?? 0)}
              onChange={(value) => updateAnalysisForm({ [key]: Number(value) || 0 } as Partial<AnalysisInput>)}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <MetricCard label="保存率" value={`${analysisForm.saveRate ?? 0}%`} />
          <MetricCard label="反応率" value={`${analysisForm.engagementRate ?? 0}%`} />
          <MetricCard label="フォロー転換率" value={`${analysisForm.followConversionRate ?? 0}%`} />
          <MetricCard label="LINE登録率" value={`${analysisForm.lineRegistrationRate ?? 0}%`} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <TextAreaField
            label="良かった点"
            value={analysisForm.goodPoint ?? ""}
            onChange={(value) => updateAnalysisForm({ goodPoint: value })}
          />
          <TextAreaField
            label="改善点"
            value={analysisForm.improvementPoint ?? ""}
            onChange={(value) => updateAnalysisForm({ improvementPoint: value })}
          />
          <TextAreaField
            label="次のアクション"
            value={analysisForm.nextAction ?? ""}
            onChange={(value) => updateAnalysisForm({ nextAction: value })}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={submitAnalysis}
            disabled={isPending}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {editingAnalysisId ? "分析を保存" : "分析を追加"}
          </button>
          <button
            type="button"
            onClick={resetAnalysisForm}
            className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-ink"
          >
            入力をリセット
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {analysisItems.length === 0 ? (
            <p className="text-sm text-stone-500">分析結果はまだありません。</p>
          ) : (
            analysisItems.map((analysis) => (
              <article key={analysis.id} className="rounded-lg border border-stone-200 bg-white/72 p-4">
                <p className="text-xs text-stone-500">
                  {labelFor(platformOptions, analysis.platform)} / {analysis.analyzedAt ?? "日付未設定"}
                </p>
                <h3 className="mt-1 text-base font-semibold text-ink">
                  {analysis.contentTitle || "投稿分析"}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-600">
                  <span>保存率 {analysis.saveRate ?? 0}%</span>
                  <span>反応率 {analysis.engagementRate ?? 0}%</span>
                  <span>LINE {analysis.lineRegistrationRate ?? 0}%</span>
                  <span>成約 {analysis.conversions ?? 0}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-stone-600">
                  {analysis.nextAction || analysis.improvementPoint || "次の改善メモを残せます。"}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => selectAnalysis(analysis)}
                    className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAnalysis(analysis.id)}
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
      ) : null}

      {activeSection === "data" ? (
      <Panel title="データ管理">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
            <h3 className="text-base font-semibold text-ink">JSONエクスポート</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              テーマ、投稿、画像プロジェクト、ライブ企画、分析結果をまとめてJSONで保存します。
            </p>
            <button
              type="button"
              onClick={exportAllData}
              className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
            >
              全データを書き出し
            </button>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white/72 p-4">
            <h3 className="text-base font-semibold text-ink">JSONインポート</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              書き出したJSONをブラウザ内に読み込みます。Notionへ反映する前の確認用です。
            </p>
            <input
              type="file"
              accept="application/json"
              onChange={importJson}
              className="mt-4 block w-full text-sm text-stone-600"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <MetricCard label="テーマ" value={themes.length.toString()} />
          <MetricCard label="投稿" value={contentItems.length.toString()} />
          <MetricCard label="画像" value={imageProjects.length.toString()} />
          <MetricCard label="分析" value={analysisItems.length.toString()} />
        </div>
      </Panel>
      ) : null}

      {activeSection === "status" ? (
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
                        <div className="flex min-w-40 flex-col gap-2">
                          <input
                            type="date"
                            value={scheduledDateKey(item.scheduledDate)}
                            onChange={(event) => scheduleContentItem(item, event.target.value)}
                            className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs"
                          />
                          {item.scheduledDate ? (
                            <button
                              type="button"
                              onClick={() => scheduleContentItem(item, "")}
                              className="text-left text-xs font-medium text-stone-500 underline decoration-champagne underline-offset-4"
                            >
                              予定を解除
                            </button>
                          ) : null}
                        </div>
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
      ) : null}
      </div>
    </div>
  );
}

function ImageEditorPanel({
  form,
  onChange
}: {
  form: ImageProjectInput;
  onChange: (input: Partial<ImageProjectInput>) => void;
}) {
  const editorForm = ensureImageProjectEditor(form);
  const slides = useMemo(() => editorForm.slides ?? [], [editorForm.slides]);
  const preset = editorForm.outputPreset ?? outputPresets[0];
  const [selectedSlideId, setSelectedSlideId] = useState(slides[0]?.id ?? "");
  const [selectedElementId, setSelectedElementId] = useState(slides[0]?.elements[0]?.id ?? "");
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);

  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) ?? slides[0];
  const selectedElement =
    selectedSlide?.elements.find((element) => element.id === selectedElementId) ??
    selectedSlide?.elements[0];

  function updateSlides(nextSlides: Slide[]) {
    onChange({ slides: nextSlides });
  }

  function updateSlide(slideId: string, input: Partial<Slide>) {
    updateSlides(slides.map((slide) => (slide.id === slideId ? { ...slide, ...input } : slide)));
  }

  function updateElement(slideId: string, elementId: string, input: Partial<SlideElement>) {
    updateSlides(
      slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map((element) =>
                element.id === elementId ? { ...element, ...input } : element
              )
            }
          : slide
      )
    );
  }

  function moveElement(slideId: string, elementId: string, x: number, y: number) {
    const snapTargets = [
      safeAreaMargin,
      preset.width / 2,
      preset.width - safeAreaMargin,
      preset.height / 2,
      preset.height - safeAreaMargin
    ];
    const snap = (value: number) => {
      const target = snapTargets.find((snapValue) => Math.abs(snapValue - value) <= 12);
      return target ?? value;
    };

    updateElement(slideId, elementId, {
      x: Math.max(0, Math.min(preset.width, snap(Math.round(x)))),
      y: Math.max(0, Math.min(preset.height, snap(Math.round(y))))
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingElementId || !selectedSlide) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / editorPreviewScale;
    const y = (event.clientY - bounds.top) / editorPreviewScale;
    const element = selectedSlide.elements.find((item) => item.id === draggingElementId);

    if (!element) {
      return;
    }

    moveElement(selectedSlide.id, draggingElementId, x - element.width / 2, y);
  }

  function handleKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!selectedSlide || !selectedElement) {
      return;
    }

    const amount = event.shiftKey ? 10 : 1;
    const movement = {
      ArrowUp: { x: 0, y: -amount },
      ArrowDown: { x: 0, y: amount },
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 }
    }[event.key];

    if (!movement) {
      return;
    }

    event.preventDefault();
    moveElement(
      selectedSlide.id,
      selectedElement.id,
      selectedElement.x + movement.x,
      selectedElement.y + movement.y
    );
  }

  function duplicateSlide() {
    if (!selectedSlide || slides.length >= preset.maxSlides) {
      return;
    }

    const duplicated: Slide = {
      ...selectedSlide,
      id: localId("slide"),
      title: `${selectedSlide.title} コピー`,
      elements: selectedSlide.elements.map((element) => ({ ...element, id: localId("element") }))
    };

    const nextSlides = [...slides, duplicated];
    updateSlides(nextSlides);
    setSelectedSlideId(duplicated.id);
    setSelectedElementId(duplicated.elements[0]?.id ?? "");
  }

  function deleteSlide() {
    if (!selectedSlide || slides.length <= 1) {
      return;
    }

    const nextSlides = slides.filter((slide) => slide.id !== selectedSlide.id);
    updateSlides(nextSlides);
    setSelectedSlideId(nextSlides[0]?.id ?? "");
    setSelectedElementId(nextSlides[0]?.elements[0]?.id ?? "");
  }

  function changeColorTheme(colorTheme: string) {
    onChange({
      colorTheme,
      slides: applyColorThemeToSlides(slides, colorTheme)
    });
  }

  function changeImagePlatform(imagePlatform: ImagePlatform) {
    const nextPreset = presetForPlatform(imagePlatform);
    onChange({
      imagePlatform,
      outputPreset: nextPreset,
      format: `${nextPreset.width}x${nextPreset.height}`,
      slides: createDefaultSlides({
        title: form.title || "画像プロジェクト",
        body: form.prompt,
        cta: "",
        platform: imagePlatform,
        colorTheme: form.colorTheme ?? "korean_pink"
      })
    });
  }

  function changeSlideTemplate(templateType: SlideTemplateType) {
    if (!selectedSlide) {
      return;
    }

    updateSlide(selectedSlide.id, {
      templateType,
      title: labelFor(slideTemplateOptions, templateType)
    });
  }

  function applyCtaTemplate(content: string) {
    if (!selectedSlide) {
      return;
    }

    const ctaElement =
      selectedSlide.elements.find((element) => element.type === "cta") ?? selectedSlide.elements[0];

    if (ctaElement) {
      updateElement(selectedSlide.id, ctaElement.id, { content });
      setSelectedElementId(ctaElement.id);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-stone-200 bg-white/64 p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h3 className="text-base font-semibold text-ink">画像エディタ</h3>
          <p className="mt-1 text-xs text-stone-500">
            要素をクリックして選択し、ドラッグまたは矢印キーで位置を調整できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectedSlide && downloadSlideAsPng(selectedSlide, preset)}
            className="rounded-md bg-ink px-3 py-2 text-xs font-medium text-white"
          >
            選択スライドPNG
          </button>
          <button
            type="button"
            onClick={() => downloadSlidesAsPng(slides, preset)}
            className="rounded-md border border-champagne/60 bg-rose px-3 py-2 text-xs font-medium text-ink"
          >
            全スライドPNG
          </button>
          <button
            type="button"
            onClick={() => setShowSafeArea((value) => !value)}
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium"
          >
            セーフエリア{showSafeArea ? "非表示" : "表示"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[220px_minmax(380px,1fr)_320px]">
        <div className="space-y-3">
          <SelectField
            label="出力形式"
            value={editorForm.imagePlatform ?? "instagram_carousel"}
            options={imagePlatformOptions}
            onChange={(value) => changeImagePlatform(value as ImagePlatform)}
          />
          <SelectSimpleField
            label="配色テーマ"
            value={editorForm.colorTheme ?? "korean_pink"}
            options={colorThemeOptions.map((theme) => ({ value: theme.value, label: theme.label }))}
            onChange={changeColorTheme}
          />
          <SelectField
            label="テンプレート"
            value={selectedSlide?.templateType ?? "cover"}
            options={slideTemplateOptions}
            onChange={(value) => changeSlideTemplate(value as SlideTemplateType)}
          />
          <div className="rounded-md border border-stone-200 bg-white/75 p-3">
            <p className="text-sm font-medium text-ink">スライド</p>
            <div className="mt-2 space-y-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => {
                    setSelectedSlideId(slide.id);
                    setSelectedElementId(slide.elements[0]?.id ?? "");
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs ${
                    selectedSlide?.id === slide.id
                      ? "border-champagne bg-rose text-ink"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  {index + 1}. {slide.title}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={duplicateSlide}
                disabled={slides.length >= preset.maxSlides}
                className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium disabled:opacity-50"
              >
                複製
              </button>
              <button
                type="button"
                onClick={deleteSlide}
                disabled={slides.length <= 1}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-50"
              >
                削除
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-auto rounded-lg border border-stone-200 bg-stone-100/70 p-4">
          {selectedSlide ? (
            <div
              role="application"
              tabIndex={0}
              onKeyDown={handleKeyboard}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDraggingElementId(null)}
              onPointerLeave={() => setDraggingElementId(null)}
              className="relative mx-auto outline-none"
              style={{
                width: preset.width * editorPreviewScale,
                height: preset.height * editorPreviewScale,
                backgroundColor: selectedSlide.backgroundColor,
                backgroundImage:
                  selectedSlide.colorTheme === "yuzuki_pink_grid"
                    ? "linear-gradient(#ffc2dc 1px, transparent 1px), linear-gradient(90deg, #ffc2dc 1px, transparent 1px)"
                    : undefined,
                backgroundSize:
                  selectedSlide.colorTheme === "yuzuki_pink_grid"
                    ? `${155 * editorPreviewScale}px ${155 * editorPreviewScale}px`
                    : undefined
              }}
            >
              {showSafeArea ? (
                <>
                  <div
                    className="pointer-events-none absolute border border-dashed border-champagne"
                    style={{
                      left: safeAreaMargin * editorPreviewScale,
                      top: safeAreaMargin * editorPreviewScale,
                      width: (preset.width - safeAreaMargin * 2) * editorPreviewScale,
                      height: (preset.height - safeAreaMargin * 2) * editorPreviewScale
                    }}
                  />
                  <div
                    className="pointer-events-none absolute top-0 h-full border-l border-dashed border-stone-300"
                    style={{ left: (preset.width / 2) * editorPreviewScale }}
                  />
                  <div
                    className="pointer-events-none absolute left-0 w-full border-t border-dashed border-stone-300"
                    style={{ top: (preset.height / 2) * editorPreviewScale }}
                  />
                </>
              ) : null}

              {[...selectedSlide.elements]
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((element) =>
                  element.visible ? (
                    <button
                      key={element.id}
                      type="button"
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setSelectedElementId(element.id);
                        setDraggingElementId(element.id);
                      }}
                      className={`absolute cursor-move border text-center leading-tight ${
                        selectedElementId === element.id
                          ? "border-ink ring-2 ring-champagne"
                          : "border-transparent"
                      }`}
                      style={{
                        left: element.x * editorPreviewScale,
                        top: element.y * editorPreviewScale,
                        width: element.width * editorPreviewScale,
                        minHeight: (element.height ?? 80) * editorPreviewScale,
                        zIndex: element.zIndex,
                        color: element.color,
                        backgroundColor:
                          element.backgroundColor === "transparent"
                            ? "transparent"
                            : element.backgroundColor,
                        borderRadius: (element.borderRadius ?? 0) * editorPreviewScale,
                        fontSize: (element.fontSize ?? 32) * editorPreviewScale,
                        lineHeight: element.lineHeight ?? 1.35,
                        fontWeight: element.fontWeight,
                        textAlign: element.textAlign,
                        whiteSpace: "pre-line"
                      }}
                    >
                      {element.content}
                    </button>
                  ) : null
                )}
            </div>
          ) : (
            <p className="text-sm text-stone-500">スライドがありません。</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-stone-200 bg-white/75 p-3">
            <p className="text-sm font-medium text-ink">CTAテンプレート</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ctaTemplates.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => applyCtaTemplate(template)}
                  className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {selectedSlide && selectedElement ? (
            <div className="rounded-md border border-stone-200 bg-white/75 p-3">
              <p className="text-sm font-medium text-ink">選択中: {selectedElement.name}</p>
              <div className="mt-3 space-y-3">
                <TextAreaField
                  label="テキスト"
                  value={selectedElement.content ?? ""}
                  rows={4}
                  onChange={(value) =>
                    updateElement(selectedSlide.id, selectedElement.id, { content: value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextField
                    label="X位置"
                    type="number"
                    value={selectedElement.x.toString()}
                    onChange={(value) =>
                      updateElement(selectedSlide.id, selectedElement.id, { x: Number(value) || 0 })
                    }
                  />
                  <TextField
                    label="Y位置"
                    type="number"
                    value={selectedElement.y.toString()}
                    onChange={(value) =>
                      updateElement(selectedSlide.id, selectedElement.id, { y: Number(value) || 0 })
                    }
                  />
                  <TextField
                    label="幅"
                    type="number"
                    value={selectedElement.width.toString()}
                    onChange={(value) =>
                      updateElement(selectedSlide.id, selectedElement.id, {
                        width: Number(value) || selectedElement.width
                      })
                    }
                  />
                  <TextField
                    label="文字サイズ"
                    type="number"
                    value={(selectedElement.fontSize ?? 32).toString()}
                    onChange={(value) =>
                      updateElement(selectedSlide.id, selectedElement.id, {
                        fontSize: Number(value) || selectedElement.fontSize
                      })
                    }
                  />
                  <TextField
                    label="行間"
                    type="number"
                    value={(selectedElement.lineHeight ?? 1.35).toString()}
                    onChange={(value) =>
                      updateElement(selectedSlide.id, selectedElement.id, {
                        lineHeight: Number(value) || selectedElement.lineHeight
                      })
                    }
                  />
                  <label className="block text-sm">
                    <span className="font-medium text-ink">表示</span>
                    <select
                      value={selectedElement.visible ? "show" : "hide"}
                      onChange={(event) =>
                        updateElement(selectedSlide.id, selectedElement.id, {
                          visible: event.target.value === "show"
                        })
                      }
                      className="mt-2 w-full rounded-md border border-stone-200 bg-white/85 px-3 py-2 outline-none transition focus:border-champagne"
                    >
                      <option value="show">表示</option>
                      <option value="hide">非表示</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="font-medium text-ink">背景色</span>
                  <input
                    type="color"
                    value={selectedSlide.backgroundColor}
                    onChange={(event) =>
                      updateSlide(selectedSlide.id, { backgroundColor: event.target.value })
                    }
                    className="mt-2 h-10 w-full rounded-md border border-stone-200 bg-white/85"
                  />
                </label>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-stone-200 bg-white/75 p-3 text-sm text-stone-500">
              プレビュー上の要素をクリックすると編集できます。
            </p>
          )}
        </div>
      </div>
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

function ThemeOptionField({
  config,
  value,
  optionId,
  options,
  onOptionChange,
  onTextChange
}: {
  config: ThemeOptionFieldConfig;
  value: string;
  optionId: string;
  options: ThemeOption[];
  onOptionChange: (optionId: string) => void;
  onTextChange: (value: string) => void;
}) {
  const selectedOption = options.find((option) => option.id === optionId);

  return (
    <div className="rounded-md border border-stone-200 bg-white/55 p-3">
      <SelectSimpleField
        label={`${config.label}：Notion選択肢`}
        value={optionId}
        options={[
          { value: "", label: "選択しない" },
          ...options.map((option) => ({
            value: option.id,
            label: option.name
          }))
        ]}
        onChange={onOptionChange}
      />
      {selectedOption ? (
        <div className="mt-2 rounded-md bg-rose/70 px-3 py-2 text-xs leading-5 text-stone-600">
          {selectedOption.description ? <p>{selectedOption.description}</p> : null}
          {selectedOption.useCase ? <p className="mt-1">使い方: {selectedOption.useCase}</p> : null}
        </div>
      ) : null}
      <div className="mt-3">
        <TextAreaField
          label={`${config.label}：カスタム入力`}
          value={value}
          rows={3}
          onChange={onTextChange}
        />
      </div>
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
