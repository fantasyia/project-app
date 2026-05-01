import { expect, test } from "@playwright/test";
import { assertStablePage, captureScreenshot } from "./helpers";

const publicRoutes = ["/", "/pricing", "/blog"];

for (const route of publicRoutes) {
  test(`public smoke: ${route}`, async ({ page }, testInfo) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response).not.toBeNull();
    expect((response?.status() || 500) < 500).toBeTruthy();

    await page.waitForTimeout(800);
    await assertStablePage(page);
    await captureScreenshot(page, testInfo);
  });
}
