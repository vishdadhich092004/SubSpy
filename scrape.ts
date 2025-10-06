import fs from "fs";
import path from "path";
import { scrapeSubreddit } from "./src/utils/scrape";

async function main() {
  const [, , subreddit] = process.argv;
  if (!subreddit) {
    console.error("Usage: ts-node scrape.ts <subreddit>");
    process.exit(1);
  }

  try {
    const result = await scrapeSubreddit(subreddit);
    const outPath = path.resolve(__dirname, "reddit_results.json");
    await fs.promises.writeFile(outPath, JSON.stringify(result, null, 2), "utf8");
    console.log(`Wrote results to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error("Error while scraping:", err);
    process.exit(1);
  }
}

main();


