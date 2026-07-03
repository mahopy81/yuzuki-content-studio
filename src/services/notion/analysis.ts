import { createNotionClient, getNotionDatabaseIds } from "./client";
import {
  dateProperty,
  numberProperty,
  readDate,
  readNumber,
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
  platformOptions,
  valueFromNotionLabel,
  type Analysis,
  type AnalysisInput
} from "@/types/content";

function nowIso() {
  return new Date().toISOString();
}

function getAnalysisDatabaseId() {
  const databaseId = getNotionDatabaseIds().analysis;

  if (!databaseId) {
    throw new Error("NOTION_ANALYSIS_DB_ID is not set.");
  }

  return databaseId;
}

function analysisName(input: AnalysisInput) {
  return `${input.contentTitle || "Content"} Analysis`;
}

function analysisProperties(input: AnalysisInput, createdAt?: string): NotionPropertyMap {
  const updatedAt = nowIso();

  return {
    Name: titleProperty(analysisName(input)),
    "Content Item": relationProperty(input.contentItemId),
    Platform: selectProperty(notionLabelFor(platformOptions, input.platform)),
    Impressions: numberProperty(input.impressions),
    Reach: numberProperty(input.reach),
    Views: numberProperty(input.views),
    "Average View Duration": numberProperty(input.averageViewDuration),
    "Live Peak Viewers": numberProperty(input.livePeakViewers),
    "Live Chat Count": numberProperty(input.liveChatCount),
    Likes: numberProperty(input.likes),
    Comments: numberProperty(input.comments),
    Saves: numberProperty(input.saves),
    Shares: numberProperty(input.shares),
    Follows: numberProperty(input.follows),
    "Profile Access": numberProperty(input.profileAccess),
    "Link Clicks": numberProperty(input.linkClicks),
    "LINE Registrations": numberProperty(input.lineRegistrations),
    Conversions: numberProperty(input.conversions),
    "Save Rate": numberProperty(input.saveRate),
    "Engagement Rate": numberProperty(input.engagementRate),
    "Follow Conversion Rate": numberProperty(input.followConversionRate),
    "LINE Registration Rate": numberProperty(input.lineRegistrationRate),
    "Good Point": richTextProperty(input.goodPoint),
    "Improvement Point": richTextProperty(input.improvementPoint),
    "Next Action": richTextProperty(input.nextAction),
    "Analyzed At": dateProperty(input.analyzedAt),
    "Created At": dateProperty(createdAt ?? updatedAt),
    "Updated At": dateProperty(updatedAt)
  };
}

function pageToAnalysis(page: { id: string; properties?: unknown }): Analysis {
  const properties = page.properties;
  const createdAt = readDate(properties, "Created At") ?? nowIso();
  const updatedAt = readDate(properties, "Updated At") ?? createdAt;
  const contentItemId = readRelationId(properties, "Content Item") ?? "";

  return {
    id: page.id,
    notionPageId: page.id,
    contentItemId,
    contentTitle: readTitle(properties, "Name").replace(/ Analysis$/, ""),
    platform: valueFromNotionLabel(platformOptions, readSelect(properties, "Platform"), "instagram"),
    impressions: readNumber(properties, "Impressions"),
    reach: readNumber(properties, "Reach"),
    views: readNumber(properties, "Views"),
    averageViewDuration: readNumber(properties, "Average View Duration"),
    livePeakViewers: readNumber(properties, "Live Peak Viewers"),
    liveChatCount: readNumber(properties, "Live Chat Count"),
    likes: readNumber(properties, "Likes"),
    comments: readNumber(properties, "Comments"),
    saves: readNumber(properties, "Saves"),
    shares: readNumber(properties, "Shares"),
    follows: readNumber(properties, "Follows"),
    profileAccess: readNumber(properties, "Profile Access"),
    linkClicks: readNumber(properties, "Link Clicks"),
    lineRegistrations: readNumber(properties, "LINE Registrations"),
    conversions: readNumber(properties, "Conversions"),
    saveRate: readNumber(properties, "Save Rate"),
    engagementRate: readNumber(properties, "Engagement Rate"),
    followConversionRate: readNumber(properties, "Follow Conversion Rate"),
    lineRegistrationRate: readNumber(properties, "LINE Registration Rate"),
    goodPoint: readRichText(properties, "Good Point"),
    improvementPoint: readRichText(properties, "Improvement Point"),
    nextAction: readRichText(properties, "Next Action"),
    analyzedAt: readDate(properties, "Analyzed At"),
    createdAt,
    updatedAt
  };
}

export async function createAnalysis(input: AnalysisInput) {
  const notion = createNotionClient();
  const createdAt = nowIso();
  const page = await notion.pages.create({
    parent: {
      database_id: getAnalysisDatabaseId()
    },
    properties: analysisProperties(input, createdAt)
  });

  return {
    ...input,
    id: page.id,
    notionPageId: page.id,
    createdAt,
    updatedAt: createdAt
  } satisfies Analysis;
}

export async function updateAnalysis(id: string, input: Partial<AnalysisInput>) {
  const current = await getAnalysis(id);
  const merged: AnalysisInput = {
    userId: input.userId ?? current.userId,
    contentItemId: input.contentItemId ?? current.contentItemId,
    contentTitle: input.contentTitle ?? current.contentTitle,
    platform: input.platform ?? current.platform,
    impressions: input.impressions ?? current.impressions,
    reach: input.reach ?? current.reach,
    views: input.views ?? current.views,
    averageViewDuration: input.averageViewDuration ?? current.averageViewDuration,
    livePeakViewers: input.livePeakViewers ?? current.livePeakViewers,
    liveChatCount: input.liveChatCount ?? current.liveChatCount,
    likes: input.likes ?? current.likes,
    comments: input.comments ?? current.comments,
    saves: input.saves ?? current.saves,
    shares: input.shares ?? current.shares,
    follows: input.follows ?? current.follows,
    profileAccess: input.profileAccess ?? current.profileAccess,
    linkClicks: input.linkClicks ?? current.linkClicks,
    lineRegistrations: input.lineRegistrations ?? current.lineRegistrations,
    conversions: input.conversions ?? current.conversions,
    saveRate: input.saveRate ?? current.saveRate,
    engagementRate: input.engagementRate ?? current.engagementRate,
    followConversionRate: input.followConversionRate ?? current.followConversionRate,
    lineRegistrationRate: input.lineRegistrationRate ?? current.lineRegistrationRate,
    goodPoint: input.goodPoint ?? current.goodPoint,
    improvementPoint: input.improvementPoint ?? current.improvementPoint,
    nextAction: input.nextAction ?? current.nextAction,
    analyzedAt: input.analyzedAt ?? current.analyzedAt
  };

  await createNotionClient().pages.update({
    page_id: id,
    properties: analysisProperties(merged, current.createdAt)
  });

  return {
    ...current,
    ...merged,
    updatedAt: nowIso()
  } satisfies Analysis;
}

export async function deleteAnalysis(id: string) {
  await createNotionClient().pages.update({
    page_id: id,
    archived: true
  });
}

export async function getAnalysis(id: string) {
  const page = await createNotionClient().pages.retrieve({ page_id: id });
  return pageToAnalysis(page as { id: string; properties?: unknown });
}

export async function listAnalysis() {
  const response = await createNotionClient().databases.query({
    database_id: getAnalysisDatabaseId(),
    sorts: [
      {
        property: "Updated At",
        direction: "descending"
      }
    ]
  });

  return response.results.map((page) => pageToAnalysis(page as { id: string; properties?: unknown }));
}
