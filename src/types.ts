export type RedditComment = {
  author: string;
  comment: string;
  replies: RedditComment[];
};

export type ParsedPost = {
  title: string;
  author: string;
  upvotes: number | null;
  url: string;
  posted_at: string;
};

export type ScrapedPost = ParsedPost & {
  comments: RedditComment[];
};

export type ScrapeResult = Record<string, ScrapedPost[]>;


