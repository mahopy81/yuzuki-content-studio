import { createNotionClient, getNotionDatabaseIds } from "./client";
import {
  dateProperty,
  readDate,
  readRichText,
  readSelect,
  readTitle,
  richTextProperty,
  selectProperty,
  titleProperty,
  type NotionPropertyMap
} from "./properties";
import {
  imageProjectStatusOptions,
  imageProjectTypeOptions,
  notionLabelFor,
  platformOptions,
  valueFromNotionLabel,
  type ImageProject,
  type ImageProjectInput
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

function imageProjectProperties(input: ImageProjectInput, createdAt?: string): NotionPropertyMap {
  const updatedAt = nowIso();

  return {
    Name: titleProperty(input.title),
    "Theme ID": richTextProperty(input.themeId),
    "Theme Title": richTextProperty(input.themeTitle),
    "Content Item ID": richTextProperty(input.contentItemId),
    "Content Title": richTextProperty(input.contentTitle),
    Platform: selectProperty(notionLabelFor(platformOptions, input.platform)),
    "Image Type": selectProperty(notionLabelFor(imageProjectTypeOptions, input.imageType)),
    Status: selectProperty(notionLabelFor(imageProjectStatusOptions, input.status)),
    Format: richTextProperty(input.format),
    Prompt: richTextProperty(input.prompt),
    "Negative Prompt": richTextProperty(input.negativePrompt),
    "Reference URL": richTextProperty(input.referenceUrl),
    "Output URL": richTextProperty(input.outputUrl),
    Memo: richTextProperty(input.memo),
    "Created At": dateProperty(createdAt ?? updatedAt),
    "Updated At": dateProperty(updatedAt)
  };
}

function pageToImageProject(page: { id: string; properties?: unknown }): ImageProject {
  const properties = page.properties;
  const createdAt = readDate(properties, "Created At") ?? nowIso();
  const updatedAt = readDate(properties, "Updated At") ?? createdAt;

  return {
    id: page.id,
    notionPageId: page.id,
    themeId: readRichText(properties, "Theme ID"),
    themeTitle: readRichText(properties, "Theme Title"),
    contentItemId: readRichText(properties, "Content Item ID"),
    contentTitle: readRichText(properties, "Content Title"),
    platform: valueFromNotionLabel(platformOptions, readSelect(properties, "Platform"), "instagram"),
    imageType: valueFromNotionLabel(
      imageProjectTypeOptions,
      readSelect(properties, "Image Type"),
      "instagram_carousel_design"
    ),
    title: readTitle(properties, "Name"),
    status: valueFromNotionLabel(imageProjectStatusOptions, readSelect(properties, "Status"), "idea"),
    format: readRichText(properties, "Format"),
    prompt: readRichText(properties, "Prompt"),
    negativePrompt: readRichText(properties, "Negative Prompt"),
    referenceUrl: readRichText(properties, "Reference URL"),
    outputUrl: readRichText(properties, "Output URL"),
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
