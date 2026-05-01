const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

function decodeHtmlEntities(content: string) {
  return content
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtml(content: string) {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isHtmlContent(content?: string | null) {
  return Boolean(content && HTML_TAG_PATTERN.test(content));
}

export function contentToPlainText(content?: string | null) {
  if (!content) return "";

  if (isHtmlContent(content)) {
    return decodeHtmlEntities(
      content
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|blockquote)>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  return content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^-\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function legacyContentToHtml(content?: string | null) {
  if (!content?.trim()) {
    return "<p>Abra com contexto, promessa editorial e o angulo do artigo.</p><h2>Secao principal</h2><p>Desenvolva a ideia central com clareza.</p><h3>Subsecao</h3><p>Aprofunde o ponto com um exemplo pratico.</p><ul><li>Defina a keyword</li><li>Garanta um H2 forte</li><li>Feche com CTA</li></ul><h3>Proximo passo</h3><p>Conduza o leitor para a proxima acao.</p>";
  }

  if (isHtmlContent(content)) {
    return content;
  }

  const lines = content.split("\n");
  const blocks: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    if (!paragraph) return;
    blocks.push(`<p>${escapeHtml(paragraph)}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      `<ul>${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("# ")) {
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote><p>${escapeHtml(line.slice(2).trim())}</p></blockquote>`);
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

  return blocks.join("");
}
