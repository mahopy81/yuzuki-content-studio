import { generateMockContentSet } from "./mockContent";
import type { GeneratedContentSet, GenerateContentInput } from "./types";

const defaultAnthropicModel = "claude-opus-4-8";

type GenerateContentResult = {
  data: GeneratedContentSet;
  source: "claude" | "mock";
};

type AnthropicContentBlock = {
  type?: string;
  text?: string;
  name?: string;
  input?: unknown;
};

const contentSetTool = {
  name: "create_content_set",
  description: "Create the full Yuzuki Content Studio SNS content set.",
  input_schema: {
    type: "object",
    additionalProperties: true,
    required: [
      "themeId",
      "instagramCarousel",
      "instagramCaption",
      "instagramReel",
      "youtube",
      "youtubeLives",
      "note",
      "threads",
      "x"
    ],
    properties: {
      themeId: { type: "string" },
      instagramCarousel: { type: "object", additionalProperties: true },
      instagramCaption: { type: "object", additionalProperties: true },
      instagramReel: { type: "object", additionalProperties: true },
      youtube: { type: "object", additionalProperties: true },
      youtubeLives: { type: "array", items: { type: "object", additionalProperties: true } },
      note: { type: "object", additionalProperties: true },
      threads: { type: "object", additionalProperties: true },
      x: { type: "object", additionalProperties: true }
    }
  }
};

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function isGeneratedContentSet(value: unknown): value is GeneratedContentSet {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<GeneratedContentSet>;
  return Boolean(
    record.instagramCarousel &&
      record.instagramCaption &&
      record.instagramReel &&
      record.youtube &&
      record.youtubeLives &&
      record.note &&
      record.threads &&
      record.x
  );
}

function buildPrompt({ theme }: GenerateContentInput) {
  return `
Yuzuki Content Studio用にSNS投稿セットを作ってください。
必ずJSONだけを返してください。説明文、Markdown、コードフェンスは禁止です。

テーマ:
- mainTheme: ${theme.mainTheme}
- targetAudience: ${theme.targetAudience}
- painPoint: ${theme.painPoint}
- desiredOutcome: ${theme.desiredOutcome}
- purpose: ${theme.purpose}
- cta: ${theme.cta}
- offer: ${theme.offer ?? ""}
- angle: ${theme.angle}

JSONの形:
{
  "themeId": "${theme.id}",
  "instagramCarousel": {
    "title": "string",
    "slides": [
      { "templateType": "cover", "label": "01", "title": "string", "body": "string", "note": "string", "cta": "string" }
    ]
  },
  "instagramCaption": { "hook": "string", "body": "string", "cta": "string", "hashtags": ["string"] },
  "instagramReel": { "title": "string", "hook": "string", "script": "string", "cuts": ["string"], "telops": ["string"], "cta": "string" },
  "youtube": { "title": "string", "thumbnailText": "string", "hook": "string", "outline": ["string"], "script": "string", "description": "string", "cta": "string" },
  "youtubeLives": [
    {
      "title": "string",
      "liveStreamType": "work_with_me",
      "thumbnailText": "string",
      "theme": "string",
      "purpose": "string",
      "targetAudience": "string",
      "scheduledDate": "",
      "startTime": "",
      "estimatedDurationMinutes": 60,
      "openingGreeting": "string",
      "openingHook": "string",
      "outline": ["string"],
      "sections": [{ "title": "string", "estimatedMinutes": 10, "talkingPoints": ["string"], "script": "string" }],
      "chatTopics": ["string"],
      "commentPickupPoints": ["string"],
      "questionsForViewers": ["string"],
      "interactiveIdeas": ["string"],
      "workContent": "string",
      "explanationItems": ["string"],
      "announcement": "string",
      "cta": "string",
      "endingScript": "string",
      "clipIdeas": ["string"],
      "repurposeIdeas": ["string"]
    }
  ],
  "note": { "title": "string", "lead": "string", "headings": ["string"], "body": "string", "cta": "string" },
  "threads": { "posts": ["string"] },
  "x": { "posts": ["string"] }
}

条件:
- instagramCarousel.slides は10枚を目安にしてください。
- youtubeLives は2本作ってください。
- 文章は日本語で、やさしいが薄くない表現にしてください。
- Claude Opusらしく、読者の悩みに深く刺さる自然な文章にしてください。
`.trim();
}

export async function generateContentSet({ theme }: GenerateContentInput): Promise<GenerateContentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      data: generateMockContentSet({ theme }),
      source: "mock"
    };
  }

  const model = process.env.ANTHROPIC_MODEL || defaultAnthropicModel;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 12000,
      system:
        "You are a senior Japanese SNS content strategist. Use the provided tool and do not answer with plain text.",
      tools: [contentSetTool],
      tool_choice: {
        type: "tool",
        name: contentSetTool.name
      },
      messages: [
        {
          role: "user",
          content: buildPrompt({ theme })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    content?: AnthropicContentBlock[];
  };
  const toolInput = payload.content?.find(
    (item) => item.type === "tool_use" && item.name === contentSetTool.name
  )?.input;
  const text = payload.content?.find((item) => item.type === "text")?.text ?? "";
  let parsed = toolInput;

  if (!parsed) {
    try {
      parsed = JSON.parse(extractJson(text)) as unknown;
    } catch {
      throw new Error(
        "Claudeの返答を読み取れませんでした。もう一度「一括生成」を押してください。続く場合はANTHROPIC_MODELを確認してください。"
      );
    }
  }

  if (!isGeneratedContentSet(parsed)) {
    throw new Error("Claude response did not match the expected content JSON shape.");
  }

  return {
    data: {
      ...parsed,
      themeId: theme.id
    },
    source: "claude"
  };
}
