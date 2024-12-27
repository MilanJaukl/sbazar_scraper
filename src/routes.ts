import { Dataset, createPlaywrightRouter } from "crawlee";

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ page, log, request, enqueueLinks }) => {
    log.info(`Scraping search results page: ${request.url}`);
    // Wait for the shadow host element
    const shadowHost = await page.waitForSelector(
        '[data-testid="dialog-overlay"]'
    );

    // Access the shadow root of the shadow host
    const shadowRoot = await shadowHost.evaluateHandle(
        (host) => host.shadowRoot
    );

    // Query the button inside the shadow DOM and click it
    const buttonClicked = await shadowRoot.evaluate((shadow) => {
        const button = shadow.querySelector(
            'button[data-testid="cw-button-agree-with-ads"]'
        );
        if (button) {
            button.click();
            return true; // Return a flag to indicate success
        }
        return false;
    });

    if (buttonClicked) {
        console.log("Button clicked successfully!");
    } else {
        console.log("Button not found inside shadow DOM.");
    }

    // Extract advertisements from the search results
    const ads = await page.$$eval(".c-item.c-item--uw", (elements) => {
        return elements.map((el) => {
            const title =
                el.querySelector(".c-item__name-text")?.textContent?.trim() ||
                "";
            const price =
                el.querySelector(".c-price__price")?.textContent?.trim() || "";
            const locality =
                el.querySelector(".c-c-item__locality")?.textContent?.trim() ||
                "";
            const url = el.querySelector("a")?.href || "";
            return { title, price, locality, url };
        });
    });

    // Save ads to the dataset
    for (const ad of ads) {
        await Dataset.pushData(ad);
    }

    log.info(`Scraped ${ads.length} advertisements`);

    // Enqueue next page if pagination is available
    await enqueueLinks({
        globs: ["https://www.sbazar.cz/hledej/*?page=*"], // Match pagination links
        label: "search-results", // Continue processing pagination
    });
});
