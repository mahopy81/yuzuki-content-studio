import { NextResponse } from "next/server";
import { testNotionConnection } from "@/services/notion/test";

export async function GET() {
  try {
    const result = await testNotionConnection();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Notion接続テストに失敗しました。"
      },
      { status: 500 }
    );
  }
}
