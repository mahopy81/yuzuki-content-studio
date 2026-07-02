import { getNotionDatabaseIds, createNotionClient } from "./client";
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
  notionLabelFor,
  themeStatusOptions,
  valueFromNotionLabel,
  type Theme,
  type ThemeInput
} from "@/types/content";

function nowIso() {
  return new Date().toISOString();
}

function getThemesDatabaseId() {
  const databaseId = getNotionDatabaseIds().themes;

  if (!databaseId) {
    throw new Error("NOTION_THEMES_DB_ID が設定されていません。");
  }

  return databaseId;
}

function themeProperties(input: ThemeInput, createdAt?: string): NotionPropertyMap {
  const updatedAt = nowIso();

  return {
    Name: titleProperty(input.mainTheme || input.week),
    Week: richTextProperty(input.week),
    "Main Theme": richTextProperty(input.mainTheme),
    "Target Audience": richTextProperty(input.targetAudience),
    "Pain Point": richTextProperty(input.painPoint),
    "Desired Outcome": richTextProperty(input.desiredOutcome),
    Purpose: selectProperty(input.purpose),
    CTA: richTextProperty(input.cta),
    Offer: richTextProperty(input.offer),
    Angle: richTextProperty(input.angle),
    Memo: richTextProperty(input.memo),
    Status: selectProperty(notionLabelFor(themeStatusOptions, input.status)),
    "Created At": dateProperty(createdAt ?? updatedAt),
    "Updated At": dateProperty(updatedAt)
  };
}

function pageToTheme(page: { id: string; properties?: unknown }): Theme {
  const properties = page.properties;
  const createdAt = readDate(properties, "Created At") ?? nowIso();
  const updatedAt = readDate(properties, "Updated At") ?? createdAt;

  return {
    id: page.id,
    notionPageId: page.id,
    week: readRichText(properties, "Week"),
    mainTheme: readRichText(properties, "Main Theme") || readTitle(properties, "Name"),
    targetAudience: readRichText(properties, "Target Audience"),
    painPoint: readRichText(properties, "Pain Point"),
    desiredOutcome: readRichText(properties, "Desired Outcome"),
    purpose: readSelect(properties, "Purpose") ?? "",
    cta: readRichText(properties, "CTA"),
    offer: readRichText(properties, "Offer"),
    angle: readRichText(properties, "Angle"),
    memo: readRichText(properties, "Memo"),
    status: valueFromNotionLabel(themeStatusOptions, readSelect(properties, "Status"), "idea"),
    createdAt,
    updatedAt
  };
}

export async function createTheme(input: ThemeInput) {
  const notion = createNotionClient();
  const createdAt = nowIso();
  const page = await notion.pages.create({
    parent: {
      database_id: getThemesDatabaseId()
    },
    properties: themeProperties(input, createdAt)
  });

  return {
    ...input,
    id: page.id,
    notionPageId: page.id,
    createdAt,
    updatedAt: createdAt
  } satisfies Theme;
}

export async function updateTheme(id: string, input: Partial<ThemeInput>) {
  const current = await getTheme(id);
  const merged: ThemeInput = {
    userId: input.userId ?? current.userId,
    week: input.week ?? current.week,
    mainTheme: input.mainTheme ?? current.mainTheme,
    targetAudience: input.targetAudience ?? current.targetAudience,
    painPoint: input.painPoint ?? current.painPoint,
    desiredOutcome: input.desiredOutcome ?? current.desiredOutcome,
    purpose: input.purpose ?? current.purpose,
    cta: input.cta ?? current.cta,
    offer: input.offer ?? current.offer,
    angle: input.angle ?? current.angle,
    memo: input.memo ?? current.memo,
    status: input.status ?? current.status
  };

  await createNotionClient().pages.update({
    page_id: id,
    properties: themeProperties(merged, current.createdAt)
  });

  return {
    ...current,
    ...merged,
    updatedAt: nowIso()
  } satisfies Theme;
}

export async function deleteTheme(id: string) {
  await createNotionClient().pages.update({
    page_id: id,
    archived: true
  });
}

export async function getTheme(id: string) {
  const page = await createNotionClient().pages.retrieve({ page_id: id });
  return pageToTheme(page as { id: string; properties?: unknown });
}

export async function listThemes() {
  const response = await createNotionClient().databases.query({
    database_id: getThemesDatabaseId(),
    sorts: [
      {
        property: "Updated At",
        direction: "descending"
      }
    ]
  });

  return response.results.map((page) => pageToTheme(page as { id: string; properties?: unknown }));
}
