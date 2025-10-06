import { ParsedPost } from "../types";
import { normalizeTimestampToISO } from "./time";

export function parseShredditElement(el: Element): ParsedPost {
  const titleAttr = (el as HTMLElement).getAttribute('post-title') || '';
  const authorAttr = (el as HTMLElement).getAttribute('author') || '';
  const scoreAttr = (el as HTMLElement).getAttribute('score') || '';
  const permalinkAttr = (el as HTMLElement).getAttribute('permalink') || '';
  const createdTsAttr = (el as HTMLElement).getAttribute('created-timestamp') || '';

  const title = titleAttr.trim() || (el.querySelector('a[slot="title"]')?.textContent?.trim() || 'Untitled');
  const author = authorAttr.trim() || 'Unknown';
  const upvotes = scoreAttr ? Number(scoreAttr) : null;
  const url = permalinkAttr ? `https://www.reddit.com${permalinkAttr}` : '';

  // Prefer precise attribute converted to ISO; fallback to any time element datetime/title
  const iso = normalizeTimestampToISO(createdTsAttr);
  let posted_at = iso;
  if (!posted_at) {
    const timeEl = el.querySelector('faceplate-timeago time');
    const dateTimeAttr = timeEl?.getAttribute('datetime') || timeEl?.getAttribute('title') || '';
    posted_at = normalizeTimestampToISO(dateTimeAttr);
  }

  return { title, author, upvotes: Number.isNaN(upvotes) ? null : upvotes, url, posted_at };
}


