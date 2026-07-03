import { createNotionClient, getNotionDatabaseIds } from "./client";
import {
  readCheckbox,
  readDate,
  readNumber,
  readRichText,
  readSelect,
  readTitle
} from "./properties";
import {
  themeOptionCategories,
  type ThemeOption,
  type ThemeOptionCategory,
  type ThemeOptionGroups
} from "@/types/content";

function getThemeOptionsDatabaseId() {
  const databaseId = getNotionDatabaseIds().themeOptions;

  if (!databaseId) {
    throw new Error("NOTION_THEME_OPTIONS_DB_ID is not configured.");
  }

  return databaseId;
}

function emptyThemeOptionGroups(): ThemeOptionGroups {
  return themeOptionCategories.reduce((groups, category) => {
    groups[category] = [];
    return groups;
  }, {} as ThemeOptionGroups);
}

function isThemeOptionCategory(value?: string): value is ThemeOptionCategory {
  return themeOptionCategories.includes(value as ThemeOptionCategory);
}

function pageToThemeOption(page: { id: string; properties?: unknown }): ThemeOption | undefined {
  const properties = page.properties;
  const category = readSelect(properties, "Category");

  if (!isThemeOptionCategory(category)) {
    return undefined;
  }

  return {
    id: page.id,
    notionPageId: page.id,
    name: readTitle(properties, "Name"),
    category,
    description: readRichText(properties, "Description"),
    promptSnippet: readRichText(properties, "Prompt Snippet"),
    useCase: readRichText(properties, "Use Case"),
    priority: readNumber(properties, "Priority"),
    active: readCheckbox(properties, "Active"),
    createdAt: readDate(properties, "Created At"),
    updatedAt: readDate(properties, "Updated At")
  };
}

export async function listThemeOptions() {
  const response = await createNotionClient().databases.query({
    database_id: getThemeOptionsDatabaseId(),
    filter: {
      property: "Active",
      checkbox: {
        equals: true
      }
    },
    sorts: [
      {
        property: "Priority",
        direction: "ascending"
      }
    ]
  });

  return response.results
    .map((page) => pageToThemeOption(page as { id: string; properties?: unknown }))
    .filter((option): option is ThemeOption => Boolean(option));
}

export async function listThemeOptionsByCategory(category: ThemeOptionCategory) {
  const response = await createNotionClient().databases.query({
    database_id: getThemeOptionsDatabaseId(),
    filter: {
      and: [
        {
          property: "Active",
          checkbox: {
            equals: true
          }
        },
        {
          property: "Category",
          select: {
            equals: category
          }
        }
      ]
    },
    sorts: [
      {
        property: "Priority",
        direction: "ascending"
      }
    ]
  });

  return response.results
    .map((page) => pageToThemeOption(page as { id: string; properties?: unknown }))
    .filter((option): option is ThemeOption => Boolean(option));
}

export async function getActiveThemeOptionsGroupedByCategory() {
  const groups = emptyThemeOptionGroups();
  const options = await listThemeOptions();

  for (const option of options) {
    groups[option.category].push(option);
  }

  return groups;
}
