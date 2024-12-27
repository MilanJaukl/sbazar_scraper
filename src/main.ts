/**
 * This template is a production ready boilerplate for developing with `PlaywrightCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

// For more information, see https://docs.apify.com/sdk/js
import { Actor } from "apify";
// For more information, see https://crawlee.dev
import { PlaywrightCrawler } from "crawlee";
// this is ESM project, and as such, it requires you to specify extensions in your relative imports
// read more about this here: https://nodejs.org/docs/latest-v18.x/api/esm.html#mandatory-file-extensions
// note that we need to use `.js` even when inside TS files
import { router } from "./routes.js";

interface Input {
    searchQuery: string;
    maxRequestsPerCrawl: number;
}

// Initialize the Apify SDK
await Actor.init();

// Structure of input is defined in input_schema.json
const {
    searchQuery = "clean code", // Default search query
    maxRequestsPerCrawl = 100,
} = (await Actor.getInput<Input>()) ?? ({} as Input);

// Encode the search query for use in the URL
const encodedQuery = encodeURIComponent(searchQuery);
const startUrl = `https://www.sbazar.cz/hledej/${encodedQuery}`;

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new PlaywrightCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl,
    requestHandler: router,
    launchContext: {
        launchOptions: {
            headless: false, // Disable headless mode to show the browser UI
        },
    },
    preNavigationHooks: [
        async ({ page, request }) => {
            await page.goto(request.url, { waitUntil: "load" });
        },
    ],
});

await crawler.run([{ url: startUrl, label: "search-results" }]);

// Exit successfully
await Actor.exit();
