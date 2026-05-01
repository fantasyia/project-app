import { contentToPlainText, isHtmlContent } from "@/lib/blog/content";

export type ArticleHeading = {
  id: string;
  level: 2 | 3 | 4;
  text: string;
};

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function headingId(text: string, index: number) {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return base ? `${base}-${index + 1}` : `secao-${index + 1}`;
}

export function extractArticleHeadings(content?: string | null): ArticleHeading[] {
  if (!content?.trim()) return [];

  if (isHtmlContent(content)) {
    const matches = content.matchAll(/<h([2-4])[^>]*>([\s\S]*?)<\/h\1>/gi);

    return Array.from(matches)
      .map((match, index) => {
        const text = stripTags(match[2] || "");

        return {
          id: headingId(text, index),
          level: Number(match[1]) as ArticleHeading["level"],
          text,
        };
      })
      .filter((heading) => heading.text.length > 0);
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^#{2,4}\s+/.test(line))
    .map((line, index) => {
      const level = Math.min(4, Math.max(2, line.match(/^#+/)?.[0].length || 2)) as ArticleHeading["level"];
      const text = line.replace(/^#{2,4}\s+/, "").trim();

      return {
        id: headingId(text, index),
        level,
        text,
      };
    });
}

export function getArticleStats(content?: string | null) {
  const plainText = contentToPlainText(content);
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const headings = extractArticleHeadings(content);
  const readingTime = Math.max(1, Math.ceil(words / 190));

  return {
    plainText,
    words,
    headings,
    readingTime,
  };
}
