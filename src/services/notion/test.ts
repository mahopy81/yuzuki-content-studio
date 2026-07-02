import { createNotionClient, getNotionDatabaseIds } from "./client";

export async function testNotionConnection() {
  const notion = createNotionClient();
  const databaseIds = getNotionDatabaseIds();

  const configuredDatabaseIds = Object.entries(databaseIds).filter(([, value]) => Boolean(value));
  const user = await notion.users.me({});
  const databaseChecks = await Promise.all(
    configuredDatabaseIds.map(async ([name, databaseId]) => {
      try {
        await notion.databases.retrieve({ database_id: databaseId });
        return { name, databaseId, ok: true };
      } catch (error) {
        return {
          name,
          databaseId,
          ok: false,
          message: error instanceof Error ? error.message : "接続確認に失敗しました。"
        };
      }
    })
  );

  return {
    ok: true,
    botName: "name" in user ? user.name : null,
    checkedAt: new Date().toISOString(),
    databases: databaseChecks
  };
}
