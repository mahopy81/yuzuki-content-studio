import type { CreatePageParameters } from "@notionhq/client/build/src/api-endpoints";

const MAX_RICH_TEXT_LENGTH = 1900;

export type NotionPropertyMap = NonNullable<CreatePageParameters["properties"]>;

export function titleProperty(value: string) {
  return {
    title: [
      {
        text: {
          content: value || "Untitled"
        }
      }
    ]
  };
}

export function richTextProperty(value?: string) {
  return {
    rich_text: value
      ? [
          {
            text: {
              content: value.slice(0, MAX_RICH_TEXT_LENGTH)
            }
          }
        ]
      : []
  };
}

export function selectProperty(value?: string) {
  return value
    ? {
        select: {
          name: value
        }
      }
    : { select: null };
}

export function dateProperty(value?: string) {
  return value
    ? {
        date: {
          start: value
        }
      }
    : { date: null };
}

export function numberProperty(value?: number) {
  return {
    number: typeof value === "number" && Number.isFinite(value) ? value : null
  };
}

export function checkboxProperty(value?: boolean) {
  return {
    checkbox: Boolean(value)
  };
}

export function urlProperty(value?: string) {
  return {
    url: value || null
  };
}

export function multiSelectProperty(values?: string[]) {
  return {
    multi_select: (values ?? []).filter(Boolean).map((value) => ({ name: value }))
  };
}

export function relationProperty(pageId?: string) {
  return {
    relation: pageId ? [{ id: pageId }] : []
  };
}

export function getProperty(properties: unknown, key: string) {
  if (!properties || typeof properties !== "object") {
    return undefined;
  }

  return (properties as Record<string, unknown>)[key];
}

export function readTitle(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("title" in property)) {
    return "";
  }

  const title = (property as { title?: { plain_text?: string }[] }).title ?? [];
  return title.map((item) => item.plain_text ?? "").join("");
}

export function readRichText(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("rich_text" in property)) {
    return "";
  }

  const richText = (property as { rich_text?: { plain_text?: string }[] }).rich_text ?? [];
  return richText.map((item) => item.plain_text ?? "").join("");
}

export function readSelect(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("select" in property)) {
    return undefined;
  }

  return (property as { select?: { name?: string } | null }).select?.name;
}

export function readDate(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("date" in property)) {
    return undefined;
  }

  return (property as { date?: { start?: string } | null }).date?.start;
}

export function readNumber(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("number" in property)) {
    return undefined;
  }

  return (property as { number?: number | null }).number ?? undefined;
}

export function readCheckbox(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("checkbox" in property)) {
    return false;
  }

  return Boolean((property as { checkbox?: boolean }).checkbox);
}

export function readUrl(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("url" in property)) {
    return "";
  }

  return (property as { url?: string | null }).url ?? "";
}

export function readMultiSelect(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("multi_select" in property)) {
    return [];
  }

  return ((property as { multi_select?: { name?: string }[] }).multi_select ?? [])
    .map((item) => item.name)
    .filter((value): value is string => Boolean(value));
}

export function readRelationId(properties: unknown, key: string) {
  const property = getProperty(properties, key);

  if (!property || typeof property !== "object" || !("relation" in property)) {
    return undefined;
  }

  return (property as { relation?: { id?: string }[] }).relation?.[0]?.id;
}
