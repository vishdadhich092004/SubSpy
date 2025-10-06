import { chromium } from "playwright";
import { fetchPostComments } from "./comments";
import { normalizeTimestampToISO } from "./time";
import { ScrapeResult } from "../types";

export const scrapeSubreddit = async (subreddit: string): Promise<ScrapeResult> => {
  const browser = await chromium.launch({ headless: true, args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
  ] });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    const url = `https://www.reddit.com/r/${subreddit}/new/`;
    
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    // Small politeness delay after navigation
    await page.waitForTimeout(700);

    // Wait for first post to appear (graceful handling if it doesn't)
    try {
      await page.waitForSelector('shreddit-post', { timeout: 30000 });
    } catch {
      return { [subreddit]: [] };
    }

    // Ensure at least 10 posts are present via progressive scroll + waits
    let attempts = 0;
    await page.evaluate(() => window.scrollTo(0, 0));
    while (attempts < 10) {
      const count = await page.evaluate(() => document.querySelectorAll('shreddit-post').length);
      if (count >= 10) break;
      await page.evaluate(() => window.scrollBy(0, 1800));
      await page.waitForTimeout(700);
      attempts += 1;
    }

    // Scrape latest up to 10 posts 
    const handles = await page.$$('shreddit-post');
    const limited = handles.slice(0, 10);
    const posts = [] as Array<{
      title: string;
      author: string;
      upvotes: number | null;
      url: string;
      posted_at: string;
      comments: Array<{ author: string; comment: string; replies: any[] }>;
    }>;

    for (const el of limited) {
      const [titleAttr, authorAttr, scoreAttr, permalinkAttr] = await Promise.all([
        el.getAttribute('post-title'),
        el.getAttribute('author'),
        el.getAttribute('score'),
        el.getAttribute('permalink'),
      ]);

      const title = (titleAttr ?? '').trim() || (await el.evaluate((node) => node.querySelector('a[slot="title"]')?.textContent?.trim() || 'Untitled'));
      const author = (authorAttr ?? '').trim() || 'Unknown';
      const upvotesRaw = (scoreAttr ?? '').trim();
      const upvotes = upvotesRaw ? Number(upvotesRaw) : null;
      const url = permalinkAttr ? `https://www.reddit.com${permalinkAttr}` : '';

      // posted_at from precise created-timestamp attribute if present, normalized to ISO
      const created = await el.getAttribute('created-timestamp');
      let posted_at = normalizeTimestampToISO(created || '');
      if (!posted_at) {
        const fallback = await el.evaluate((node) => node.querySelector('faceplate-timeago time')?.getAttribute('datetime') || node.querySelector('faceplate-timeago time')?.getAttribute('title') || '');
        posted_at = normalizeTimestampToISO(fallback || '');
      }

      // Small delay between actions per post
      await page.waitForTimeout(500);
      const comments = url ? await fetchPostComments(page, url) : [];

      posts.push({ title, author, upvotes: Number.isNaN(upvotes as number) ? null : upvotes, url, posted_at, comments });
    }

    return { [subreddit]: posts };
  } catch (error) {
    console.error(` Error scraping subreddit: ${error}`);
    // Robustness: return empty list instead of crashing
    return { [subreddit]: [] };
  } finally {
    await browser.close();
  }
};
