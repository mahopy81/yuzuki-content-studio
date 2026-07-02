export type Platform =
  | "instagram"
  | "instagram_reel"
  | "youtube"
  | "youtube_live"
  | "note"
  | "threads"
  | "x";

export type ThemeStatus = "idea" | "active" | "completed" | "archived";

export type ContentStatus =
  | "idea"
  | "generated"
  | "drafting"
  | "review"
  | "revision"
  | "scheduled"
  | "published"
  | "analyzed"
  | "rejected";

export type ContentType =
  | "instagram_carousel"
  | "instagram_caption"
  | "instagram_reel_script"
  | "youtube_script"
  | "youtube_live_plan"
  | "note_article"
  | "threads_post"
  | "x_post";

export type Theme = {
  id: string;
  notionPageId?: string;
  userId?: string;
  week: string;
  mainTheme: string;
  targetAudience: string;
  painPoint: string;
  desiredOutcome: string;
  purpose: string;
  cta: string;
  offer?: string;
  angle: string;
  memo?: string;
  status: ThemeStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContentItem = {
  id: string;
  notionPageId?: string;
  userId?: string;
  themeId: string;
  themeNotionPageId?: string;
  platform: Platform;
  contentType: ContentType;
  title: string;
  status: ContentStatus;
  scheduledDate?: string;
  publishedDate?: string;
  cta?: string;
  body?: string;
  caption?: string;
  script?: string;
  article?: string;
  hashtags?: string[];
  imageProjectId?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

export type ThemeInput = Omit<Theme, "id" | "notionPageId" | "createdAt" | "updatedAt">;

export type ContentItemInput = Omit<ContentItem, "id" | "notionPageId" | "createdAt" | "updatedAt">;

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  notionLabel: string;
};

export const themeStatusOptions: SelectOption<ThemeStatus>[] = [
  { value: "idea", label: "アイデア", notionLabel: "Idea" },
  { value: "active", label: "進行中", notionLabel: "Active" },
  { value: "completed", label: "完了", notionLabel: "Completed" },
  { value: "archived", label: "保管", notionLabel: "Archived" }
];

export const purposeOptions = [
  "LINE登録",
  "ワークショップ誘導",
  "note誘導",
  "コミュニティ誘導",
  "スクール販売",
  "認知拡大",
  "信頼構築"
];

export const platformOptions: SelectOption<Platform>[] = [
  { value: "instagram", label: "Instagram", notionLabel: "Instagram" },
  { value: "instagram_reel", label: "Instagramリール", notionLabel: "Instagram Reel" },
  { value: "youtube", label: "YouTube横動画", notionLabel: "YouTube" },
  { value: "youtube_live", label: "YouTubeライブ", notionLabel: "YouTube Live" },
  { value: "note", label: "note", notionLabel: "note" },
  { value: "threads", label: "Threads", notionLabel: "Threads" },
  { value: "x", label: "X", notionLabel: "X" }
];

export const contentTypeOptions: SelectOption<ContentType>[] = [
  { value: "instagram_carousel", label: "Instagramカルーセル", notionLabel: "Instagram Carousel" },
  { value: "instagram_caption", label: "Instagramキャプション", notionLabel: "Instagram Caption" },
  { value: "instagram_reel_script", label: "Instagramリール台本", notionLabel: "Instagram Reel Script" },
  { value: "youtube_script", label: "YouTube横動画台本", notionLabel: "YouTube Script" },
  { value: "youtube_live_plan", label: "YouTubeライブ企画・台本", notionLabel: "YouTube Live Plan" },
  { value: "note_article", label: "note記事", notionLabel: "note Article" },
  { value: "threads_post", label: "Threads投稿案", notionLabel: "Threads Post" },
  { value: "x_post", label: "X投稿案", notionLabel: "X Post" }
];

export const contentStatusOptions: SelectOption<ContentStatus>[] = [
  { value: "idea", label: "アイデア", notionLabel: "Idea" },
  { value: "generated", label: "生成済み", notionLabel: "Generated" },
  { value: "drafting", label: "下書き中", notionLabel: "Drafting" },
  { value: "review", label: "確認待ち", notionLabel: "Review" },
  { value: "revision", label: "修正中", notionLabel: "Revision" },
  { value: "scheduled", label: "予約済み", notionLabel: "Scheduled" },
  { value: "published", label: "投稿済み", notionLabel: "Published" },
  { value: "analyzed", label: "分析済み", notionLabel: "Analyzed" },
  { value: "rejected", label: "ボツ", notionLabel: "Rejected" }
];

export function labelFor<T extends string>(options: SelectOption<T>[], value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function notionLabelFor<T extends string>(options: SelectOption<T>[], value: T) {
  return options.find((option) => option.value === value)?.notionLabel ?? value;
}

export function valueFromNotionLabel<T extends string>(
  options: SelectOption<T>[],
  notionLabel: string | undefined,
  fallback: T
) {
  return options.find((option) => option.notionLabel === notionLabel)?.value ?? fallback;
}
