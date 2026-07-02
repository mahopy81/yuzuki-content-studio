import { createNotionClient, getNotionDatabaseIds } from "./client";
import {
  dateProperty,
  multiSelectProperty,
  readDate,
  readMultiSelect,
  readRelationId,
  readRichText,
  readSelect,
  readTitle,
  relationProperty,
  richTextProperty,
  selectProperty,
  titleProperty,
  type NotionPropertyMap
} from "./properties";
import {
  contentStatusOptions,
  contentTypeOptions,
  notionLabelFor,
  platformOptions,
  valueFromNotionLabel,
  type ContentItem,
  type ContentItemInput
} from "@/types/content";

function nowIso() {
  return new Date().toISOString();
}

function getContentDatabaseId() {
  const databaseId = getNotionDatabaseIds().contentItems;

  if (!databaseId) {
    throw new Error("NOTION_CONTENT_DB_ID が設定されていません。");
  }

  return databaseId;
}

function contentItemProperties(input: ContentItemInput, createdAt?: string): NotionPropertyMap {
  const updatedAt = nowIso();

  return {
    Name: titleProperty(input.title),
    Theme: relationProperty(input.themeNotionPageId),
    Platform: selectProperty(notionLabelFor(platformOptions, input.platform)),
    "Content Type": selectProperty(notionLabelFor(contentTypeOptions, input.contentType)),
    Status: selectProperty(notionLabelFor(contentStatusOptions, input.status)),
    "Scheduled Date": dateProperty(input.scheduledDate),
    "Published Date": dateProperty(input.publishedDate),
    CTA: richTextProperty(input.cta),
    Body: richTextProperty(input.body),
    Caption: richTextProperty(input.caption),
    Script: richTextProperty(input.script),
    Article: richTextProperty(input.article),
    Hashtags: multiSelectProperty(input.hashtags),
    "Image Project ID": richTextProperty(input.imageProjectId),
    Memo: richTextProperty(input.memo),
    "Created At": dateProperty(createdAt ?? updatedAt),
    "Updated At": dateProperty(updatedAt)
  };
}

function pageToContentItem(page: { id: string; properties?: unknown }): ContentItem {
  const properties = page.properties;
  const createdAt = readDate(properties, "Created At") ?? nowIso();
  const updatedAt = readDate(properties, "Updated At") ?? createdAt;
  const themeNotionPageId = readRelationId(properties, "Theme");

  return {
    id: page.id,
    notionPageId: page.id,
    themeId: themeNotionPageId ?? "",
    themeNotionPageId,
    platform: valueFromNotionLabel(platformOptions, readSelect(properties, "Platform"), "instagram"),
    contentType: valueFromNotionLabel(
      contentTypeOptions,
      readSelect(properties, "Content Type"),
      "instagram_carousel"
    ),
    title: readTitle(properties, "Name"),
    status: valueFromNotionLabel(contentStatusOptions, readSelect(properties, "Status"), "idea"),
    scheduledDate: readDate(properties, "Scheduled Date"),
    publishedDate: readDate(properties, "Published Date"),
    cta: readRichText(properties, "CTA"),
    body: readRichText(properties, "Body"),
    caption: readRichText(properties, "Caption"),
    script: readRichText(properties, "Script"),
    article: readRichText(properties, "Article"),
    hashtags: readMultiSelect(properties, "Hashtags"),
    imageProjectId: readRichText(properties, "Image Project ID"),
    memo: readRichText(properties, "Memo"),
    createdAt,
    updatedAt
  };
}

export async function createContentItem(input: ContentItemInput) {
  const notion = createNotionClient();
  const createdAt = nowIso();
  const page = await notion.pages.create({
    parent: {
      database_id: getContentDatabaseId()
    },
    properties: contentItemProperties(input, createdAt)
  });

  return {
    ...input,
    id: page.id,
    notionPageId: page.id,
    createdAt,
    updatedAt: createdAt
  } satisfies ContentItem;
}

export async function updateContentItem(id: string, input: Partial<ContentItemInput>) {
  const current = await getContentItem(id);
  const merged: ContentItemInput = {
    userId: input.userId ?? current.userId,
    themeId: input.themeId ?? current.themeId,
    themeNotionPageId: input.themeNotionPageId ?? current.themeNotionPageId,
    platform: input.platform ?? current.platform,
    contentType: input.contentType ?? current.contentType,
    title: input.title ?? current.title,
    status: input.status ?? current.status,
    scheduledDate: input.scheduledDate ?? current.scheduledDate,
    publishedDate: input.publishedDate ?? current.publishedDate,
    cta: input.cta ?? current.cta,
    body: input.body ?? current.body,
    caption: input.caption ?? current.caption,
    script: input.script ?? current.script,
    article: input.article ?? current.article,
    hashtags: input.hashtags ?? current.hashtags,
    imageProjectId: input.imageProjectId ?? current.imageProjectId,
    memo: input.memo ?? current.memo
  };

  await createNotionClient().pages.update({
    page_id: id,
    properties: contentItemProperties(merged, current.createdAt)
  });

  return {
    ...current,
    ...merged,
    updatedAt: nowIso()
  } satisfies ContentItem;
}

export async function deleteContentItem(id: string) {
  await createNotionClient().pages.update({
    page_id: id,
    archived: true
  });
}

export async function getContentItem(id: string) {
  const page = await createNotionClient().pages.retrieve({ page_id: id });
  return pageToContentItem(page as { id: string; properties?: unknown });
}

export async function listContentItems() {
  const response = await createNotionClient().databases.query({
    database_id: getContentDatabaseId(),
    sorts: [
      {
        property: "Updated At",
        direction: "descending"
      }
    ]
  });

  return response.results.map((page) =>
    pageToContentItem(page as { id: string; properties?: unknown })
  );
}

export async function listContentItemsByTheme(themeId: string) {
  const response = await createNotionClient().databases.query({
    database_id: getContentDatabaseId(),
    filter: {
      property: "Theme",
      relation: {
        contains: themeId
      }
    },
    sorts: [
      {
        property: "Updated At",
        direction: "descending"
      }
    ]
  });

  return response.results.map((page) =>
    pageToContentItem(page as { id: string; properties?: unknown })
  );
}
