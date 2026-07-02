import { Client } from "@notionhq/client";
import { requireEnv } from "@/lib/env";

export function createNotionClient() {
  return new Client({
    auth: requireEnv("NOTION_TOKEN")
  });
}

export function getNotionDatabaseIds() {
  return {
    themes: process.env.NOTION_THEMES_DB_ID ?? "",
    contentItems: process.env.NOTION_CONTENT_DB_ID ?? "",
    imageProjects: process.env.NOTION_IMAGE_PROJECTS_DB_ID ?? "",
    analysis: process.env.NOTION_ANALYSIS_DB_ID ?? "",
    assets: process.env.NOTION_ASSETS_DB_ID ?? "",
    promptTemplates: process.env.NOTION_PROMPT_TEMPLATES_DB_ID ?? ""
  };
}
