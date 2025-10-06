import { Router, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { scrapeSubreddit } from "../utils/scrape";

const router = Router();

// Basic in-memory concurrency limit and timeout settings
const MAX_CONCURRENT_SCRAPES = 1; // adjust as needed
const SCRAPE_TIMEOUT_MS = 90_000; // 90s
let inFlightScrapes = 0;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("SCRAPE_TIMEOUT")), ms);
        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

const validateSubreddit = [
    query("subreddit")
        .exists().withMessage("subreddit is required")
        .bail()
        .isString().withMessage("subreddit must be a string")
        .bail()
        .trim()
        .matches(/^[A-Za-z0-9_]{2,21}$/).withMessage("invalid subreddit format"),
];

router.get(
    "/scrape",
    [
        ...validateSubreddit,   
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const subreddit = req.query.subreddit as string;
        if (inFlightScrapes >= MAX_CONCURRENT_SCRAPES) {
            return res.status(429).json({ message: "Too many concurrent requests. Please try again shortly." });
        }
        inFlightScrapes += 1;
        try {
            const data = await withTimeout(scrapeSubreddit(subreddit), SCRAPE_TIMEOUT_MS);
            res.status(200).json(data);
        } catch (error: any) {
            if (error && error.message === "SCRAPE_TIMEOUT") {
                console.error("Scrape timed out for:", subreddit);
                return res.status(503).json({ message: "Scrape timed out. Please try again." });
            }
            console.error("Error scraping subreddit:", error);
            res.status(500).json({ message: "Error scraping subreddit" });
        } finally {
            inFlightScrapes -= 1;
        }
    }
);

export default router;
