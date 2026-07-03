import { getNotionDatabaseIds, createNotionClient } from "./client";
import {
  dateProperty,
  readDate,
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
    "Target Option": relationProperty(input.targetOptionId ?? input.targetOption?.optionId),
    "Pain Option": relationProperty(input.painOptionId ?? input.painOption?.optionId),
    "Desired Outcome Option": relationProperty(
      input.desiredOutcomeOptionId ?? input.desiredOutcomeOption?.optionId
    ),
    "CTA Option": relationProperty(input.ctaOptionId ?? input.ctaOption?.optionId),
    "Offer Option": relationProperty(input.offerOptionId ?? input.offerOption?.optionId),
    "Angle Option": relationProperty(input.angleOptionId ?? input.angleOption?.optionId),
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
    targetOptionId: readRelationId(properties, "Target Option"),
    painPoint: readRichText(properties, "Pain Point"),
    painOptionId: readRelationId(properties, "Pain Option"),
    desiredOutcome: readRichText(properties, "Desired Outcome"),
    desiredOutcomeOptionId: readRelationId(properties, "Desired Outcome Option"),
    purpose: readSelect(properties, "Purpose") ?? "",
    cta: readRichText(properties, "CTA"),
    ctaOptionId: readRelationId(properties, "CTA Option"),
    offer: readRichText(properties, "Offer"),
    offerOptionId: readRelationId(properties, "Offer Option"),
    angle: readRichText(properties, "Angle"),
    angleOptionId: readRelationId(properties, "Angle Option"),
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
    targetOptionId: input.targetOptionId ?? current.targetOptionId,
    targetOption: input.targetOption ?? current.targetOption,
    painPoint: input.painPoint ?? current.painPoint,
    painOptionId: input.painOptionId ?? current.painOptionId,
    painOption: input.painOption ?? current.painOption,
    desiredOutcome: input.desiredOutcome ?? current.desiredOutcome,
    desiredOutcomeOptionId: input.desiredOutcomeOptionId ?? current.desiredOutcomeOptionId,
    desiredOutcomeOption: input.desiredOutcomeOption ?? current.desiredOutcomeOption,
    purpose: input.purpose ?? current.purpose,
    cta: input.cta ?? current.cta,
    ctaOptionId: input.ctaOptionId ?? current.ctaOptionId,
    ctaOption: input.ctaOption ?? current.ctaOption,
    offer: input.offer ?? current.offer,
    offerOptionId: input.offerOptionId ?? current.offerOptionId,
    offerOption: input.offerOption ?? current.offerOption,
    angle: input.angle ?? current.angle,
    angleOptionId: input.angleOptionId ?? current.angleOptionId,
    angleOption: input.angleOption ?? current.angleOption,
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
