// Inline text of the blocks (docs/site-contract.md#blocks): plain text with five marks,
// `**bold**`, `*italic*`, `~subscript~`, `^superscript^` and `[label](url)`. Anything else is
// text, HTML included. Subscripts and superscripts hold no space: "~20 km" stays as written.

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const SAFE_URL = /^(https?:\/\/|\/(?!\/)|#|mailto:)/i;

const SUB = /~([^~\s]+)~/g;
const SUP = /\^([^^\s]+)\^/g;

function marks(text: string): string {
  return escape(text)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(SUB, "<sub>$1</sub>")
    .replace(SUP, "<sup>$1</sup>");
}

/** HTML of an inline text. Links that leave the site open in a new tab. */
export function inlineHtml(text: string): string {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [all, label, url] = m;
    html += marks(text.slice(last, m.index));
    last = m.index + all.length;
    if (!SAFE_URL.test(url!)) {
      html += marks(label!);
      continue;
    }
    const external = /^https?:\/\//i.test(url!);
    html += `<a href="${escape(url!)}"${external ? ' rel="noopener" target="_blank"' : ""}>${marks(label!)}</a>`;
  }
  return html + marks(text.slice(last));
}

/** The text without its marks (search, reading time, descriptions). */
export function inlineText(text: string): string {
  return text
    .replace(LINK, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(SUB, "$1")
    .replace(SUP, "$1");
}

/** Internal links of an inline text (paths starting with /). */
export function inlineLinks(text: string): string[] {
  return [...text.matchAll(LINK)].map((m) => m[2]!).filter((url) => /^\/(?!\/)/.test(url));
}
