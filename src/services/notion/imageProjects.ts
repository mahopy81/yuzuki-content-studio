import { createNotionClient, getNotionDatabaseIds } from "./client";
import {
  dateProperty,
  numberProperty,
  readDate,
  readNumber,
  readRichText,
  readRelationId,
  readSelect,
  readTitle,
  readUrl,
  relationProperty,
  richTextProperty,
  selectProperty,
  titleProperty,
  urlProperty,
  type NotionPropertyMap
} from "./properties";
import {
  type ImageProject,
  type ImageProjectInput,
  type ImageProjectStatus,
  type ImageProjectType,
  type Platform
} from "@/types/content";

function nowIso() {
  return new Date().toISOString();
}

function getImageProjectsDatabaseId({ optional = false } = {}) {
  const databaseId = getNotionDatabaseIds().imageProjects;

  if (!databaseId && !optional) {
    throw new Error("NOTION_IMAGE_PROJECTS_DB_ID が設定されていません。");
  }

  return databaseId;
}

type ImageProjectJson = {
  themeTitle?: string;
  contentTitle?: string;
  platform?: Platform;
  imageType?: ImageProjectType;
  status?: ImageProjectStatus;
  format?: string;
  prompt?: string;
  negativePrompt?: string;
  referenceUrl?: string;
  outputUrl?: string;
};

function isNotionPageId(value?: string) {
  return Boolean(
    value &&
      (/^[0-9a-f]{32}$/i.test(value) ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
  );
}

function safeRelationProperty(pageId?: string) {
  return relationProperty(isNotionPageId(pageId) ? pageId : undefined);
}

function imagePlatformLabel(input: ImageProjectInput) {
  if (input.imageType === "threads_image") {
    return "Threads Images";
  }

  if (input.imageType === "x_image") {
    return "X Images";
  }

  if (input.imageType === "youtube_thumbnail") {
    return "YouTube Thumbnail";
  }

  if (input.imageType === "youtube_live_thumbnail") {
    return "YouTube Live Thumbnail";
  }

  if (input.imageType === "note_eyecatch") {
    return "note Eyecatch";
  }

  return "Instagram Carousel";
}

function parseSize(input: ImageProjectInput) {
  const sizeMatch = input.format.match(/(\d{3,5})\s*x\s*(\d{3,5})/i);

  if (sizeMatch) {
    return {
      width: Number(sizeMatch[1]),
      height: Number(sizeMatch[2])
    };
  }

  if (input.imageType === "youtube_thumbnail" || input.imageType === "youtube_live_thumbnail") {
    return { width: 1280, height: 720 };
  }

  if (input.imageType === "instagram_reel_cover") {
    return { width: 1080, height: 1920 };
  }

  if (input.imageType === "x_image") {
    return { width: 1200, height: 675 };
  }

  return { width: 1080, height: 1080 };
}

function maxSlidesFor(input: ImageProjectInput) {
  return input.imageType === "instagram_carousel_design" ? 10 : 1;
}

function projectJson(input: ImageProjectInput): string {
  const value: ImageProjectJson = {
    themeTitle: input.themeTitle,
    contentTitle: input.contentTitle,
    platform: input.platform,
    imageType: input.imageType,
    status: input.status,
    format: input.format,
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    referenceUrl: input.referenceUrl,
    outputUrl: input.outputUrl
  };

  return JSON.stringify(value);
}

function parseProjectJson(value: string): ImageProjectJson {
  if (!value.trim()) {
    return {};
  }

  try {
    return JSON.parse(value) as ImageProjectJson;
  } catch {
    return {
      prompt: value
    };
  }
}

function formatFromSize(width?: number, height?: number) {
  return width && height ? `${width}x${height}` : "";
}

function fallbackImageType(label?: string): ImageProjectType {
  if (label === "Threads Images") {
    return "threads_image";
  }

  if (label === "X Images") {
    return "x_image";
  }

  if (label === "YouTube Thumbnail") {
    return "youtube_thumbnail";
  }

  if (label === "YouTube Live Thumbnail") {
    return "youtube_live_thumbnail";
  }

  if (label === "note Eyecatch") {
    return "note_eyecatch";
  }

  return "instagram_carousel_design";
}

function fallbackPlatform(imageType: ImageProjectType): Platform {
  if (imageType === "threads_image") {
    return "threads";
  }

  if (imageType === "x_image") {
    return "x";
  }

  if (imageType === "youtube_thumbnail") {
    return "youtube";
  }

  if (imageType === "youtube_live_thumbnail") {
    return "youtube_live";
  }

  if (imageType === "note_eyecatch") {
    return "note";
  }

  if (imageType === "instagram_reel_cover") {
    return "instagram_reel";
  }

  return "instagram";
}

function imageProjectProperties(input: ImageProjectInput, createdAt?: string): NotionPropertyMap {
  const updatedAt = nowIso();
  const { width, height } = parseSize(input);

  return {
    Name: titleProperty(input.title),
    Theme: safeRelationProperty(input.themeId),
    "Content Item": safeRelationProperty(input.contentItemId),
    "Image Platform": selectProperty(imagePlatformLabel(input)),
    Width: numberProperty(width),
    Height: numberProperty(height),
    "Max Slides": numberProperty(maxSlidesFor(input)),
    "Project JSON": richTextProperty(projectJson(input)),
    "Exported Files": urlProperty(input.outputUrl),
    Memo: richTextProperty(input.memo),
    "Created At": dateProperty(createdAt ?? updatedAt),
    "Updated At": dateProperty(updatedAt)
  };
}

function pageToImageProject(page: { id: string; properties?: unknown }): ImageProject {
  const properties = page.properties;
  const createdAt = readDate(properties, "Created At") ?? nowIso();
  const updatedAt = readDate(properties, "Updated At") ?? createdAt;
  const project = parseProjectJson(readRichText(properties, "Project JSON"));
  const width = readNumber(properties, "Width");
  const height = readNumber(properties, "Height");
  const imageType = project.imageType ?? fallbackImageType(readSelect(properties, "Image Platform"));

  return {
    id: page.id,
    notionPageId: page.id,
    themeId: readRelationId(properties, "Theme"),
    themeTitle: project.themeTitle ?? "",
    contentItemId: readRelationId(properties, "Content Item"),
    contentTitle: project.contentTitle ?? "",
    platform: project.platform ?? fallbackPlatform(imageType),
    imageType,
    title: readTitle(properties, "Name"),
    status: project.status ?? "idea",
    format: project.format ?? formatFromSize(width, height),
    prompt: project.prompt ?? "",
    negativePrompt: project.negativePrompt,
    referenceUrl: project.referenceUrl,
    outputUrl: project.outputUrl ?? readUrl(properties, "Exported Files"),
    memo: readRichText(properties, "Memo"),
    createdAt,
    updatedAt
  };
}

export async function createImageProject(input: ImageProjectInput) {
  const notion = createNotionClient();
  const createdAt = nowIso();
  const page = await notion.pages.create({
    parent: {
      database_id: getImageProjectsDatabaseId()
    },
    properties: imageProjectProperties(input, createdAt)
  });

  return {
    ...input,
    id: page.id,
    notionPageId: page.id,
    createdAt,
    updatedAt: createdAt
  } satisfies ImageProject;
}

export async function updateImageProject(id: string, input: Partial<ImageProjectInput>) {
  const current = await getImageProject(id);
  const merged: ImageProjectInput = {
    userId: input.userId ?? current.userId,
    themeId: input.themeId ?? current.themeId,
    themeTitle: input.themeTitle ?? current.themeTitle,
    contentItemId: input.contentItemId ?? current.contentItemId,
    contentTitle: input.contentTitle ?? current.contentTitle,
    platform: input.platform ?? current.platform,
    imageType: input.imageType ?? current.imageType,
    title: input.title ?? current.title,
    status: input.status ?? current.status,
    format: input.format ?? current.format,
    prompt: input.prompt ?? current.prompt,
    negativePrompt: input.negativePrompt ?? current.negativePrompt,
    referenceUrl: input.referenceUrl ?? current.referenceUrl,
    outputUrl: input.outputUrl ?? current.outputUrl,
    memo: input.memo ?? current.memo
  };

  await createNotionClient().pages.update({
    page_id: id,
    properties: imageProjectProperties(merged, current.createdAt)
  });

  return {
    ...current,
    ...merged,
    updatedAt: nowIso()
  } satisfies ImageProject;
}

export async function deleteImageProject(id: string) {
  await createNotionClient().pages.update({
    page_id: id,
    archived: true
  });
}

export async function getImageProject(id: string) {
  const page = await createNotionClient().pages.retrieve({ page_id: id });
  return pageToImageProject(page as { id: string; properties?: unknown });
}

export async function listImageProjects() {
  const databaseId = getImageProjectsDatabaseId({ optional: true });

  if (!databaseId) {
    return [];
  }

  const response = await createNotionClient().databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: "Updated At",
        direction: "descending"
      }
    ]
  });

  return response.results.map((page) =>
    pageToImageProject(page as { id: string; properties?: unknown })
  );
}
