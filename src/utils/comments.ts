import { Page } from "playwright";
import { RedditComment } from "../types";

// Fetch comments for a post using Reddit's JSON endpoint, limited to 5 top-level
export async function fetchPostComments(page: Page, postUrl: string): Promise<RedditComment[]> {
  try {
    const jsonUrl = postUrl.endsWith("/") ? `${postUrl}.json?limit=5` : `${postUrl}/.json?limit=5`;
    const response = await page.request.get(jsonUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 SubSpy/1.0 (Playwright)"
      },
      timeout: 30000,
    });

    if (!response.ok()) return [];
    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return [];
    const commentsListing = data[1]?.data?.children ?? [];

    const parseNode = (node: any): RedditComment | null => {
      if (!node || node.kind !== "t1") return null;
      const body = node.data?.body?.toString() ?? "";
      const author = node.data?.author?.toString() ?? "Unknown";
      const repliesData = node.data?.replies?.data?.children ?? [];
      const replies: RedditComment[] = [];
      for (const child of repliesData) {
        const parsed = parseNode(child);
        if (parsed) replies.push(parsed);
      }
      return { author, comment: body, replies };
    };

    const topLevel: RedditComment[] = [];
    for (const c of commentsListing) {
      if (topLevel.length >= 5) break;
      const parsed = parseNode(c);
      if (parsed) topLevel.push(parsed);
    }
    return topLevel;
  } catch {
    return [];
  }
}


