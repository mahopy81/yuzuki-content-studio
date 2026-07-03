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

export type ImageProjectType =
  | "instagram_carousel_design"
  | "instagram_reel_cover"
  | "youtube_thumbnail"
  | "youtube_live_thumbnail"
  | "note_eyecatch"
  | "threads_image"
  | "x_image";

export type ImageProjectStatus =
  | "idea"
  | "prompt_ready"
  | "generating"
  | "review"
  | "approved"
  | "published"
  | "rejected";

export type ImagePlatform = "instagram_carousel" | "x_images" | "threads_images";

export type OutputPreset = {
  platform: ImagePlatform;
  width: number;
  height: number;
  maxSlides: number;
};

export type SlideElementType = "text" | "image" | "shape" | "cta";

export type SlideTemplateType =
  | "cover"
  | "problem"
  | "deep_pain"
  | "reason"
  | "solution"
  | "steps"
  | "example"
  | "mistake"
  | "summary"
  | "cta";

export type SlideElement = {
  id: string;
  type: SlideElementType;
  name: string;
  visible: boolean;
  content?: string;
  src?: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  zIndex: number;
};

export type Slide = {
  id: string;
  templateType: SlideTemplateType;
  title: string;
  backgroundColor: string;
  backgroundImage?: string;
  colorTheme: string;
  elements: SlideElement[];
};

export type LiveStreamType =
  | "work_with_me"
  | "chat"
  | "ai_explainer"
  | "freelance_consulting"
  | "study"
  | "vtuber_project"
  | "qa"
  | "roadmap";

export type YouTubeLiveSection = {
  title: string;
  estimatedMinutes: number;
  talkingPoints: string[];
  script: string;
};

export type YouTubeLivePlan = {
  title: string;
  liveStreamType: LiveStreamType;
  thumbnailText: string;
  theme: string;
  purpose: string;
  targetAudience: string;
  scheduledDate?: string;
  startTime?: string;
  estimatedDurationMinutes: number;
  openingGreeting: string;
  openingHook: string;
  outline: string[];
  sections: YouTubeLiveSection[];
  chatTopics: string[];
  commentPickupPoints: string[];
  questionsForViewers: string[];
  interactiveIdeas: string[];
  workContent?: string;
  explanationItems?: string[];
  announcement: string;
  cta: string;
  endingScript: string;
  clipIdeas: string[];
  repurposeIdeas: string[];
};

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

export type ImageProject = {
  id: string;
  notionPageId?: string;
  userId?: string;
  themeId?: string;
  themeTitle?: string;
  contentItemId?: string;
  contentTitle?: string;
  platform: Platform;
  imageType: ImageProjectType;
  title: string;
  status: ImageProjectStatus;
  format: string;
  prompt: string;
  negativePrompt?: string;
  referenceUrl?: string;
  outputUrl?: string;
  imagePlatform?: ImagePlatform;
  outputPreset?: OutputPreset;
  slides?: Slide[];
  colorTheme?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

export type ThemeInput = Omit<Theme, "id" | "notionPageId" | "createdAt" | "updatedAt">;

export type ContentItemInput = Omit<ContentItem, "id" | "notionPageId" | "createdAt" | "updatedAt">;

export type ImageProjectInput = Omit<ImageProject, "id" | "notionPageId" | "createdAt" | "updatedAt">;

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

export const imageProjectTypeOptions: SelectOption<ImageProjectType>[] = [
  {
    value: "instagram_carousel_design",
    label: "Instagramカルーセル画像",
    notionLabel: "Instagram Carousel Design"
  },
  { value: "instagram_reel_cover", label: "Instagramリール表紙", notionLabel: "Instagram Reel Cover" },
  { value: "youtube_thumbnail", label: "YouTubeサムネ", notionLabel: "YouTube Thumbnail" },
  {
    value: "youtube_live_thumbnail",
    label: "YouTubeライブサムネ",
    notionLabel: "YouTube Live Thumbnail"
  },
  { value: "note_eyecatch", label: "noteアイキャッチ", notionLabel: "note Eyecatch" },
  { value: "threads_image", label: "Threads画像", notionLabel: "Threads Image" },
  { value: "x_image", label: "X画像", notionLabel: "X Image" }
];

export const imageProjectStatusOptions: SelectOption<ImageProjectStatus>[] = [
  { value: "idea", label: "アイデア", notionLabel: "Idea" },
  { value: "prompt_ready", label: "プロンプト準備済み", notionLabel: "Prompt Ready" },
  { value: "generating", label: "生成中", notionLabel: "Generating" },
  { value: "review", label: "確認待ち", notionLabel: "Review" },
  { value: "approved", label: "採用", notionLabel: "Approved" },
  { value: "published", label: "投稿済み", notionLabel: "Published" },
  { value: "rejected", label: "ボツ", notionLabel: "Rejected" }
];

export const outputPresets: OutputPreset[] = [
  { platform: "instagram_carousel", width: 1080, height: 1080, maxSlides: 10 },
  { platform: "x_images", width: 1600, height: 900, maxSlides: 4 },
  { platform: "threads_images", width: 1080, height: 1350, maxSlides: 4 }
];

export const imagePlatformOptions: SelectOption<ImagePlatform>[] = [
  { value: "instagram_carousel", label: "Instagramカルーセル", notionLabel: "Instagram Carousel" },
  { value: "x_images", label: "X画像", notionLabel: "X Images" },
  { value: "threads_images", label: "Threads画像", notionLabel: "Threads Images" }
];

export const slideTemplateOptions: SelectOption<SlideTemplateType>[] = [
  { value: "cover", label: "表紙", notionLabel: "Cover" },
  { value: "problem", label: "共感・問題提起", notionLabel: "Problem" },
  { value: "deep_pain", label: "悩みの深掘り", notionLabel: "Deep Pain" },
  { value: "reason", label: "原因・理由", notionLabel: "Reason" },
  { value: "solution", label: "解決策", notionLabel: "Solution" },
  { value: "steps", label: "3ステップ解説", notionLabel: "Steps" },
  { value: "example", label: "具体例", notionLabel: "Example" },
  { value: "mistake", label: "よくある失敗", notionLabel: "Mistake" },
  { value: "summary", label: "まとめ", notionLabel: "Summary" },
  { value: "cta", label: "CTA", notionLabel: "CTA" }
];

export const colorThemeOptions = [
  {
    value: "korean_pink",
    label: "Korean Pink",
    backgroundColor: "#fff4f6",
    textColor: "#2f2a2a",
    accentColor: "#d7ad68",
    ctaColor: "#f4c9d4"
  },
  {
    value: "minimal_white",
    label: "Minimal White",
    backgroundColor: "#ffffff",
    textColor: "#222222",
    accentColor: "#d8d8d8",
    ctaColor: "#f3f3f3"
  },
  {
    value: "soft_purple",
    label: "Soft Purple",
    backgroundColor: "#f6f0ff",
    textColor: "#31263f",
    accentColor: "#c9a7ef",
    ctaColor: "#eadcff"
  },
  {
    value: "cafe_beige",
    label: "Cafe Beige",
    backgroundColor: "#f7efe3",
    textColor: "#3b2f2a",
    accentColor: "#b58b5b",
    ctaColor: "#ead7bd"
  },
  {
    value: "clean_blue",
    label: "Clean Blue",
    backgroundColor: "#eef7ff",
    textColor: "#1f3147",
    accentColor: "#8eb8df",
    ctaColor: "#d7ebff"
  }
];

export const ctaTemplates = [
  "保存してあとで見返す",
  "詳しくはプロフィールへ",
  "LINEで無料ロードマップ配布中",
  "ワークショップで一緒に整理しよう",
  "コメントで「AI」と送ってね",
  "noteで詳しく解説しています",
  "無料相談はプロフィールから",
  "迷ったらまず保存",
  "ライブで一緒に作業しよう",
  "次回の配信も見に来てね"
];

export const liveStreamTypeOptions: SelectOption<LiveStreamType>[] = [
  { value: "work_with_me", label: "作業配信", notionLabel: "Work With Me" },
  { value: "chat", label: "雑談配信", notionLabel: "Chat" },
  { value: "ai_explainer", label: "AI解説配信", notionLabel: "AI Explainer" },
  { value: "freelance_consulting", label: "フリーランス相談配信", notionLabel: "Freelance Consulting" },
  { value: "study", label: "勉強配信", notionLabel: "Study" },
  { value: "vtuber_project", label: "Vtuber企画配信", notionLabel: "Vtuber Project" },
  { value: "qa", label: "Q&A配信", notionLabel: "Q&A" },
  { value: "roadmap", label: "ロードマップ解説配信", notionLabel: "Roadmap" }
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
