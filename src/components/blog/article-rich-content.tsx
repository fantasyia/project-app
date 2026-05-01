import { isHtmlContent } from "@/lib/blog/content";
import { extractArticleHeadings } from "@/lib/miniwordpress/article-analysis";

type ArticleRichContentProps = {
  content?: string | null;
};

function addHeadingAnchors(content: string) {
  let headingIndex = 0;
  const headings = extractArticleHeadings(content);

  return content.replace(/<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const heading = headings[headingIndex];
    headingIndex += 1;

    if (!heading || /\sid=/.test(attrs)) return match;
    return `<h${level}${attrs} id="${heading.id}">${inner}</h${level}>`;
  });
}

function pushParagraph(blocks: React.ReactNode[], lines: string[], key: string) {
  const paragraph = lines.join(" ").trim();
  if (!paragraph) return;

  blocks.push(
    <p key={key} className="text-lg font-light leading-8 text-brand-text-base">
      {paragraph}
    </p>
  );
}

function pushList(blocks: React.ReactNode[], items: string[], key: string) {
  if (items.length === 0) return;

  blocks.push(
    <ul key={key} className="space-y-3 rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-5">
      {items.map((item, index) => (
        <li key={`${key}-${index}`} className="flex gap-3 text-base font-light leading-7 text-brand-text-base">
          <span className="mt-2 h-2 w-2 rounded-full bg-brand-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LegacyMarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    pushParagraph(blocks, paragraphLines, `paragraph-${blocks.length}`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    pushList(blocks, listItems, `list-${blocks.length}`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("# ")) continue;

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="text-3xl font-thin tracking-[-0.03em] text-white">
          {line.slice(3).trim()}
        </h2>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-2xl font-light tracking-[-0.02em] text-white">
          {line.slice(4).trim()}
        </h3>
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="rounded-[28px] border border-brand-500/20 bg-brand-500/8 px-6 py-5 text-lg font-light italic leading-8 text-brand-text-base"
        >
          {line.slice(2).trim()}
        </blockquote>
      );
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  if (blocks.length === 0) {
    return <p className="text-lg font-light leading-8 text-brand-text-base">Conteudo indisponivel.</p>;
  }

  return <div className="space-y-6">{blocks}</div>;
}

export function ArticleRichContent({ content }: ArticleRichContentProps) {
  if (!content?.trim()) {
    return <p className="text-lg font-light leading-8 text-brand-text-base">Conteudo indisponivel.</p>;
  }

  if (isHtmlContent(content)) {
    return (
      <div
        className="editor-public-preview space-y-6 scroll-smooth [&_a]:text-brand-400 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:rounded-[28px] [&_blockquote]:border-l-4 [&_blockquote]:border-brand-500/60 [&_blockquote]:bg-brand-500/8 [&_blockquote]:px-6 [&_blockquote]:py-5 [&_blockquote_p]:m-0 [&_h2]:scroll-mt-24 [&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:font-thin [&_h2]:tracking-[-0.03em] [&_h3]:scroll-mt-24 [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-light [&_h3]:tracking-[-0.02em] [&_h4]:scroll-mt-24 [&_h4]:mt-5 [&_h4]:text-xl [&_h4]:font-light [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3 [&_p]:text-lg [&_p]:font-light [&_p]:leading-8 [&_p]:text-brand-text-base [&_ul]:space-y-3"
        dangerouslySetInnerHTML={{ __html: addHeadingAnchors(content) }}
      />
    );
  }

  return <LegacyMarkdownContent content={content} />;
}
